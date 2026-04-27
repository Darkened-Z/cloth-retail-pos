const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowHundred(n: number): string {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

function belowThousand(n: number): string {
  if (n < 100) return belowHundred(n);
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + belowHundred(n % 100) : '');
}

export function toWords(n: number): string {
  if (n === 0) return 'Zero Rupees Only';
  const parts: string[] = [];
  let remaining = Math.abs(Math.round(n));
  if (remaining >= 10000000) {
    parts.push(belowThousand(Math.floor(remaining / 10000000)) + ' Crore');
    remaining %= 10000000;
  }
  if (remaining >= 100000) {
    parts.push(belowThousand(Math.floor(remaining / 100000)) + ' Lakh');
    remaining %= 100000;
  }
  if (remaining >= 1000) {
    parts.push(belowThousand(Math.floor(remaining / 1000)) + ' Thousand');
    remaining %= 1000;
  }
  if (remaining > 0) parts.push(belowThousand(remaining));
  return (n < 0 ? 'Minus ' : '') + parts.join(' ') + ' Rupees Only';
}
