// Initialize when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("FocusMode extension installed");
  
  // Set default state - blocking disabled
  chrome.storage.sync.set({ 
    isEnabled: false,
    contentFilterSettings: {
      isEnabled: false,
      keywords: ['politics', 'election', 'controversy'] // Default keywords
    }
  });
});

// Default content filtering settings
let contentFilterSettings = {
  isEnabled: false,
  keywords: ['politics', 'election', 'controversy'] // Default keywords
};

// Load settings from storage
function loadContentFilterSettings() {
  chrome.storage.sync.get(['contentFilterSettings'], (data) => {
    if (data.contentFilterSettings) {
      contentFilterSettings = data.contentFilterSettings;
    }
  });
}

// SINGLE combined listener for all messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Website blocking messages
  if (message.action === "toggleBlocking") {
    const isEnabled = message.isEnabled;
    console.log("Toggling blocking:", isEnabled);
    
    // Save state
    chrome.storage.sync.set({ isEnabled: isEnabled });
    
    // Update blocking rules
    updateBlockRules(isEnabled);
    
    // Also update content filtering to match main toggle if you want them synchronized
    contentFilterSettings.isEnabled = isEnabled;
    chrome.storage.sync.set({ contentFilterSettings: contentFilterSettings });
    
    // Notify tabs about content filter change
    notifyTabsContentFilterChanged();
    
    sendResponse({ success: true });
  }
  else if (message.action === "getState") {
    chrome.storage.sync.get(['isEnabled'], (data) => {
      sendResponse({ isEnabled: data.isEnabled || false });
    });
    return true; // Will respond asynchronously
  }
  // Content filtering messages
  else if (message.action === 'getContentFilters') {
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
    
    // Notify tabs about content filter change
    notifyTabsContentFilterChanged();
    
    sendResponse({ success: true });
  }
  
  // Return true for async response
  return true;
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

// Function to notify all tabs about filter changes
function notifyTabsContentFilterChanged() {
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
}

// When browser restarts, check saved state and apply rules
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(['isEnabled'], (data) => {
    updateBlockRules(data.isEnabled || false);
  });
});

// Load settings on startup
chrome.runtime.onStartup.addListener(loadContentFilterSettings);
loadContentFilterSettings();