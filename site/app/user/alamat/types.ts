export type Address = {
  id: number;
  userId: number;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  village: string;
  address: string;
  postal: string;
  isDefault: boolean;
};

export type AddressInput = Omit<Address, "id" | "userId">;

export const EMPTY_ADDRESS: AddressInput = {
  label: "",
  recipientName: "",
  phone: "",
  province: "",
  city: "",
  district: "",
  village: "",
  address: "",
  postal: "",
  isDefault: false,
};
