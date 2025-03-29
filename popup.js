document.addEventListener('DOMContentLoaded', function() {
    const focusToggle = document.getElementById('focusToggle');
    
    // Load current state
    chrome.storage.sync.get(['focusModeEnabled'], function(data) {
      focusToggle.checked = data.focusModeEnabled || false;
    });
    
    // Add event listener for toggle
    focusToggle.addEventListener('change', function() {
      const isEnabled = focusToggle.checked;
      
      // Save state
      chrome.storage.sync.set({ focusModeEnabled: isEnabled });
      
      // Send message to background script
      chrome.runtime.sendMessage({ 
        action: "toggleFocusMode", 
        enabled: isEnabled 
      });
    });
    
    // Set up tab switching
    const blockTab = document.getElementById('blockTab');
    const statsTab = document.getElementById('statsTab');
    const settingsTab = document.getElementById('settingsTab');
    
    const blockContent = document.getElementById('blockContent');
    const statsContent = document.getElementById('statsContent');
    const settingsContent = document.getElementById('settingsContent');
    
    blockTab.addEventListener('click', function() {
      blockContent.style.display = 'block';
      statsContent.style.display = 'none';
      settingsContent.style.display = 'none';
      
      blockTab.classList.add('active');
      statsTab.classList.remove('active');
      settingsTab.classList.remove('active');
    });
    
    statsTab.addEventListener('click', function() {
      blockContent.style.display = 'none';
      statsContent.style.display = 'block';
      settingsContent.style.display = 'none';
      
      blockTab.classList.remove('active');
      statsTab.classList.add('active');
      settingsTab.classList.remove('active');
    });
    
    settingsTab.addEventListener('click', function() {
      blockContent.style.display = 'none';
      statsContent.style.display = 'none';
      settingsContent.style.display = 'block';
      
      blockTab.classList.remove('active');
      statsTab.classList.remove('active');
      settingsTab.classList.add('active');
    });
  });