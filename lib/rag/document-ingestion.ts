import pdf from "pdf-parse";

export type PageText = { pageNumber: number; text: string };
export type DocumentChunk = { chunkIndex: number; pageNumber: number; content: string };

export async function extractPdfPages(buffer: Buffer): Promise<{ pages: PageText[]; metadata: Record<string, unknown> }> {
  const pages: PageText[] = [];
  const result = await pdf(buffer, {
    pagerender: async (pageData: { getTextContent: (options: { normalizeWhitespace: boolean; disableCombineTextItems: boolean }) => Promise<{ items: Array<{ str?: string }> }> }) => {
      const content = await pageData.getTextContent({ normalizeWhitespace: true, disableCombineTextItems: false });
      return content.items.map((item) => item.str || "").join(" ");
    },
  });
  const rawPages = result.text.split(/\f/g);
  rawPages.forEach((text, index) => {
    const cleaned = cleanText(text);
    if (cleaned) pages.push({ pageNumber: index + 1, text: cleaned });
  });
  if (pages.length === 0 && cleanText(result.text)) pages.push({ pageNumber: 1, text: cleanText(result.text) });
  return { pages, metadata: { info: result.info || {}, version: result.version || null, pageCount: result.numpages || pages.length } };
}

export function cleanText(input: string) {
  return input.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function chunkPages(pages: PageText[], maxCharacters = 1800): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;
  for (const page of pages) {
    const paragraphs = page.text.split(/\n\s*\n|(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý])/).map((part) => part.trim()).filter(Boolean);
    let current = "";
    for (const paragraph of paragraphs) {
      if ((current + " " + paragraph).trim().length > maxCharacters && current) {
        chunks.push({ chunkIndex: chunkIndex++, pageNumber: page.pageNumber, content: current.trim() });
        current = "";
      }
      current = `${current} ${paragraph}`.trim();
    }
    if (current) chunks.push({ chunkIndex: chunkIndex++, pageNumber: page.pageNumber, content: current });
  }
  return chunks;
}
