// Listen for extension installation
chrome.runtime.onInstalled.addListener(function() {
  console.log("FocusMode extension installed");
  
<<<<<<< HEAD
  // Set default settings
  chrome.storage.sync.set({
    focusModeEnabled: false,
    blockedSites: [
      "facebook.com",
      "twitter.com",
      "instagram.com",
      "youtube.com"
    ]
  }, function() {
    console.log("Default settings saved successfully");
    // Log what was saved
    chrome.storage.sync.get(null, function(data) {
      console.log("Current storage state:", data);
    });
  });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  console.log("Tab updated - ID:", tabId, "Status:", changeInfo.status);
  
  // Check if URL is blocked when a tab finishes loading
  if (changeInfo.status === 'complete' && tab.url) {
    console.log("Tab fully loaded:", tab.url);
    
    chrome.storage.sync.get(['focusModeEnabled', 'blockedSites'], function(data) {
      console.log("Focus mode enabled:", data.focusModeEnabled);
      console.log("Blocked sites list:", data.blockedSites);
      
      // If focus mode is on, check if we should block this site
      if (data.focusModeEnabled) {
        const currentUrl = new URL(tab.url).hostname;
        console.log("Checking URL:", currentUrl);
        
        // Check if current site is in blocked list
        const isBlocked = data.blockedSites.some(site => {
          const matches = currentUrl.includes(site);
          console.log(`Checking against ${site}: ${matches ? "BLOCKED" : "allowed"}`);
          return matches;
        });
        
        if (isBlocked) {
          console.log("BLOCKING ACCESS to:", currentUrl);
          // Redirect to a block page
          chrome.tabs.update(tabId, { url: "blocked.html" });
        } else {
          console.log("Site allowed:", currentUrl);
        }
      } else {
        console.log("Focus mode is OFF - not checking for blocked sites");
      }
    });
  }
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("Message received:", request);
  console.log("Sender:", sender);
  
  if (request.action === "toggleFocusMode") {
    console.log("Toggling focus mode to:", request.enabled);
    
    chrome.storage.sync.set({ focusModeEnabled: request.enabled }, function() {
      console.log("Focus mode setting updated successfully");
      sendResponse({ success: true });
    });
    
    // Return true to indicate you wish to send a response asynchronously
    return true;
  }
});

// Ad blocking functionality
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        console.log("Blocked ad request:", details.url);
        return {cancel: true};
=======
  // Default settings
let settings = {
  isEnabled: false,
  categories: {
    news: true,
    videoGames: true,
    socialMedia: true,
    shopping: false
  },
  customBlocks: [],
  stats: {
    sitesBlockedToday: 0,
    focusTimeToday: 0
  }
};

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (isEnabled)
          return {cancel: true}
        else  
          return {cancel: false}
>>>>>>> c6fd55b679bf762f6852e840ee1c88a4fcc79c87
    },
    {urls: [
        "*://*.zedo.com/*",
        "*://*.doubleclick.net/*",
<<<<<<< HEAD
        "*://partner.googleadservices.com/*",
        "*://*.googlesyndication.com/*",
=======
        "*://*partner.googleadservices.com/*",
        "://*.googlesyndication.com/*",
>>>>>>> c6fd55b679bf762f6852e840ee1c88a4fcc79c87
        "*://*.google-analytics.com/*",
        "*://creative.ak.fbcdn.net/*",
        "*://*.adbrite.com/*",
        "*://*.exponential.com/*",
        "*://*.quantserve.com/*",
        "*://*.scorecardresearch.com/*",
    ]},
    ["blocking"]
);

// Log when the extension starts
console.log("Background script initialized - " + new Date().toLocaleString());

// Add a helper function to dump current state for debugging
function dumpState() {
  console.log("=== EXTENSION STATE DUMP ===");
  chrome.storage.sync.get(null, function(data) {
    console.log("Storage data:", data);
  });
  console.log("========================");
}

// Run state dump on initialization
dumpState();