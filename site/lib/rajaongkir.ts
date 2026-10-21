const RAJAONGKIR_BASE_URL = "https://rajaongkir.komerce.id/api/v1";

export class RajaOngkirError extends Error {}

function apiKey(): string {
  const key = process.env.RAJAONGKIR_API_KEY;
  if (!key) throw new RajaOngkirError("RAJAONGKIR_API_KEY belum diset.");
  return key;
}

export type DestinationOption = {
  id: number;
  label: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  zipCode: string;
};

/** Cari ID lokasi RajaOngkir berdasar nama kota/kecamatan/kelurahan (dibutuhkan asal & tujuan ongkir). */
export async function searchDestination(query: string): Promise<DestinationOption[]> {
  const url = new URL(`${RAJAONGKIR_BASE_URL}/destination/domestic-destination`);
  url.searchParams.set("search", query);
  url.searchParams.set("limit", "10");
  url.searchParams.set("offset", "0");

  const response = await fetch(url, { headers: { key: apiKey() } });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.meta?.status !== "success") {
    throw new RajaOngkirError(data?.meta?.message || "Pencarian lokasi gagal.");
  }
  return (data.data ?? []).map(
    (row: {
      id: number;
      label: string;
      province_name: string;
      city_name: string;
      district_name: string;
      subdistrict_name: string;
      zip_code: string;
    }) => ({
      id: row.id,
      label: row.label,
      province: row.province_name,
      city: row.city_name,
      district: row.district_name,
      subdistrict: row.subdistrict_name,
      zipCode: row.zip_code,
    }),
  );
}

// Starter (akun gratis) cuma dapat subset kurir — dicek empiris lewat API,
// bukan dari dokumentasi publik yang simpang siur. Update daftar ini kalau
// akun di-upgrade ke paket yang lebih tinggi.
export const SUPPORTED_COURIERS = ["jne", "lion"] as const;

export type ShippingOption = {
  courier: string;
  courierName: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
};

/** Hitung ongkir ke semua kurir yang didukung sekaligus; kurir yang tidak tersedia di paket akun dilewati diam-diam. */
export async function calculateDomesticCost(input: {
  originId: number;
  destinationId: number;
  weightGrams: number;
}): Promise<ShippingOption[]> {
  const key = apiKey();
  const results: ShippingOption[] = [];

  await Promise.all(
    SUPPORTED_COURIERS.map(async (courier) => {
      const response = await fetch(`${RAJAONGKIR_BASE_URL}/calculate/domestic-cost`, {
        method: "POST",
        headers: { key, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          origin: String(input.originId),
          destination: String(input.destinationId),
          weight: String(input.weightGrams),
          courier,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.meta?.status !== "success" || !Array.isArray(data.data)) {
        return; // kurir ini tidak tersedia di paket akun — lewati, bukan error fatal
      }
      for (const row of data.data as {
        name: string;
        code: string;
        service: string;
        description: string;
        cost: number;
        etd: string;
      }[]) {
        results.push({
          courier: row.code,
          courierName: row.name,
          service: row.service,
          description: row.description,
          cost: row.cost,
          etd: row.etd,
        });
      }
    }),
  );

  return results;
}
