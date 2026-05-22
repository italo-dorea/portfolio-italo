/**
 * Simple markdown parser that handles headings, bold text, lists, and paragraphs
 * and outputs an HTML string.
 */
export function parseMarkdown(content: string): string {
  const lines = content.split("\n");
  let inList = false;
  let inOrderedList = false;
  let html = "";

  lines.forEach((line) => {
    let trimmedLine = line.trim();

    // Inline formatting: **bold**
    const parseInline = (text: string) => {
      return text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    };

    // Handle unordered list items
    if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
      if (inOrderedList) {
        html += "</ol>\n";
        inOrderedList = false;
      }
      if (!inList) {
        html += '<ul class="list-disc pl-6 my-4 space-y-2">\n';
        inList = true;
      }
      html += `<li>${parseInline(trimmedLine.substring(2))}</li>\n`;
      return;
    }

    // Handle ordered list items
    const olMatch = trimmedLine.match(/^\d+\.\s(.*)/);
    if (olMatch) {
      if (inList) {
        html += "</ul>\n";
        inList = false;
      }
      if (!inOrderedList) {
        html += '<ol class="list-decimal pl-6 my-4 space-y-2">\n';
        inOrderedList = true;
      }
      html += `<li>${parseInline(olMatch[1])}</li>\n`;
      return;
    }

    // Close lists if we hit a non-list item
    if (inList) {
      html += "</ul>\n";
      inList = false;
    }
    if (inOrderedList) {
      html += "</ol>\n";
      inOrderedList = false;
    }

    if (trimmedLine === "") {
      return;
    }

    // Handle Headers
    if (trimmedLine.startsWith("### ")) {
      html += `<h3 class="text-xl font-bold text-foreground mt-8 mb-4">${parseInline(trimmedLine.substring(4))}</h3>\n`;
    } else if (trimmedLine.startsWith("## ")) {
      html += `<h2 class="text-2xl font-bold text-foreground mt-10 mb-4 border-b border-border pb-2">${parseInline(trimmedLine.substring(3))}</h2>\n`;
    } else if (trimmedLine.startsWith("# ")) {
      html += `<h1 class="text-3xl font-extrabold text-foreground mt-12 mb-6">${parseInline(trimmedLine.substring(2))}</h1>\n`;
    } else {
      // Paragraph
      html += `<p class="text-muted-foreground text-base md:text-lg leading-relaxed my-4">${parseInline(trimmedLine)}</p>\n`;
    }
  });

  // Close lists if still open
  if (inList) {
    html += "</ul>\n";
  }
  if (inOrderedList) {
    html += "</ol>\n";
  }

  return html;
}
