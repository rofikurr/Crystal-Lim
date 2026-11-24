export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
export const PHONE_PATTERN = /^[+0-9 ()-]{9,20}$/;
export const POSTAL_PATTERN = /^[0-9]{5}$/;
// Kode pos luar negeri formatnya macam-macam (huruf+angka, ada spasi/strip,
// panjang beda-beda) — jangan dipaksa format Indonesia.
export const INTERNATIONAL_POSTAL_PATTERN = /^[A-Za-z0-9\s-]{2,12}$/;
export const ROLE_SLUG_PATTERN = /^[a-z][a-z0-9_-]{1,63}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value);
}

export function isValidPostalCode(value: string): boolean {
  return POSTAL_PATTERN.test(value);
}

export function isValidInternationalPostalCode(value: string): boolean {
  return INTERNATIONAL_POSTAL_PATTERN.test(value);
}
