// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "copyAsMarkdown") {
    try {
      const markdownContent = convertNotebookToMarkdown();
      copyToClipboard(markdownContent);
      sendResponse({success: true});
    } catch (error) {
      sendResponse({success: false, error: error.message});
    }
  }
  return true;
});

// Function to detect and convert notebook content to Markdown
function convertNotebookToMarkdown() {
  // Detect if we're on a page with notebook content
  let notebookCells = [];
  
  // Try to find notebook cells in the DOM
  try {
    // This implementation will depend on the specific structure of the notebook
    // For this example, we'll assume a basic notebook structure
    const cells = document.querySelectorAll('.notebook-cell, .cell');
    
    if (cells.length === 0) {
      throw new Error("No notebook cells found");
    }
    
    cells.forEach(cell => {
      const cellType = cell.getAttribute('data-cell-type') || 
                      (cell.querySelector('.code-cell') ? 'code' : 'markdown');
      
      let content = '';
      
      if (cellType === 'markdown') {
        const mdContent = cell.querySelector('.markdown-content, .rendered_html');
        content = mdContent ? mdContent.innerText : '';
      } else if (cellType === 'code') {
        const codeContent = cell.querySelector('pre, code');
        const outputContent = cell.querySelector('.output');
        
        content = '```python\n';
        content += codeContent ? codeContent.innerText : '';
        content += '\n```\n\n';
        
        if (outputContent) {
          content += '**Output:**\n\n```\n';
          content += outputContent.innerText;
          content += '\n```\n';
        }
      }
      
      notebookCells.push(content);
    });
    
    return notebookCells.join('\n\n');
  } catch (error) {
    // Check for JSON notebook structure (like .ipynb files viewed in browser)
    const preElements = document.querySelectorAll('pre');
    for (const pre of preElements) {
      try {
        const content = pre.textContent;
        if (content.includes('"cells":') && content.includes('"cell_type":')) {
          const notebook = JSON.parse(content);
          return convertIpynbToMarkdown(notebook);
        }
      } catch (e) {
        // Not a valid JSON notebook
        continue;
      }
    }
    
    throw new Error("No compatible notebook format found");
  }
}

// Function to convert .ipynb JSON structure to Markdown
function convertIpynbToMarkdown(notebook) {
  let markdown = '';
  
  if (notebook.cells && Array.isArray(notebook.cells)) {
    notebook.cells.forEach(cell => {
      if (cell.cell_type === 'markdown') {
        markdown += cell.source.join('') + '\n\n';
      } else if (cell.cell_type === 'code') {
        markdown += '```python\n';
        markdown += cell.source.join('');
        markdown += '\n```\n\n';
        
        // Handle outputs
        if (cell.outputs && cell.outputs.length > 0) {
          markdown += '**Output:**\n\n';
          
          cell.outputs.forEach(output => {
            if (output.output_type === 'stream') {
              markdown += '```\n' + output.text.join('') + '\n```\n\n';
            } else if (output.output_type === 'execute_result' && output.data && output.data['text/plain']) {
              markdown += '```\n' + output.data['text/plain'].join('') + '\n```\n\n';
            }
            // Could handle more output types like images, etc.
          });
        }
      }
    });
  }
  
  return markdown;
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
