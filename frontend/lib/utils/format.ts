const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

/** Formats a decimal string from the API (never a float computation) as INR. */
export function formatInr(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? inr.format(n) : value;
}
