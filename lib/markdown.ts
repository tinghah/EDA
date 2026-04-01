/**
 * A basic markdown to HTML converter for chat messages.
 * We prioritize speed and security by limiting the supported subset.
 * For a real app, a library like 'marked' or 'dompurify' should be used.
 */

export function renderMarkdown(text: string): string {
  if (!text) return '';

  // Escape HTML entities to prevent XSS (very basic)
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Formatting
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-surface-container px-1 py-0.5 text-primary text-[10px]">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="text-xs font-bold text-primary mt-2 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-sm font-bold text-primary mt-2 mb-1">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-base font-bold text-primary mt-2 mb-1">$1</h1>');

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match) => {
    const cells = match.split('|').filter(c => c.trim() !== '');
    if (cells.every(c => /^[\s-:]+$/.test(c))) {
      return '<tr class="border-b border-outline-variant/20 h-0"></tr>';
    }
    const isHeader = match.includes('---'); // Detection might be tricky here
    const tag = cells.some(c => c.includes('**')) ? 'th' : 'td';
    return `<tr>${cells.map(c => `
      <${tag} class="px-2 py-1 text-[10px] border-r border-outline-variant/10 text-left">
        ${c.trim()}
      </${tag}>`).join('')}</tr>`;
  });

  html = html.replace(/(?:<tr>[\s\S]*?<\/tr>\n?)+/g, (match) => 
    `<div class="overflow-x-auto my-2 border border-outline-variant/20">
      <table class="w-full text-left border-collapse">${match}</table>
    </div>`
  );

  // Lists
  html = html.replace(/^- (.*$)/gm, '<li class="ml-3 text-[11px] mb-0.5 list-disc">$1</li>');

  // Line breaks
  html = html.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

  return html;
}
