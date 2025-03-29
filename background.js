// Initialize when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("FocusMode extension installed");
  
  // Set default state - blocking disabled
  chrome.storage.sync.set({ isEnabled: false });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleBlocking") {
    const isEnabled = message.isEnabled;
    console.log("Toggling blocking:", isEnabled);
    
    // Save state
    chrome.storage.sync.set({ isEnabled: isEnabled });
    
    // Update blocking rules
    updateBlockRules(isEnabled);
    
    sendResponse({ success: true });
  }
  else if (message.action === "getState") {
    chrome.storage.sync.get(['isEnabled'], (data) => {
      sendResponse({ isEnabled: data.isEnabled || false });
    });
    return true; // Will respond asynchronously
  }
});

// Function to enable/disable blocking rules
function updateBlockRules(isEnabled) {
  if (isEnabled) {
    // Add rule to block Facebook
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1],  // Remove existing rule if any
      addRules: [
        {
          id: 1,
          priority: 1,
          action: { type: "block" },
          condition: { 
            urlFilter: "facebook.com", 
            resourceTypes: ["main_frame"] 
          }
        }
      ]
    });
    console.log("Facebook blocking enabled");
  } else {
    // Remove blocking rule
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1]
    });
    console.log("Facebook blocking disabled");
  }
}

// When browser restarts, check saved state and apply rules
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(['isEnabled'], (data) => {
    updateBlockRules(data.isEnabled || false);
  });
});


// Add this to your existing background.js

// Default content filtering settings
let contentFilterSettings = {
  isEnabled: false,
  keywords: ['politics', 'election', 'controversy'] // Default keywords
};

// Initialize settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ contentFilterSettings: contentFilterSettings });
});

// Load settings from storage
function loadContentFilterSettings() {
  chrome.storage.sync.get(['contentFilterSettings'], (data) => {
    if (data.contentFilterSettings) {
      contentFilterSettings = data.contentFilterSettings;
    }
  });
}

// Listen for content script requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle existing messages...
  
  if (message.action === 'getContentFilters') {
    sendResponse({
      isEnabled: contentFilterSettings.isEnabled,
      keywords: contentFilterSettings.keywords
    });
  }
  else if (message.action === 'updateContentFilters') {
    contentFilterSettings = {
      isEnabled: message.isEnabled,
      keywords: message.keywords
    };
    
    chrome.storage.sync.set({ contentFilterSettings: contentFilterSettings });
    
    // Send update to all tabs
    chrome.tabs.query({}, (tabs) => {
      for (let tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateFilters',
          isEnabled: contentFilterSettings.isEnabled,
          keywords: contentFilterSettings.keywords
        }).catch(() => {
          // Ignore errors for tabs where content script isn't loaded
        });
      }
    });
    
    sendResponse({ success: true });
  }
  
  // Return true for async response
  return true;
});

// Load settings on startup
chrome.runtime.onStartup.addListener(loadContentFilterSettings);
loadContentFilterSettings();