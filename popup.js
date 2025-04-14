document.addEventListener('DOMContentLoaded', function() {
  const copyButton = document.getElementById('copy-markdown');
  const statusMessage = document.getElementById('status-message');
  
  copyButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "copyAsMarkdown"}, function(response) {
        if (response && response.success) {
          statusMessage.textContent = "Copied to clipboard!";
          setTimeout(() => {
            statusMessage.textContent = "";
          }, 2000);
        } else {
          statusMessage.textContent = "Error: " + (response ? response.error : "No notebook detected");
          setTimeout(() => {
            statusMessage.textContent = "";
          }, 3000);
        }
      });
    });
  });
});
