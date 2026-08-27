/**
 * Score search result relevance using term-frequency overlap, for the
 * advanced search and discovery feature. (#421)
 */
export interface SearchableDocument {
  id: string;
  title: string;
  tags: string[];
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\W+/).filter(Boolean);
}

export function scoreSearchResult(query: string, doc: SearchableDocument): number {
  const queryTerms = tokenize(query);
  const titleTerms = tokenize(doc.title);
  const tagTerms = doc.tags.map((tag) => tag.toLowerCase());

  let score = 0;
  for (const term of queryTerms) {
    if (titleTerms.includes(term)) score += 2;
    if (tagTerms.includes(term)) score += 1;
  }
  return score;
}

export function searchAndRank(query: string, documents: SearchableDocument[]): SearchableDocument[] {
  return documents
    .map((doc) => ({ doc, score: scoreSearchResult(query, doc) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.doc);
}
