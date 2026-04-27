export function formatPKR(n: number): string {
  if (isNaN(n)) return 'PKR 0';
  const abs = Math.abs(Math.round(n));
  const s = abs.toString();
  let result = '';
  if (s.length <= 3) {
    result = s;
  } else {
    result = s.slice(-3);
    let remaining = s.slice(0, -3);
    while (remaining.length > 2) {
      result = remaining.slice(-2) + ',' + result;
      remaining = remaining.slice(0, -2);
    }
    if (remaining.length > 0) result = remaining + ',' + result;
  }
  return (n < 0 ? '-' : '') + 'PKR ' + result;
}

export function formatNum(n: number): string {
  if (isNaN(n)) return '0';
  const abs = Math.abs(Math.round(n));
  const s = abs.toString();
  let result = '';
  if (s.length <= 3) {
    result = s;
  } else {
    result = s.slice(-3);
    let remaining = s.slice(0, -3);
    while (remaining.length > 2) {
      result = remaining.slice(-2) + ',' + result;
      remaining = remaining.slice(0, -2);
    }
    if (remaining.length > 0) result = remaining + ',' + result;
  }
  return (n < 0 ? '-' : '') + result;
}

export const formatNumber = formatNum;
