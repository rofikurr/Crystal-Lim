import { isValidPostalCode } from "../../../../lib/validation";
import type { AddressInput } from "../../../../db/addresses";

const str = (value: unknown, max: number) =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max ? value.trim() : null;

export function parseAddressInput(body: Record<string, unknown>): AddressInput | null {
  const label = str(body.label, 40);
  const recipientName = str(body.recipientName, 140);
  const phone = str(body.phone, 32);
  const province = str(body.province, 80);
  const city = str(body.city, 80);
  const district = str(body.district, 80);
  const village = str(body.village, 80);
  const address = str(body.address, 2000);
  const postal = typeof body.postal === "string" && isValidPostalCode(body.postal) ? body.postal : null;
  if (!label || !recipientName || !phone || !province || !city || !district || !village || !address || !postal) {
    return null;
  }
  return {
    label,
    recipientName,
    phone,
    province,
    city,
    district,
    village,
    address,
    postal,
    isDefault: body.isDefault === true,
  };
}
