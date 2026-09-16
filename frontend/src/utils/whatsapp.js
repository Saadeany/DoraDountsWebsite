// Normalizes a stored phone number into WhatsApp's wa.me digit-only format
// (country code + number, no +, no spaces). Assumes Egyptian numbers when a
// local number is stored without a country code (e.g. "01001234567"),
// since that's this store's primary market — adjust the "20" prefix below
// if you expand elsewhere.
export const toWhatsAppNumber = (phone) => {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);       // "0020..." -> "20..."
  if (digits.startsWith("0")) digits = `20${digits.slice(1)}`; // "01001234567" -> "201001234567"
  return digits;
};

// Builds a wa.me link with a pre-filled message. If there's no usable phone
// number, falls back to a link with no target number (WhatsApp will prompt
// the admin to pick a contact) so the button still does something useful.
export const buildWhatsAppLink = (phone, message) => {
  const number = toWhatsAppNumber(phone);
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
};
