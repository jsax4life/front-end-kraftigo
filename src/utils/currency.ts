const DEFAULT_CURRENCY = "EUR";

/** e.g. `EUR 15.00` */
export function formatMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  const code = currency.trim().toUpperCase() || DEFAULT_CURRENCY;
  const value = Number.isFinite(amount) ? amount : 0;
  return `${code} ${value.toFixed(2)}`;
}

/** e.g. `EUR 15.00/hr` */
export function formatHourlyRate(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  return `${formatMoney(amount, currency)}/hr`;
}

/** e.g. `EUR 15.00 flat` */
export function formatFlatRate(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  return `${formatMoney(amount, currency)} flat`;
}
