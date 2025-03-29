// List of blocked domains by category
const blockedSites = {
    news: ["cnn.com", "nytimes.com", "bbc.com", "reuters.com", "bloomberg.com"],
    videoGames: ["twitch.tv", "steam.community", "epicgames.com", "xbox.com", "playstation.com"],
    socialMedia: ["facebook.com", "twitter.com", "instagram.com", "reddit.com", "tiktok.com"],
    shopping: ["amazon.com", "ebay.com", "etsy.com", "walmart.com", "target.com"]
  };
  
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
    focusTimer: {
      isActive: false,
      duration: 25 * 60, // 25 minutes in seconds
      remaining: 0,
      endTime: null
    },
    stats: {
      sitesBlockedToday: 0,
      focusTimeToday: 0
    }
  };
  
  // Load settings on startup
  chrome.storage.local.get('focusModeSettings', (data) => {
    if (data.focusModeSettings) {
      settings = data.focusModeSettings;
      
      // Check if there's an active timer and restore it
      if (settings.focusTimer.isActive && settings.focusTimer.endTime) {
        const now = new Date().getTime();
        const endTime = settings.focusTimer.endTime;
        
        if (now < endTime) {
          settings.focusTimer.remaining = Math.floor((endTime - now) / 1000);
          startTimer();
        } else {
          // Timer expired while extension was inactive
          settings.focusTimer.isActive = false;
          settings.focusTimer.remaining = 0;
          settings.focusTimer.endTime = null;
          saveSettings();
        }
      }
    }
    saveSettings();
  });
  
  // Listen for navigation events to block websites
  chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    // Only check main frame (not iframes, etc)
    if (details.frameId !== 0 || !settings.isEnabled) return;
    
    const url = new URL(details.url);
    const domain = url.hostname.replace('www.', '');
    
    // Check if the domain should be blocked
    if (shouldBlockDomain(domain)) {
      // Increment blocked count
      settings.stats.sitesBlockedToday++;
      saveSettings();
      
      // Redirect to blocked page
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL("blocked.html") + 
             "?site=" + encodeURIComponent(domain) + 
             "&from=" + encodeURIComponent(details.url)
      });
    }
  });
  
  // Check if a domain should be blocked
  function shouldBlockDomain(domain) {
    // Check custom blocks
    if (settings.customBlocks.some(custom => domain.includes(custom))) {
      return true;
    }
    
    // Check category blocks
    for (const [category, isEnabled] of Object.entries(settings.categories)) {
      if (isEnabled && blockedSites[category].some(site => domain.includes(site))) {
        return true;
      }
    }
    
    return false;
  }
  
  // Timer functionality
  function startTimer() {
    if (settings.focusTimer.isActive) {
      const intervalId = setInterval(() => {
        if (settings.focusTimer.remaining <= 0) {
          // Timer finished
          clearInterval(intervalId);
          settings.focusTimer.isActive = false;
          settings.focusTimer.endTime = null;
          settings.stats.focusTimeToday += settings.focusTimer.duration / 60; // Convert to minutes
          saveSettings();
          
          // Notify user
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Focus Session Complete',
            message: 'Great job! You completed a focus session.'
          });
        } else {
          settings.focusTimer.remaining--;
          saveSettings();
        }
      }, 1000);
    }
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'getSettings':
        sendResponse({ settings: settings });
        break;
      case 'updateSettings':
        settings = message.settings;
        saveSettings();
        sendResponse({ success: true });
        break;
      case 'startTimer':
        settings.focusTimer.isActive = true;
        settings.focusTimer.remaining = message.duration || settings.focusTimer.duration;
        settings.focusTimer.endTime = new Date().getTime() + (settings.focusTimer.remaining * 1000);
        saveSettings();
        startTimer();
        sendResponse({ success: true });
        break;
      case 'stopTimer':
        settings.focusTimer.isActive = false;
        settings.focusTimer.endTime = null;
        saveSettings();
        sendResponse({ success: true });
        break;
    }
    return true;
  });
  
  // Save settings to chrome storage
  function saveSettings() {
    chrome.storage.local.set({ 'focusModeSettings': settings });
  }