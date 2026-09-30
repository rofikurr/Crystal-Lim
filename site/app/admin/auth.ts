import { getChatGPTUser } from "../chatgpt-auth";

const OWNER_EMAIL = "aditamarizki@gmail.com";

export async function getAdmin() {
  const user = await getChatGPTUser();
  if (!user) return null;
  if (user.email.toLowerCase() === OWNER_EMAIL) return user;
  // Mock identity exists only in the local development server.
  if (import.meta.env.DEV && user.email === "seedy@sites.test") return user;
  return null;
}

export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
