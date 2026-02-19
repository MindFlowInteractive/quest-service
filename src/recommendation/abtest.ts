function djb2(str: string) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

export function assignVariant(userId: string, splitPct = 50) {
  const hash = djb2(userId);
  return (hash % 100) < splitPct ? 'B' : 'A';
}

export type Variant = 'A' | 'B';
