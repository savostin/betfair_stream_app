/**
 * Betfair price ladder utilities.
 * Prices follow specific tick sizes depending on the price range.
 */

type PriceRange = {
  min: number
  max: number
  increment: number
}

const PRICE_RANGES: PriceRange[] = [
  { min: 1.01, max: 2, increment: 0.01 },
  { min: 2, max: 3, increment: 0.02 },
  { min: 3, max: 4, increment: 0.05 },
  { min: 4, max: 6, increment: 0.1 },
  { min: 6, max: 10, increment: 0.2 },
  { min: 10, max: 20, increment: 0.5 },
  { min: 20, max: 30, increment: 1 },
  { min: 30, max: 50, increment: 2 },
  { min: 50, max: 100, increment: 5 },
  { min: 100, max: 1000, increment: 10 },
]

/**
 * Get the tick size (increment) for a given price.
 */
export function getPriceIncrement(price: number): number {
  for (const range of PRICE_RANGES) {
    if (price >= range.min && price < range.max) {
      return range.increment
    }
  }
  // For prices >= 1000
  return 10
}

/**
 * Get the number of decimal places for a given increment.
 */
function getDecimalPlaces(increment: number): number {
  const str = increment.toString()
  const decimalIndex = str.indexOf('.')
  if (decimalIndex === -1) return 0
  return str.length - decimalIndex - 1
}

/**
 * Format a price with appropriate decimal places based on its tick size.
 */
export function formatPrice(price: number): string {
  if (!isFinite(price) || price <= 0) return '-'
  const increment = getPriceIncrement(price)
  const decimals = getDecimalPlaces(increment)
  return price.toFixed(decimals)
}

/**
 * Round a price to the nearest valid price on the ladder.
 */
export function roundPrice(price: number): number {
  if (price < 1.01) return 1.01
  if (price >= 1000) return Math.floor(price / 10) * 10

  const increment = getPriceIncrement(price)
  const range = PRICE_RANGES.find((r) => price >= r.min && price < r.max)
  if (!range) return price

  const offset = price - range.min
  const steps = Math.round(offset / increment)
  return range.min + steps * increment
}

/**
 * Increment a price to the next valid price on the ladder.
 * @param price - The starting price
 * @param ticks - Number of ticks to increment (default: 1)
 */
export function incrementPrice(price: number, ticks: number = 1): number {
  let current = roundPrice(price)
  
  for (let i = 0; i < ticks; i++) {
    const increment = getPriceIncrement(current)
    let next = current + increment

    // Handle range transitions
    if (next >= 1000) return 1000
    
    // Check if we've crossed into a new range
    const currentRange = PRICE_RANGES.find((r) => current >= r.min && current < r.max)
    const nextRange = PRICE_RANGES.find((r) => next >= r.min && next < r.max)
    
    if (currentRange !== nextRange && nextRange) {
      // Snap to the start of the next range
      next = nextRange.min
    }

    current = roundPrice(next)
  }

  return current
}

/**
 * Decrement a price to the previous valid price on the ladder.
 * @param price - The starting price
 * @param ticks - Number of ticks to decrement (default: 1)
 */
export function decrementPrice(price: number, ticks: number = 1): number {
  let current = roundPrice(price)
  
  for (let i = 0; i < ticks; i++) {
    const increment = getPriceIncrement(current)
    let prev = current - increment

    if (prev < 1.01) return 1.01

    // Check if we've crossed into a new range
    const currentRange = PRICE_RANGES.find((r) => current >= r.min && current < r.max)
    const prevRange = PRICE_RANGES.find((r) => prev >= r.min && prev < r.max)
    
    if (currentRange !== prevRange && prevRange) {
      // Snap to the end of the previous range (just below the current range start)
      prev = current - (currentRange?.increment ?? 0.01)
    }

    current = roundPrice(prev)
  }

  return current
}

/**
 * Check if a price is valid on the Betfair ladder.
 */
export function isValidPrice(price: number): boolean {
  if (price < 1.01 || price > 1000) return false
  const rounded = roundPrice(price)
  // Allow small floating point tolerance
  return Math.abs(price - rounded) < 0.0001
}
