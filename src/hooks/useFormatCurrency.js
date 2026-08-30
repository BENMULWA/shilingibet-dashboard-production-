export function useFormatCurrency() {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Compact format: 1000 -> 1K, 1000000 -> 1M
  const formatCompact = (amount) => {
    if (amount === null || amount === undefined) return "KES 0";
    const num = Number(amount);
    if (num >= 1000000) {
      return `KES ${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `KES ${(num / 1000).toFixed(1)}K`;
    }
    return `KES ${num.toFixed(0)}`;
  };

  return { formatCurrency, formatCompact };
}
