// Popup script for Work Sampling Teacher Comment Generator

document.addEventListener('DOMContentLoaded', async function() {
    const apiKeyInput = document.getElementById('apiKey');
    const saveKeyCheckbox = document.getElementById('saveKey');
    const generateBtn = document.getElementById('generateBtn');
    const statusDiv = document.getElementById('status');
    const form = document.getElementById('commentForm');
    
    // Load saved API key if it exists
    try {
        const result = await chrome.storage.local.get(['openaiApiKey']);
        if (result.openaiApiKey) {
            apiKeyInput.value = result.openaiApiKey;
            saveKeyCheckbox.checked = true;
        }
    } catch (error) {
        console.error('Error loading saved API key:', error);
    }
    
    // Auto-save API key when it changes
    async function autoSaveApiKey(apiKey) {
        if (apiKey && apiKey.trim().length > 0) {
            try {
                await chrome.storage.local.set({ openaiApiKey: apiKey.trim() });
                console.log('API key auto-saved');
            } catch (error) {
                console.error('Error auto-saving API key:', error);
            }
        }
    }
    
    // Show status message
    function showStatus(message, type = 'loading') {
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        if (type === 'loading') {
            statusDiv.innerHTML = `<span class="spinner"></span>${message}`;
        } else {
            statusDiv.textContent = message;
        }
    }
    
    // Hide status message
    function hideStatus() {
        statusDiv.style.display = 'none';
    }
    
    // Validate API key format
    function isValidApiKey(apiKey) {
        return apiKey && apiKey.trim().startsWith('sk-') && apiKey.trim().length > 20;
    }
    
    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const apiKey = apiKeyInput.value.trim();
        
        if (!isValidApiKey(apiKey)) {
            showStatus('Please enter a valid OpenAI API key (starts with sk-)', 'error');
            return;
        }
        
        // Auto-save API key (always save now)
        await autoSaveApiKey(apiKey);
        
        // Disable button and show loading status
        generateBtn.disabled = true;
        showStatus('Analyzing assessment data...', 'loading');
        
        try {
            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }
            
            // Send message to content script
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'generateComment',
                apiKey: apiKey
            });
            
            // Better error handling for response
            if (!response) {
                throw new Error('No response from content script. Please refresh the page and try again.');
            }
            
            if (response.error) {
                showStatus(response.error, 'error');
            } else if (response.success) {
                showStatus('Comment generated successfully! ✨', 'success');
                
                // Close popup after a short delay
                setTimeout(() => {
                    window.close();
                }, 1500);
            } else {
                throw new Error('Unexpected response from content script');
            }
            
        } catch (error) {
            console.error('Error:', error);
            
            let errorMessage = 'An unexpected error occurred.';
            
            if (error.message.includes('Could not establish connection')) {
                errorMessage = 'Could not connect to the page. Please refresh and try again.';
            } else if (error.message.includes('No active tab')) {
                errorMessage = 'No active tab found. Please try again.';
            } else if (error.message.includes('No response from content script')) {
                errorMessage = error.message;
            } else if (error.message.includes('API')) {
                errorMessage = 'API error. Please check your API key and try again.';
            } else {
                errorMessage = error.message || errorMessage;
            }
            
            showStatus(errorMessage, 'error');
        } finally {
            generateBtn.disabled = false;
        }
    });
    
    // Auto-save API key when user types (with debounce)
    let saveTimeout;
    apiKeyInput.addEventListener('input', function() {
        hideStatus();
        
        // Clear previous timeout
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        
        // Auto-save after 1 second of no typing
        saveTimeout = setTimeout(async () => {
            const apiKey = this.value.trim();
            if (apiKey.length > 0) {
                await autoSaveApiKey(apiKey);
                saveKeyCheckbox.checked = true; // Update checkbox to show it's saved
            }
        }, 1000);
    });
    
    // Handle save key checkbox change
    saveKeyCheckbox.addEventListener('change', async function() {
        if (!this.checked) {
            // Remove saved API key when unchecked
            try {
                await chrome.storage.local.remove(['openaiApiKey']);
                console.log('API key removed from storage');
            } catch (error) {
                console.error('Error removing API key:', error);
            }
        } else {
            // Save current API key when checked
            const apiKey = apiKeyInput.value.trim();
            if (apiKey.length > 0) {
                await autoSaveApiKey(apiKey);
            }
        }
    });
});

// Check if we're on a valid Work Sampling page when popup opens
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (chrome.runtime.lastError) {
        console.error('Error querying tabs:', chrome.runtime.lastError);
        return;
    }
    
    const currentTab = tabs[0];
    
    if (!currentTab || !currentTab.id) {
        console.error('No valid tab found');
        return;
    }
    
    // Only try to inject script if we have a valid tab and URL
    if (currentTab.url && (currentTab.url.startsWith('http://') || currentTab.url.startsWith('https://'))) {
        // Inject a small script to check if this is a Work Sampling page
        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            function: function() {
                return {
                    hasCommentBox: !!document.querySelector('#comments'),
                    hasChecklistTable: !!document.querySelector('#checklistViewTable'),
                    url: window.location.href
                };
            }
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.log('Script injection failed (this is normal for some pages):', chrome.runtime.lastError.message);
                return;
            }
            
            if (results && results[0] && results[0].result) {
                const pageInfo = results[0].result;
                
                if (!pageInfo.hasCommentBox || !pageInfo.hasChecklistTable) {
                    const statusDiv = document.getElementById('status');
                    if (statusDiv) {
                        statusDiv.className = 'status error';
                        statusDiv.style.display = 'block';
                        statusDiv.textContent = 'This doesn\'t appear to be a Work Sampling assessment page. Please navigate to a student\'s checklist entry page.';
                    }
                    
                    const generateBtn = document.getElementById('generateBtn');
                    if (generateBtn) {
                        generateBtn.disabled = true;
                    }
                }
            }
        });
    }
});
