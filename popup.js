function displayMarkdown(markdownText) {
  const htmlContent = marked.parse(markdownText);
  const previewElement = document.querySelector('#markdown-preview');
  previewElement.innerHTML = htmlContent;
}

document.addEventListener('DOMContentLoaded', function() {
  const copyButton = document.getElementById('copy-markdown');
  const statusMessage = document.getElementById('status-message');

  // Immediately detect and display the note when popup opens
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "getMarkdownPreview"}, function(response) {
      if (response && response.success) {
        displayMarkdown(response.markdown || 'No notes detected or unable to generate preview');
      }
    });
  });
  
  copyButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "copyAsMarkdown"}, function(response) {
        if (response && response.success) {
          statusMessage.innerText = "Copied to clipboard!";
          statusMessage.classList.remove("error");
          statusMessage.classList.add("show");
          setTimeout(() => {
            statusMessage.classList.remove("show");
          }, 2000);
        } else {
          statusMessage.innerText = "Error: " + (response ? response.error : "Something bad happened");
          statusMessage.classList.add("show", "error");
          setTimeout(() => {
            statusMessage.classList.remove("show", "error");
          }, 3000);
        }
      });
    });
  });
});
