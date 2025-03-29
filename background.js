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
    },
    {urls: [
        "*://*.zedo.com/*",
        "*://*.doubleclick.net/*",
        "*://*partner.googleadservices.com/*",
        "://*.googlesyndication.com/*",
        "*://*.google-analytics.com/*",
        "*://creative.ak.fbcdn.net/*",
        "*://*adbrite.com/*",
        "*//*.exponential.com/*",
        "*://*.quantserve.com/*",
        "*://*.scorecardresearch.com/*",
    ]},
    ["blocking"]
)

