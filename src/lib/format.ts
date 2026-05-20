export function formatPrice(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-DE", {
    style: "currency",
    currency,
  }).format(amount);
}
