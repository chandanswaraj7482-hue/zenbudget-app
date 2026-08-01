/**
 * Centralized Currency Formatting Utility for ZenBudget
 * Safely handles rounding and locale formatting to eliminate raw JS floating point artifacts
 * Example: 12.54259006 -> "₹12.54", 12 -> "₹12"
 */
export const formatCurrency = (
  amount: number,
  currencySymbol: string = '₹',
  decimals?: number
): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${currencySymbol}0`;
  }

  // INR (₹) always rounds to clean integer whole numbers without messy floating points like ₹87.88
  const isINR = currencySymbol === '₹' || currencySymbol === 'INR';
  const targetDecimals = decimals !== undefined ? decimals : (isINR ? 0 : (amount % 1 !== 0 ? 2 : 0));

  const factor = Math.pow(10, targetDecimals);
  const rounded = Math.round((amount + Number.EPSILON) * factor) / factor;

  const formattedNum = rounded.toLocaleString(undefined, {
    minimumFractionDigits: targetDecimals,
    maximumFractionDigits: targetDecimals
  });

  return `${currencySymbol}${formattedNum}`;
};

export default formatCurrency;
