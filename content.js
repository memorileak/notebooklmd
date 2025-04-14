// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getMarkdownPreview") {
    try {
      const markdown = detectNoteAndCreateMarkdown();
      sendResponse({ success: true, markdown });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  if (request.action === "copyAsMarkdown") {
    try {
      const markdown = detectNoteAndCreateMarkdown();
      if (markdown) {
        copyToClipboard(markdown);
        sendResponse({ success: true });
      } else {
        throw new Error('Markdown content is empty');
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});

function detectNoteAndCreateMarkdown() {
  const noteElementHtml = document.querySelector('labs-tailwind-doc-viewer')?.innerHTML ?? '';
  if (noteElementHtml) {
    const noteTitle = document.querySelector('[aria-label*="note title"]')?.value ?? 'Untitled';
    const markdownTitle = `## ${escapeMarkdown(noteTitle)}`;
    const markdownContent = noteContentHtmlToMarkdown(noteElementHtml);
    return `${markdownTitle}\n\n${markdownContent}`;
  }
  return '';
}

function noteContentHtmlToMarkdown(htmlString) {
  // Create a temporary DOM element to parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Remove all button elements
  const buttons = doc.querySelectorAll('button');
  buttons.forEach(button => button.remove());

  // Get all structural elements
  const structuralElements = doc.querySelectorAll('labs-tailwind-structural-element-view-v2');

  // Initialize markdown result
  let markdownResult = '';

  // Process each structural element
  structuralElements.forEach(element => {
    // Check if this is a bullet list item
    const bulletElement = element.querySelector('div[class*="bullet"]');
    const hasBullet = bulletElement !== null;

    // If yes, check if this is numbering bullet or just a normal bullet
    const isNumberingBullet = hasBullet && /^[0-9]/.test(bulletElement?.innerText ?? '');

    // Remove the bullet itself
    if (hasBullet) {
      bulletElement?.remove();
    }

    // Find paragraph element to determine nesting level
    const paragraphDiv = element.querySelector('div[class*="paragraph"]');
    let nestLevel = 0;

    if (paragraphDiv) {
      const paddingStyle = paragraphDiv.getAttribute('style');
      if (paddingStyle && paddingStyle.includes('padding-inline-start:')) {
        // Extract the padding value
        const paddingMatch = paddingStyle.match(/padding-inline-start:\s*([0-9.]+)rem/);
        if (paddingMatch && paddingMatch[1]) {
          const paddingAmount = parseFloat(paddingMatch[1]);
          if (Number.isFinite(paddingAmount) && paddingAmount >= 1.25) {
            // Calculate nesting level based on padding
            // Assuming each level increases by a certain amount 1.25rem
            nestLevel = Math.floor(paddingAmount / 1.25);
          }
        }
      }
    }

    // Start a new line for each structural element, based on its nestLevel
    if (markdownResult !== '') {
      markdownResult += nestLevel > 0 ? '\n' : '\n\n';
    }

    // Create indentation based on nesting level
    let indent = '';
    for (let i = 0; i < nestLevel - 1; i++) {
      indent += '    '; // 4 spaces for each level
    }

    // Add bullet if needed
    if (hasBullet) {
      if (isNumberingBullet) {
        markdownResult += `${indent}1. `;
      } else {
        markdownResult += `${indent}- `;
      }
    } else {
      markdownResult += indent;
    }

    // Process the content of the element
    let elementContent = processElementContent(element);

    // Add the processed content to the result
    markdownResult += elementContent;
  });

  return markdownResult;
}

function processElementContent(element) {
  let result = '';
  const clone = element.cloneNode(true);

  // Process bold elements
  const boldElements = clone.querySelectorAll('[class*="bold"]');
  boldElements.forEach(boldElement => {
    const text = boldElement.innerText;
    boldElement.innerText = `&bold;${text}&/bold;`;
  });

  // Get the text content, preserving only the needed formatting
  result = getTextContent(clone);

  // Put a space between 2 consecutive bold marker pairs
  result = result.replace(/\&\/bold;\&bold;/g, '&/bold; &bold;');

  // Apply the final processing to restore bold formatting 
  result = result.replace(/\&bold;(.*?)\&\/bold;/g, '**$1**');

  return result;
}

function getTextContent(element) {
  return escapeMarkdown(element.innerText.trim());
}

function escapeMarkdown(text) {
  if (typeof text !== 'string') {
    return '';
  }
  const markdownChars = /([\\`*_{}[\]()#+-.!|<>])/g;
  return text.replace(markdownChars, '\\$1');
}

// Function to copy content to clipboard
function copyToClipboard(text) {
  // Create a temporary textarea element to copy from
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);

  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
