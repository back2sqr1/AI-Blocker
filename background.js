// Initialize when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("FocusMode extension installed");
  
  // Define website categories with their URLs
  const defaultCategories = {
    news: {
      enabled: true,
      sites: ["cnn.com", "nytimes.com", "foxnews.com", "bbc.com", "reuters.com"]
    },
    videoGames: {
      enabled: true,
      sites: ["twitch.tv", "ign.com", "gamespot.com", "polygon.com", "steam.com"] 
    },
    socialMedia: {
      enabled: true,
      sites: ["facebook.com", "twitter.com", "instagram.com", "tiktok.com", "reddit.com"]
    },
    shopping: {
      enabled: false,
      sites: ["amazon.com", "ebay.com", "walmart.com", "etsy.com", "target.com"]
    }
  };
  
  // Set default state - blocking disabled
  chrome.storage.sync.set({ 
    isEnabled: false,
    categories: defaultCategories,
    contentFilterSettings: {
      isEnabled: false,
      keywords: ['politics', 'election', 'controversy']
    }
  });
});

// Default content filtering settings
let contentFilterSettings = {
  isEnabled: false,
  keywords: ['politics', 'election', 'controversy']
};

// Current category settings
let categories = {};

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(['contentFilterSettings', 'categories'], (data) => {
    if (data.contentFilterSettings) {
      contentFilterSettings = data.contentFilterSettings;
    }
    if (data.categories) {
      categories = data.categories;
    }
  });
}

// SINGLE combined listener for all messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);
  
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
    chrome.storage.sync.get(['isEnabled', 'categories'], (data) => {
      sendResponse({ 
        isEnabled: data.isEnabled || false,
        categories: data.categories || {}
      });
    });
    return true; // Will respond asynchronously
  }
  // Category management
  else if (message.action === "toggleCategory") {
    chrome.storage.sync.get(['categories', 'isEnabled'], (data) => {
      const categories = data.categories || {};
      const isEnabled = data.isEnabled || false;
      
      if (categories[message.category]) {
        categories[message.category].enabled = message.enabled;
        
        chrome.storage.sync.set({ categories: categories }, () => {
          // Only update block rules if main toggle is on
          if (isEnabled) {
            updateBlockRules(true);
          }
          sendResponse({ success: true });
        });
      }
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
  // Start by removing any existing rules
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: Array.from({ length: 100 }, (_, i) => i + 1) // Remove rules 1-100
  });
  
  if (isEnabled) {
    chrome.storage.sync.get(['categories'], (data) => {
      const categories = data.categories || {};
      const rulesToAdd = [];
      let ruleId = 1;
      
      // Add rules for each enabled category
      for (const category in categories) {
        if (categories[category].enabled) {
          categories[category].sites.forEach(site => {
            rulesToAdd.push({
              id: ruleId++,
              priority: 1,
              action: { type: "block" },
              condition: { 
                urlFilter: site, 
                resourceTypes: ["main_frame"] 
              }
            });
          });
        }
      }
      
      // Add the rules if there are any
      if (rulesToAdd.length > 0) {
        chrome.declarativeNetRequest.updateDynamicRules({
          addRules: rulesToAdd
        });
        console.log("Added blocking rules:", rulesToAdd);
      }
    });
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
  loadSettings();
});

// Load settings right away
loadSettings();