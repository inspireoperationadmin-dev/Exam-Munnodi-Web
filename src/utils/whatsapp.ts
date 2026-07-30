const supportWhatsAppNumber = '94763143738';

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${supportWhatsAppNumber}?text=${encodeURIComponent(message)}`;
}
