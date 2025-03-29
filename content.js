// Global variable to store embeddings
let wordEmbeddings = null;

// Load embeddings when content script initializes
fetch(chrome.runtime.getURL('embeddings-mini.json'))
  .then(response => response.json())
  .then(data => {
    wordEmbeddings = data;
    console.log('Word embeddings loaded successfully');
  })
  .catch(error => {
    console.error('Failed to load word embeddings:', error);
  });

// Keywords to filter (these would be configurable in your extension)
let keywordsToBlock = [];
let isFilteringEnabled = false;

// Calculate text similarity using embeddings
function getRelevanceScore(text, keywords) {
  // Fallback to simple keyword matching if embeddings aren't loaded
  if (!wordEmbeddings) {
    return keywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())) ? 1 : 0;
  }
  
  // Convert text to embedding vector
  const textVector = getTextEmbedding(text);
  if (!textVector) {
    // Fallback if we can't get an embedding for the text
    return keywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())) ? 1 : 0;
  }
  
  // Find highest similarity with any keyword
  let maxSimilarity = 0;
  for (const keyword of keywords) {
    const keywordVector = getKeywordEmbedding(keyword);
    if (keywordVector) {
      const similarity = cosineSimilarity(textVector, keywordVector);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    } else if (text.toLowerCase().includes(keyword.toLowerCase())) {
      // Fallback for keywords without embeddings
      maxSimilarity = Math.max(maxSimilarity, 0.7);
    }
  }
  
  return maxSimilarity;
}

// Get embedding for a text passage
function getTextEmbedding(text) {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return null;
  
  // Use dimensionality from our loaded embeddings
  const dimensions = 50; // GloVe 50d
  const result = new Array(dimensions).fill(0);
  
  let wordCount = 0;
  for (const word of words) {
    if (wordEmbeddings[word]) {
      for (let i = 0; i < dimensions; i++) {
        result[i] += wordEmbeddings[word][i];
      }
      wordCount++;
    }
  }
  
  // If we found any known words, normalize the vector
  if (wordCount > 0) {
    for (let i = 0; i < dimensions; i++) {
      result[i] /= wordCount;
    }
    return result;
  }
  
  return null;
}

// Get embedding for a keyword
function getKeywordEmbedding(keyword) {
  const words = keyword.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return null;
  
  // For single words, directly use the embedding if available
  if (words.length === 1 && wordEmbeddings[words[0]]) {
    return wordEmbeddings[words[0]];
  }
  
  // For multi-word keywords, average the embeddings
  const dimensions = 50; // GloVe 50d
  const result = new Array(dimensions).fill(0);
  
  let wordCount = 0;
  for (const word of words) {
    if (wordEmbeddings[word]) {
      for (let i = 0; i < dimensions; i++) {
        result[i] += wordEmbeddings[word][i];
      }
      wordCount++;
    }
  }
  
  // If we found any known words, normalize the vector
  if (wordCount > 0) {
    for (let i = 0; i < dimensions; i++) {
      result[i] /= wordCount;
    }
    return result;
  }
  
  return null;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

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
    
    const text = node.textContent;
    // Use the embedding-based relevance score instead of simple includes
    const relevanceScore = getRelevanceScore(text, keywordsToBlock);
    
    // Only filter content above a certain relevance threshold
    if (relevanceScore > 0.6) { // Adjust threshold as needed
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
      const titleText = titleElement.textContent;
      
      // Use relevance score instead of direct keyword match
      const relevanceScore = getRelevanceScore(titleText, keywordsToBlock);
      if (relevanceScore > 0.6) { // Same threshold as regular content
        // Add the entire video element to matches
        matches.add(videoElement);
      }
    }
  });
  
  // For YouTube watch page - video title
  const watchPageTitle = document.querySelector('.title.ytd-video-primary-info-renderer');
  if (watchPageTitle) {
    const titleText = watchPageTitle.textContent;
    
    const relevanceScore = getRelevanceScore(titleText, keywordsToBlock);
    if (relevanceScore > 0.8) {
      // Find the player container
      const playerContainer = document.querySelector('.html5-video-player');
      if (playerContainer) {
        matches.add(playerContainer);
      }
    }
  }
  
  // For recommended videos sidebar
  const recommendedVideos = document.querySelectorAll('ytd-compact-video-renderer');
  recommendedVideos.forEach(video => {
    const titleElement = video.querySelector('#video-title');
    if (titleElement) {
      const titleText = titleElement.textContent;
      
      const relevanceScore = getRelevanceScore(titleText, keywordsToBlock);
      if (relevanceScore > 0.6) {
        matches.add(video);
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