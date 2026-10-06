export class XenditError extends Error {}

export async function createInvoice(input: {
  externalId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: { name: string; quantity: number; price: number }[];
  successUrl: string;
  failureUrl: string;
}): Promise<{ invoiceId: string; invoiceUrl: string }> {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) throw new XenditError("XENDIT_SECRET_KEY belum diset.");

  const response = await fetch("https://api.xendit.co/v2/invoices/", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      external_id: input.externalId,
      amount: input.amount,
      currency: "IDR",
      description: `Pesanan Crystal Lim ${input.externalId}`,
      customer: {
        given_names: input.customerName,
        email: input.customerEmail,
        mobile_number: input.customerPhone,
      },
      items: input.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      success_redirect_url: input.successUrl,
      failure_redirect_url: input.failureUrl,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new XenditError(data?.message || "Gagal membuat invoice Xendit.");
  }
  return { invoiceId: data.id, invoiceUrl: data.invoice_url };
}

export function verifyCallbackToken(request: Request): boolean {
  const token = process.env.XENDIT_CALLBACK_TOKEN;
  if (!token) return false;
  return request.headers.get("x-callback-token") === token;
}
