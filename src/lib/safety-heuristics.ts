export interface RiskEvaluation {
  risk: 'low' | 'medium' | 'high';
  score: number;
  warnings: string[];
}

const SUSPICIOUS_KEYWORDS = [
  { pattern: /send (deposit|commitment|fare|booking)/i, reason: 'Mentions upfront deposit or booking fee' },
  { pattern: /mpesa (before|first|prior)/i, reason: 'Requests M-Pesa payment prior to delivery or inspection' },
  { pattern: /advance (fee|payment|cash)/i, reason: 'Asks for advance payment' },
  { pattern: /whatsapp (only|strictly|direct)/i, reason: 'Refuses on-platform communication or calls' },
  { pattern: /urgent (sale|cash|distress|traveling)/i, reason: 'High urgency pressure tactic common in classified scams' },
  { pattern: /pay (delivery|fuel|courier) first/i, reason: 'Classic delivery fee advance-fee scam' },
  { pattern: /western union|moneygram|crypto|usdt/i, reason: 'Non-traceable payment method requested' },
];

export function evaluateListingSafety(data: {
  title?: string | null;
  description?: string | null;
  price?: number | null;
  listing_type?: string | null;
  contact_phone?: string | null;
}): RiskEvaluation {
  const warnings: string[] = [];
  let score = 0;

  const text = `${data.title || ''} ${data.description || ''}`.toLowerCase();

  // 1. Keyword check
  for (const kw of SUSPICIOUS_KEYWORDS) {
    if (kw.pattern.test(text)) {
      score += 35;
      warnings.push(kw.reason);
    }
  }

  // 2. Suspiciously low pricing check (e.g. iPhone / Toyota / TV advertised for under 500 KES)
  const price = data.price ?? 0;
  if (data.listing_type !== 'donation') {
    const highValueIndicators = /(iphone|galaxy s|macbook|laptop|toyota|nissan|ps5|playstation|smart tv|fridge|refrigerator)/i;
    if (highValueIndicators.test(text) && price > 0 && price < 2000) {
      score += 40;
      warnings.push(`Suspiciously low price (KSh ${price.toLocaleString()}) for a high-value item category.`);
    } else if (price > 0 && price < 50) {
      score += 20;
      warnings.push('Unusually low price for a commercial item.');
    }
  }

  // 3. Contact phone check
  if (data.contact_phone) {
    const cleaned = data.contact_phone.replace(/\D/g, '');
    if (cleaned.length < 9 || cleaned.length > 13) {
      score += 25;
      warnings.push('Invalid phone number format provided.');
    }
  }

  let risk: 'low' | 'medium' | 'high' = 'low';
  if (score >= 60) {
    risk = 'high';
  } else if (score >= 30) {
    risk = 'medium';
  }

  return { risk, score, warnings };
}
