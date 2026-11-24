// "retail" (Alfamart/Indomaret) belum diaktifkan di akun Xendit ini (perlu
// pengajuan terpisah ke Xendit) — jangan tambahkan lagi sampai sudah aktif,
// sudah dites: createInvoice menolak dengan "unsupported IDR payment methods".
export const PAYMENT_METHOD_KEYS = ["qris", "va", "ewallet", "card"] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD_KEYS)[number];

type FeeRule = { percent: number; flat: number; xenditChannels: string[] };

/**
 * Tarif publik umum Xendit (bukan tarif negosiasi akun ini) — dipakai sebagai
 * perkiraan biaya admin yang dibebankan ke pembeli, bukan ditanggung toko.
 * Cek dashboard Xendit untuk tarif pasti akun ini dan sesuaikan di sini kalau
 * beda. Fee dihitung dari (subtotal + ongkir), dibulatkan ke atas.
 */
const FEE_RULES: Record<PaymentMethod, FeeRule> = {
  qris: { percent: 0.007, flat: 0, xenditChannels: ["QRIS"] },
  va: { percent: 0, flat: 4000, xenditChannels: ["BCA", "BNI", "BRI", "MANDIRI", "PERMATA"] },
  ewallet: { percent: 0.02, flat: 0, xenditChannels: ["OVO", "DANA", "LINKAJA", "SHOPEEPAY"] },
  card: { percent: 0.029, flat: 2000, xenditChannels: ["CREDIT_CARD"] },
};

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHOD_KEYS as readonly string[]).includes(value);
}

export function calculatePaymentFee(method: PaymentMethod, amountBeforeFee: number): number {
  const rule = FEE_RULES[method];
  return Math.ceil(amountBeforeFee * rule.percent + rule.flat);
}

export function xenditChannelsFor(method: PaymentMethod): string[] {
  return FEE_RULES[method].xenditChannels;
}
