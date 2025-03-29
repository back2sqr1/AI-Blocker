// Simple tab switching functionality
document.getElementById('blockTab').addEventListener('click', () => {
  document.getElementById('blockTab').classList.add('active');
  document.getElementById('statsTab').classList.remove('active');
  document.getElementById('settingsTab').classList.remove('active');
  document.getElementById('blockContent').style.display = 'block';
  document.getElementById('statsContent').style.display = 'none';
  document.getElementById('settingsContent').style.display = 'none';
});

document.getElementById('statsTab').addEventListener('click', () => {
  document.getElementById('blockTab').classList.remove('active');
  document.getElementById('statsTab').classList.add('active');
  document.getElementById('settingsTab').classList.remove('active');
  document.getElementById('blockContent').style.display = 'none';
  document.getElementById('statsContent').style.display = 'block';
  document.getElementById('settingsContent').style.display = 'none';
});

document.getElementById('settingsTab').addEventListener('click', () => {
  document.getElementById('blockTab').classList.remove('active');
  document.getElementById('statsTab').classList.remove('active');
  document.getElementById('settingsTab').classList.add('active');
  document.getElementById('blockContent').style.display = 'none';
  document.getElementById('statsContent').style.display = 'none';
  document.getElementById('settingsContent').style.display = 'block';
});

// Initialize when popup is loaded
document.addEventListener('DOMContentLoaded', function() {
// Get settings from background script
chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
const settings = response.settings;

// Update UI based on settings
document.getElementById('focusToggle').checked = settings.isEnabled;

// Update category toggles
document.querySelectorAll('.block-item input[type="checkbox"]').forEach((checkbox, index) => {
    const categories = ['news', 'videoGames', 'socialMedia', 'shopping'];
    if (index < categories.length) {
    checkbox.checked = settings.categories[categories[index]];
    }
});

});

// Toggle focus mode on/off
document.getElementById('focusToggle').addEventListener('change', function() {
chrome.runtime.sendMessage({ 
    action: 'getSettings' 
}, (response) => {
    const settings = response.settings;
    settings.isEnabled = this.checked;
    
    chrome.runtime.sendMessage({ 
    action: 'updateSettings', 
    settings: settings 
    });
});
});

// Toggle categories
document.querySelectorAll('.block-item input[type="checkbox"]').forEach((checkbox, index) => {
checkbox.addEventListener('change', function() {
    chrome.runtime.sendMessage({ 
    action: 'getSettings' 
    }, (response) => {
    const settings = response.settings;
    const categories = ['news', 'videoGames', 'socialMedia', 'shopping'];
    
    if (index < categories.length) {
        settings.categories[categories[index]] = this.checked;
        
        chrome.runtime.sendMessage({ 
        action: 'updateSettings', 
        settings: settings 
        });
    }
    });
});
});
});


// Add custom block functionality
document.querySelector('.add-block').addEventListener('click', function() {
    const siteName = prompt('Enter website name:');
    if (!siteName) return;
    
    const description = prompt('Enter description:');
    
    // Create new block item
    const newBlockItem = document.createElement('div');
    newBlockItem.className = 'block-item';
    newBlockItem.innerHTML = `
      <div class="block-item-left">
        <svg class="category-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <div>
          <div class="category-text">${siteName}</div>
          <div class="category-description">${description || 'Custom website'}</div>
        </div>
      </div>
      <label class="toggle">
        <input type="checkbox" checked>
        <span class="slider"></span>
      </label>
    `;
    
    keywordsList.appendChild(keywordItem);
  });
  
  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-keyword').forEach(button => {
    button.addEventListener('click', function() {
      const keywordToRemove = this.getAttribute('data-keyword');
      
      chrome.runtime.sendMessage({action: 'getContentFilters'}, (response) => {
        if (!response || chrome.runtime.lastError) return;
        
        const keywords = response.keywords.filter(k => k !== keywordToRemove);
        
        chrome.runtime.sendMessage({
          action: 'updateContentFilters',
          isEnabled: response.isEnabled,
          keywords: keywords
        }, () => {
          updateKeywordsList(keywords);
        });
      });
    });
  });
}