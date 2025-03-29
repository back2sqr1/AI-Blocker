// Keywords to filter (these would be configurable in your extension)
let keywordsToBlock = [];
let isFilteringEnabled = false;

// Function to add overlay to elements containing blocked terms
function addOverlayToElements() {
  if (!isFilteringEnabled || keywordsToBlock.length === 0) return;
  
  console.log("Filtering content for keywords:", keywordsToBlock);
  
  // Special handling for YouTube
  if (window.location.hostname.includes("youtube.com")) {
    handleYouTubeFiltering();
    return;
  }
  
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
  applyOverlaysToElements(matches);
}

// Special handling for YouTube videos
function handleYouTubeFiltering() {
  // For YouTube home page and search results
  const videoElements = document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer');
  const matches = new Set();
  
  videoElements.forEach(videoElement => {
    // Find the title element
    let titleElement;
    
    // Different types of video elements have different title structures
    if (videoElement.querySelector('#video-title, .title')) {
      titleElement = videoElement.querySelector('#video-title, .title');
    }
    
    if (titleElement) {
      const titleText = titleElement.textContent.toLowerCase();
      
      // Check if title contains any blocked keywords
      for (const keyword of keywordsToBlock) {
        if (titleText.includes(keyword.toLowerCase())) {
          // Add the entire video element to matches
          matches.add(videoElement);
          break;
        }
      }
    }
  });
  
  // For YouTube watch page - video title
  const watchPageTitle = document.querySelector('.title.ytd-video-primary-info-renderer');
  if (watchPageTitle) {
    const titleText = watchPageTitle.textContent.toLowerCase();
    
    for (const keyword of keywordsToBlock) {
      if (titleText.includes(keyword.toLowerCase())) {
        // Find the player container
        const playerContainer = document.querySelector('.html5-video-player');
        if (playerContainer) {
          matches.add(playerContainer);
        }
        break;
      }
    }
  }
  
  // For recommended videos sidebar
  const recommendedVideos = document.querySelectorAll('ytd-compact-video-renderer');
  recommendedVideos.forEach(video => {
    const titleElement = video.querySelector('#video-title');
    if (titleElement) {
      const titleText = titleElement.textContent.toLowerCase();
      
      for (const keyword of keywordsToBlock) {
        if (titleText.includes(keyword.toLowerCase())) {
          matches.add(video);
          break;
        }
      }
    }
  });
  
  applyOverlaysToElements(matches);
}

// Function to apply overlays to a set of elements
function applyOverlaysToElements(elements) {
  elements.forEach(element => {
    // Skip if already has overlay
    if (element.classList.contains('content-filtered') || 
        element.querySelector('.content-blocker-overlay')) {
      return;
    }
    
    // Store original dimensions to prevent collapse
    const originalHeight = element.offsetHeight;
    const originalWidth = element.offsetWidth;
    
    element.classList.add('content-filtered');
    element.style.position = 'relative';
    
    // Ensure the element maintains its size when blurred
    if (originalHeight > 0) {
      element.style.minHeight = originalHeight + 'px';
    }
    if (originalWidth > 0) {
      element.style.minWidth = originalWidth + 'px';
    }

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
    // Use a debounce to avoid excessive processing
    clearTimeout(window.filterDebounce);
    window.filterDebounce = setTimeout(() => {
      addOverlayToElements();
    }, 500);
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});