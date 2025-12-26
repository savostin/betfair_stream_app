export function formatMoney(n: number | undefined, placeholder: string): string {
  if (n === undefined || Number.isNaN(n)) return placeholder
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
