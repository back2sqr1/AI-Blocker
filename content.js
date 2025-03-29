// Keywords to filter (these would be configurable in your extension)
let keywordsToBlock = [];
let isFilteringEnabled = false;

// Function to add overlay to elements containing blocked terms
function addOverlayToElements() {
  if (!isFilteringEnabled || keywordsToBlock.length === 0) return;
  
  console.log("Filtering content for keywords:", keywordsToBlock);
  
  // Get all text nodes in the document
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const matches = new Set();
  let node;
  
  // Find all nodes containing blocked terms
  while ((node = walker.nextNode())) {
    // Skip nodes in script and style elements
    if (node.parentElement.tagName === 'SCRIPT' || 
        node.parentElement.tagName === 'STYLE' ||
        node.parentElement.classList.contains('content-blocker-overlay')) {
      continue;
    }
    
    const text = node.textContent.toLowerCase();
    for (const keyword of keywordsToBlock) {
      if (text.includes(keyword.toLowerCase())) {
        // Find the closest block-level parent to overlay
        let parent = node.parentElement;
        
        // Look for a meaningful container
        while (parent && 
              (window.getComputedStyle(parent).display === 'inline' || 
               parent.textContent.trim().length < 50)) {
          // Don't go higher than these elements
          if (parent.tagName === 'ARTICLE' || 
              parent.tagName === 'SECTION' || 
              parent.tagName === 'DIV' && parent.offsetHeight > 50) {
            break;
          }
          parent = parent.parentElement;
        }
        
        if (parent) {
          matches.add(parent);
        }
        break;
      }
    }
  }
  
  // Add overlays to matched elements
  matches.forEach(element => {
    // Skip if already has overlay
    if (element.classList.contains('content-filtered') || 
        element.querySelector('.content-blocker-overlay')) {
      return;
    }
    

    element.classList.add('content-filtered');
    element.style.position = 'relative';

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'content-blocker-overlay';

    // Create close icon (×) in top right
    const closeIcon = document.createElement('span');
    closeIcon.className = 'content-close-icon';
    closeIcon.innerHTML = '&times;';

    // Add close icon to overlay
    overlay.appendChild(closeIcon);

    // Add overlay to the element
    element.appendChild(overlay);

    // Add functionality to close icon
    closeIcon.addEventListener('click', function(e) {
    e.stopPropagation();
    overlay.style.display = 'none';
    element.classList.remove('content-filtered');
    });
  });
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateFilters') {
    keywordsToBlock = message.keywords || [];
    isFilteringEnabled = message.isEnabled;
    
    // Clear existing overlays
    document.querySelectorAll('.content-blocker-overlay').forEach(overlay => {
      overlay.remove();
    });
    document.querySelectorAll('.content-filtered').forEach(element => {
      element.classList.remove('content-filtered');
    });
    
    // Apply new filters
    if (isFilteringEnabled) {
      addOverlayToElements();
    }
    
    sendResponse({success: true});
  }
});

// Check configuration on page load
chrome.runtime.sendMessage({action: 'getContentFilters'}, response => {
  if (response && !chrome.runtime.lastError) {
    keywordsToBlock = response.keywords || [];
    isFilteringEnabled = response.isEnabled;
    
    // Apply filters initially
    if (isFilteringEnabled) {
      addOverlayToElements();
    }
  }
});

// Set up a MutationObserver to handle dynamically loaded content
const observer = new MutationObserver((mutations) => {
  if (isFilteringEnabled && keywordsToBlock.length > 0) {
    addOverlayToElements();
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});