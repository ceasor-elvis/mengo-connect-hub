import React, { useMemo } from 'react';

interface BlockNoteRendererProps {
  data: string | any[] | null;
}

// Renders inline content (StyledText or Link objects from BlockNote)
function renderInlineContent(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return escapeHtml(content);
  if (Array.isArray(content)) {
    return content.map(renderInlineContent).join('');
  }
  if (content.type === 'link') {
    const href = escapeHtml(content.href || '#');
    const inner = renderInlineContent(content.content);
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-primary underline">${inner}</a>`;
  }
  // StyledText
  if (content.type === 'text' || content.text !== undefined) {
    let text = escapeHtml(content.text || '');
    const styles = content.styles || {};
    if (styles.bold) text = `<strong>${text}</strong>`;
    if (styles.italic) text = `<em>${text}</em>`;
    if (styles.underline) text = `<u>${text}</u>`;
    if (styles.strike) text = `<s>${text}</s>`;
    if (styles.code) text = `<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">${text}</code>`;
    if (styles.textColor && styles.textColor !== 'default') text = `<span style="color:${escapeHtml(styles.textColor)}">${text}</span>`;
    if (styles.backgroundColor && styles.backgroundColor !== 'default') text = `<span style="background-color:${escapeHtml(styles.backgroundColor)}">${text}</span>`;
    return text;
  }
  return '';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderBlock(block: any): string {
  const content = renderInlineContent(block.content);
  const props = block.props || {};

  switch (block.type) {
    case 'heading': {
      const level = props.level || 1;
      const sizeClass = level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg';
      return `<h${level} class="font-bold ${sizeClass} mt-4 mb-2">${content}</h${level}>`;
    }
    case 'bulletListItem':
      return `<li class="ml-5 list-disc">${content}</li>`;
    case 'numberedListItem':
      return `<li class="ml-5 list-decimal">${content}</li>`;
    case 'checkListItem': {
      const checked = props.checked ? 'checked disabled' : 'disabled';
      return `<li class="ml-5 list-none flex items-center gap-2"><input type="checkbox" ${checked} class="mt-0.5" /><span>${content}</span></li>`;
    }
    case 'code':
      return `<pre class="bg-muted rounded-md p-4 my-3 overflow-x-auto text-sm font-mono whitespace-pre-wrap"><code>${content}</code></pre>`;
    case 'image': {
      const src = escapeHtml(props.url || '');
      const alt = escapeHtml(props.caption || 'Image');
      if (!src) return '';
      return `<figure class="my-4 text-center"><img src="${src}" alt="${alt}" class="max-w-full rounded-lg mx-auto" />${props.caption ? `<figcaption class="text-xs text-muted-foreground mt-1">${escapeHtml(props.caption)}</figcaption>` : ''}</figure>`;
    }
    case 'table': {
      if (!block.content || !block.content.rows) return '';
      const rows = block.content.rows.map((row: any) => {
        const cells = row.cells.map((cell: any) =>
          `<td class="border px-3 py-2 text-sm">${renderInlineContent(cell)}</td>`
        ).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<div class="overflow-x-auto my-4"><table class="w-full border-collapse border rounded-md">${rows}</table></div>`;
    }
    case 'paragraph':
    default:
      if (!content) return '<br />';
      return `<p class="mb-2 leading-relaxed">${content}</p>`;
  }
}

function renderBlocks(blocks: any[]): string {
  let html = '';
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (block.type === 'bulletListItem') {
      const items = [];
      while (i < blocks.length && blocks[i].type === 'bulletListItem') {
        items.push(renderBlock(blocks[i]));
        i++;
      }
      html += `<ul class="my-2 space-y-1">${items.join('')}</ul>`;
    } else if (block.type === 'numberedListItem') {
      const items = [];
      while (i < blocks.length && blocks[i].type === 'numberedListItem') {
        items.push(renderBlock(blocks[i]));
        i++;
      }
      html += `<ol class="my-2 space-y-1">${items.join('')}</ol>`;
    } else {
      html += renderBlock(block);
      i++;
    }
    // Render children
    if (block.children && block.children.length > 0) {
      html += `<div class="ml-6">${renderBlocks(block.children)}</div>`;
    }
  }
  return html;
}

function parseData(data: string | any[] | null): any[] | null {
  if (!data) return null;
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
      // Editor.js legacy format
      if (parsed && Array.isArray(parsed.blocks)) {
        return parsed.blocks.map((block: any) => {
          if (block.type === 'paragraph') return { type: 'paragraph', content: [{ type: 'text', text: block.data?.text || '' }] };
          if (block.type === 'header') return { type: 'heading', props: { level: block.data?.level || 2 }, content: [{ type: 'text', text: block.data?.text || '' }] };
          if (block.type === 'list') {
            return (block.data?.items || []).map((item: any) => ({ type: 'bulletListItem', content: [{ type: 'text', text: item || '' }] }));
          }
          return { type: 'paragraph', content: [{ type: 'text', text: block.data?.text || '' }] };
        }).flat();
      }
    } catch {
      // Plain text fallback
      return [{ type: 'paragraph', content: [{ type: 'text', text: data }] }];
    }
  }
  return null;
}

export const BlockNoteRenderer: React.FC<BlockNoteRendererProps> = ({ data }) => {
  const html = useMemo(() => {
    const blocks = parseData(data);
    if (!blocks || blocks.length === 0) return '';
    return renderBlocks(blocks);
  }, [data]);

  if (!html) return null;

  return (
    <div
      className="blocknote-render text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
