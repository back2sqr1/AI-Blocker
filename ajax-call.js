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

// Additional JavaScript to connect with background script
document.addEventListener('DOMContentLoaded', function() {
    // Get settings from background script
    
});

// Toggle focus mode on/off
document.getElementById('focusToggle').addEventListener('change', function() {
    
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

