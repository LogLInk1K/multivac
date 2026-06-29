export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function countWords(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

export function calculateReadingTime(content: string): number {
  const plainText = stripHtml(content);
  const wordCount = countWords(plainText);
  return Math.ceil(wordCount / 400);
}

export function calculateWordCount(content: string): number {
  const plainText = stripHtml(content);
  return countWords(plainText);
}
