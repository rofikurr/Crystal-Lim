import { listProducts } from "../db/catalog";
import { getSetting, getNumericSetting } from "../db/settings";
import { calculateDomesticCost, searchDestination, type ShippingOption } from "./rajaongkir";

export type ShippingMode = "flat" | "auto";

/**
 * Mode ongkir — eksplisit, diatur superadmin di halaman Pengaturan, BUKAN
 * ditentukan diam-diam dari ada/tidaknya konfigurasi RajaOngkir. Default
 * "auto" supaya konsisten dengan yang sudah dikonfigurasi & diuji sejauh ini;
 * kalau origin belum pernah diisi, mode "auto" otomatis jatuh ke flat lewat
 * jalur fallback yang sudah ada (bukan karena mode-nya "flat").
 */
export async function getShippingMode(): Promise<ShippingMode> {
  const mode = await getSetting("shipping_mode", "auto");
  return mode === "flat" ? "flat" : "auto";
}

// Standar JNE: berat volumetrik (kg) = Panjang×Lebar×Tinggi(cm) / 5000.
// Dipilih 5000 (bukan 6000 yang juga umum dipakai) karena menghasilkan angka
// LEBIH BESAR untuk dimensi yang sama — lebih aman buat toko (tidak under-
// estimate ongkir yang nanti beneran ditagih kurir ke kita).
const VOLUMETRIC_DIVISOR_CM3_PER_KG = 5000;

// Layanan kargo/trucking (mis. JNE JTR) punya berat minimum ~10kg per koli —
// kalau ditampilkan apa adanya buat paket kecil, RajaOngkir tetap balikin
// harga dihitung seolah 10kg penuh (jadi kelihatan jutaan buat cincin 500g).
// Sembunyikan layanan jenis ini kalau total paket masih jauh di bawah itu.
const BULK_CARGO_MIN_WEIGHT_GRAMS = 10_000;

function isBulkCargoService(option: { service: string; description: string }): boolean {
  return /trucking/i.test(option.description) || /^jtr/i.test(option.service);
}

/** Berat tertagih kurir = MAX(berat aktual, berat volumetrik dari dimensi packing). */
function chargeableWeightGrams(product: { packedWeight: number; packedLength: number; packedWidth: number; packedHeight: number }): number {
  const volumetricGrams =
    (product.packedLength * product.packedWidth * product.packedHeight * 1000) / VOLUMETRIC_DIVISOR_CM3_PER_KG;
  return Math.max(product.packedWeight, volumetricGrams);
}

async function totalChargeableWeight(items: { productId: string; quantity: number }[]): Promise<number | null> {
  const catalog = await listProducts(true);
  const byId = new Map(catalog.map((p) => [p.id, p]));
  let weightGrams = 0;
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) return null; // data tidak konsisten (produk sudah dihapus dll)
    weightGrams += chargeableWeightGrams(product) * item.quantity;
  }
  return weightGrams > 0 ? Math.ceil(weightGrams) : null;
}

/**
 * Daftar opsi ongkir asli dari RajaOngkir untuk ditampilkan ke customer
 * (tombol "Cek Ongkos Kirim" di storefront). Dipanggil cuma saat customer
 * klik tombolnya, bukan otomatis — supaya kuota API (100 hit/hari di paket
 * Starter) tidak kepakai cuma karena orang buka keranjang.
 */
export async function getShippingOptions(input: {
  postal: string;
  items: { productId: string; quantity: number }[];
}): Promise<ShippingOption[]> {
  if ((await getShippingMode()) === "flat") return [];

  const originId = await getNumericSetting("shipping_origin_id", 0);
  if (originId <= 0) return [];

  const weightGrams = await totalChargeableWeight(input.items);
  if (!weightGrams) return [];

  const destinations = await searchDestination(input.postal);
  if (destinations.length === 0) return [];

  const options = await calculateDomesticCost({ originId, destinationId: destinations[0].id, weightGrams });
  if (weightGrams < BULK_CARGO_MIN_WEIGHT_GRAMS) {
    return options.filter((option) => !isBulkCargoService(option));
  }
  return options;
}

/**
 * Ongkir yang BENERAN dipakai & ditagih — dihitung ulang di server saat
 * checkout, tidak pernah percaya harga yang dikirim client. Kalau customer
 * sempat pilih kurir+layanan lewat tombol "Cek Ongkos Kirim", carikan opsi
 * yang cocok itu; kalau tidak ketemu lagi (misal tarif berubah) atau customer
 * tidak sempat pilih, pakai yang termurah. Kalau origin belum diset atau
 * RajaOngkir error/kuota habis, jatuh balik diam-diam ke `shipping_flat_fee`
 * — checkout tidak boleh gagal gara-gara ini.
 */
export async function computeShippingFee(input: {
  postal: string;
  items: { productId: string; quantity: number }[];
  preferredCourier?: string;
  preferredService?: string;
}): Promise<number> {
  const flatFee = await getNumericSetting("shipping_flat_fee", 0);
  if ((await getShippingMode()) === "flat") return flatFee; // jangan buang kuota RajaOngkir kalau mode flat

  try {
    const options = await getShippingOptions(input);
    if (options.length === 0) return flatFee;

    if (input.preferredCourier && input.preferredService) {
      const match = options.find(
        (o) => o.courier === input.preferredCourier && o.service === input.preferredService,
      );
      if (match) return match.cost;
    }
    return Math.min(...options.map((o) => o.cost));
  } catch (error) {
    console.error("Ongkir RajaOngkir gagal dihitung, pakai flat fee", error);
    return flatFee;
  }
}
