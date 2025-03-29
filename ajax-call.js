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
  const focusToggle = document.getElementById('focusToggle');
  
  // Get current state from background script
  chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    if (!response || chrome.runtime.lastError) {
      console.warn("Error getting state:", chrome.runtime.lastError);
      return;
    }
    
    // Update toggle switch
    focusToggle.checked = response.isEnabled;
  });
  
  // Toggle blocking on/off
  focusToggle.addEventListener('change', function() {
    const isEnabled = this.checked;
    
    chrome.runtime.sendMessage({ 
      action: 'toggleBlocking', 
      isEnabled: isEnabled 
    });
  });
  
  // Timer functionality (keep if needed)
  let timerInterval;
  let seconds = 25 * 60; // 25 minutes in seconds

  document.querySelector('.primary-button').addEventListener('click', function() {
    // Start button clicked
    if (this.textContent === 'Start') {
      this.textContent = 'Pause';
      
      timerInterval = setInterval(function() {
        seconds--;
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        document.querySelector('.timer span').textContent = 
          `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds} Remaining`;
          
        if (seconds <= 0) {
          clearInterval(timerInterval);
          document.querySelector('.primary-button').textContent = 'Start';
          alert('Focus session completed!');
        }
      }, 1000);
    } else {
      // Pause button clicked
      this.textContent = 'Start';
      clearInterval(timerInterval);
    }
  });

  // Reset button
  document.querySelector('.secondary-button').addEventListener('click', function() {
    clearInterval(timerInterval);
    seconds = 25 * 60;
    document.querySelector('.timer span').textContent = '25:00 Remaining';
    document.querySelector('.primary-button').textContent = 'Start';
  });
});


// Add this to your DOMContentLoaded event handler

// Content filtering UI
const contentFilterToggle = document.getElementById('contentFilterToggle');
const keywordsSection = document.getElementById('keywordsSection');
const keywordsList = document.getElementById('keywordsList');
const newKeywordInput = document.getElementById('newKeyword');
const addKeywordBtn = document.getElementById('addKeywordBtn');

// Load content filter settings
chrome.runtime.sendMessage({action: 'getContentFilters'}, (response) => {
  if (!response || chrome.runtime.lastError) return;
  
  contentFilterToggle.checked = response.isEnabled;
  keywordsSection.style.display = response.isEnabled ? 'block' : 'none';
  
  // Display current keywords
  updateKeywordsList(response.keywords);
});

// Toggle content filtering
contentFilterToggle.addEventListener('change', function() {
  const isEnabled = this.checked;
  keywordsSection.style.display = isEnabled ? 'block' : 'none';
  
  // Get current keywords
  chrome.runtime.sendMessage({action: 'getContentFilters'}, (response) => {
    if (!response || chrome.runtime.lastError) return;
    
    // Update settings
    chrome.runtime.sendMessage({
      action: 'updateContentFilters',
      isEnabled: isEnabled,
      keywords: response.keywords
    });
  });
});

// Add new keyword
addKeywordBtn.addEventListener('click', function() {
  const keyword = newKeywordInput.value.trim();
  if (!keyword) return;
  
  chrome.runtime.sendMessage({action: 'getContentFilters'}, (response) => {
    if (!response || chrome.runtime.lastError) return;
    
    const keywords = [...response.keywords];
    if (!keywords.includes(keyword)) {
      keywords.push(keyword);
      
      chrome.runtime.sendMessage({
        action: 'updateContentFilters',
        isEnabled: response.isEnabled,
        keywords: keywords
      }, () => {
        newKeywordInput.value = '';
        updateKeywordsList(keywords);
      });
    }
  });
});

// Display keywords with remove option
function updateKeywordsList(keywords) {
  keywordsList.innerHTML = '';
  
  keywords.forEach(keyword => {
    const keywordItem = document.createElement('div');
    keywordItem.className = 'keyword-item';
    keywordItem.style = 'display: flex; justify-content: space-between; margin-bottom: 5px; padding: 5px; background-color: #f3f4f6; border-radius: 4px;';
    
    keywordItem.innerHTML = `
      <span>${keyword}</span>
      <button class="remove-keyword" data-keyword="${keyword}" style="border: none; background: none; color: #ef4444; cursor: pointer;">✕</button>
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