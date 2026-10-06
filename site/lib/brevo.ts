export class BrevoError extends Error {}

export async function subscribeToNewsletter(email: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;
  if (!apiKey || !listId) throw new BrevoError("Newsletter belum dikonfigurasi.");

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      email,
      listIds: [Number(listId)],
      updateEnabled: true,
    }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new BrevoError(data?.message || "Gagal mendaftarkan email ke newsletter.");
  }
}
