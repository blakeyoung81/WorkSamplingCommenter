// Content script for Work Sampling Teacher Comment Generator
console.log('Work Sampling extension loaded');

// Function to extract student assessment data from the page
function extractAssessmentData() {
  const data = {};
  
  // Extract student basic info
  const studentName = document.querySelector('.nameLink a')?.textContent?.split(',');
  if (studentName) {
    data.studentName = `${studentName[1]?.trim()} ${studentName[0]?.trim()}`;
  }
  
  // Extract student details
  const genderBirthday = document.querySelector('#genderAndDob')?.textContent;
  if (genderBirthday) {
    const genderMatch = genderBirthday.match(/Gender:\s*(\w+)/);
    const birthdayMatch = genderBirthday.match(/Birthday:\s*([\d\/]+)/);
    data.gender = genderMatch ? genderMatch[1] : '';
    data.birthday = birthdayMatch ? birthdayMatch[1] : '';
  }
  
  // Extract grade level and academic year
  const gradeInfo = document.querySelector('#yearGrade')?.textContent;
  if (gradeInfo) {
    const gradeMatch = gradeInfo.match(/Grade Level:\s*([^\\n]+)/);
    const yearMatch = gradeInfo.match(/Academic Year:\s*([\d\/]+)/);
    data.gradeLevel = gradeMatch ? gradeMatch[1].trim() : '';
    data.academicYear = yearMatch ? yearMatch[1] : '';
  }
  
  // Extract the main subject area title
  const subjectTitle = document.querySelector('#csfTitle')?.textContent;
  data.subjectArea = subjectTitle || '';
  
  // Extract assessment items and their ratings
  data.assessments = [];
  
  const table = document.querySelector('#checklistViewTable');
  if (table) {
    const rows = table.querySelectorAll('tr');
    let currentCategory = '';
    
    rows.forEach((row) => {
      // Check if this is a category header row
      const headerCell = row.querySelector('th:first-child');
      if (headerCell && headerCell.textContent.trim() && !headerCell.textContent.includes('Guidelines')) {
        currentCategory = headerCell.textContent.trim();
        return;
      }
      
      // Check if this is an assessment item row
      const itemCell = row.querySelector('td:first-child');
      if (itemCell && row.id && row.id.startsWith('viewTableITEM')) {
        const itemText = itemCell.textContent?.trim();
        if (!itemText) return;
        
        const assessment = {
          item: itemText,
          category: currentCategory,
          rating: ''
        };
        
        // Find which checkbox is checked (NY, IP, PRO, NA, DNO)
        const checkboxes = row.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          // Check both the checked attribute and aria-checked for reliability
          const isChecked = checkbox.checked || checkbox.getAttribute('aria-checked') === 'true';
          if (isChecked) {
            const labelFor = checkbox.id;
            if (labelFor.includes('_ny')) assessment.rating = 'Not Yet';
            else if (labelFor.includes('_ip')) assessment.rating = 'In Progress';
            else if (labelFor.includes('_pro')) assessment.rating = 'Proficient';
            else if (labelFor.includes('_na')) assessment.rating = 'Not Applicable';
            else if (labelFor.includes('_dno')) assessment.rating = 'Did Not Observe';
          }
        });
        
        // Also check for label classes that might indicate checked state
        if (!assessment.rating) {
          const labels = row.querySelectorAll('label.psn-ui-checkbox');
          labels.forEach(label => {
            if (label.classList.contains('on')) {
              const forAttr = label.getAttribute('for');
              if (forAttr) {
                if (forAttr.includes('_ny')) assessment.rating = 'Not Yet';
                else if (forAttr.includes('_ip')) assessment.rating = 'In Progress';
                else if (forAttr.includes('_pro')) assessment.rating = 'Proficient';
                else if (forAttr.includes('_na')) assessment.rating = 'Not Applicable';
                else if (forAttr.includes('_dno')) assessment.rating = 'Did Not Observe';
              }
            }
          });
        }
        
        data.assessments.push(assessment);
      }
    });
  }
  
  return data;
}

// Function to generate teacher comment using ChatGPT
async function generateTeacherComment(assessmentData, apiKey) {
  const prompt = `You are a professional preschool teacher writing an honest, accurate progress comment. Write in a natural style but be factual and concise - avoid flowery language or excessive praise.

Based on the actual assessment ratings for ${assessmentData.studentName} in ${assessmentData.subjectArea}, write a comment that:
- Accurately reflects what was marked on the assessment (Not Yet, In Progress, Proficient)
- Uses straightforward, honest language about the child's current abilities
- Is concise and to the point (100-150 words maximum)
- Uses the child's name naturally but not excessively
- Focuses on what the child actually demonstrates, not aspirational language
- Mentions specific skill areas based on the ratings
- Does NOT include teacher signature

Student: ${assessmentData.studentName}
Subject: ${assessmentData.subjectArea}

Assessment Ratings:
${assessmentData.assessments.map(assessment => 
  `• ${assessment.item}: ${assessment.rating}`
).join('\\n')}

Write a factual comment that honestly describes ${assessmentData.studentName}'s current abilities based on these specific ratings. Use "In Progress" skills to show what they're working on, "Proficient" skills for what they can do well, and "Not Yet" areas as things they're beginning to explore. Be direct and honest without being overly critical or overly praising.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an exceptional preschool teacher who writes thoughtful, compassionate comments about student progress.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error('Error calling ChatGPT API:', error);
    throw error;
  }
}

// Function to insert comment into the textarea
function insertComment(comment) {
  const commentTextarea = document.querySelector('#comments');
  if (commentTextarea) {
    commentTextarea.value = comment;
    // Trigger change event to ensure the form recognizes the new content
    commentTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    commentTextarea.focus();
    return true;
  }
  return false;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'generateComment') {
    try {
      // Check if we're on a Work Sampling page
      const commentBox = document.querySelector('#comments');
      if (!commentBox) {
        sendResponse({ error: 'This page does not appear to be a Work Sampling assessment page.' });
        return;
      }

      // Extract assessment data
      const assessmentData = extractAssessmentData();
      
      if (!assessmentData.studentName || assessmentData.assessments.length === 0) {
        sendResponse({ error: 'Could not extract assessment data from this page.' });
        return;
      }

      // Generate comment using ChatGPT
      const comment = await generateTeacherComment(assessmentData, request.apiKey);
      
      // Insert comment into textarea
      const success = insertComment(comment);
      
      if (success) {
        sendResponse({ success: true, comment: comment });
      } else {
        sendResponse({ error: 'Could not insert comment into the form.' });
      }
      
    } catch (error) {
      console.error('Error generating comment:', error);
      sendResponse({ error: error.message });
    }
  }
});

// Add AI comment generator button directly on Work Sampling pages
if (document.querySelector('#comments') && document.querySelector('#checklistViewTable')) {
  addGenerateButton();
}

async function addGenerateButton() {
  // Check if we have a saved API key
  let hasApiKey = false;
  try {
    const result = await chrome.storage.local.get(['openaiApiKey']);
    hasApiKey = result.openaiApiKey && result.openaiApiKey.trim().startsWith('sk-');
  } catch (error) {
    console.error('Error checking for saved API key:', error);
  }

  // Find the comments section to position the button near it
  const commentsSection = document.querySelector('.row-fluid.padded');
  const commentsContainer = commentsSection?.querySelector('.span12');
  
  if (!commentsContainer) {
    console.error('Could not find comments section for button placement');
    return;
  }

  // Create the generate button container
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'ai-comment-generator';
  buttonContainer.style.cssText = `
    display: inline-block;
    margin-left: 15px;
    vertical-align: top;
    font-family: Arial, sans-serif;
  `;

  // Create the main generate button
  const generateBtn = document.createElement('button');
  generateBtn.id = 'generate-comment-btn';
  generateBtn.innerHTML = hasApiKey ? '🤖 Generate AI Comment' : '⚙️ Setup AI Key';
  generateBtn.style.cssText = `
    background: ${hasApiKey ? '#4CAF50' : '#FF9800'};
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
    white-space: nowrap;
  `;

  generateBtn.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-2px)';
    this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
  });

  generateBtn.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0px)';
    this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  });

  // Add click handler
  generateBtn.addEventListener('click', async function() {
    if (!hasApiKey) {
      // If no API key, show instructions to use popup
      showNotification('Please click the extension icon in your toolbar to set up your OpenAI API key first!', 'warning');
      return;
    }

    // Disable button and show loading state
    this.disabled = true;
    this.innerHTML = '⏳ Generating...';
    this.style.background = '#6c757d';

    try {
      const result = await chrome.storage.local.get(['openaiApiKey']);
      const apiKey = result.openaiApiKey;

      if (!apiKey) {
        throw new Error('No API key found. Please set up your API key first.');
      }

      // Extract assessment data
      const assessmentData = extractAssessmentData();
      
      if (!assessmentData.studentName || assessmentData.assessments.length === 0) {
        throw new Error('Could not extract assessment data from this page.');
      }

      // Generate comment using ChatGPT
      const comment = await generateTeacherComment(assessmentData, apiKey);
      
      // Insert comment into textarea
      const success = insertComment(comment);
      
      if (success) {
        showNotification('AI comment generated successfully! ✨', 'success');
      } else {
        throw new Error('Could not insert comment into the form.');
      }
      
    } catch (error) {
      console.error('Error generating comment:', error);
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      // Re-enable button
      this.disabled = false;
      this.innerHTML = '🤖 Generate AI Comment';
      this.style.background = '#4CAF50';
    }
  });

  buttonContainer.appendChild(generateBtn);
  
  // Insert the button after the "Comments" label
  const commentsLabel = document.querySelector('#commentsLabelWS');
  if (commentsLabel) {
    commentsLabel.parentNode.insertBefore(buttonContainer, commentsLabel.nextSibling);
  } else {
    // Fallback: append to the comments container
    commentsContainer.insertBefore(buttonContainer, commentsContainer.firstChild);
  }

  // Add initial notification
  setTimeout(() => {
    showNotification(hasApiKey ? 
      'AI Comment Generator ready! Click the button to generate a comment.' : 
      'Click the extension icon to set up your OpenAI API key first.', 
      hasApiKey ? 'info' : 'warning', 4000);
  }, 500);
}

// Function to show notifications
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10001;
    padding: 12px 16px;
    border-radius: 6px;
    font-family: Arial, sans-serif;
    font-size: 13px;
    max-width: 280px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease-out;
  `;

  // Set colors based on type
  switch(type) {
    case 'success':
      notification.style.background = '#d4edda';
      notification.style.color = '#155724';
      notification.style.border = '1px solid #c3e6cb';
      break;
    case 'error':
      notification.style.background = '#f8d7da';
      notification.style.color = '#721c24';
      notification.style.border = '1px solid #f5c6cb';
      break;
    case 'warning':
      notification.style.background = '#fff3cd';
      notification.style.color = '#856404';
      notification.style.border = '1px solid #ffeaa7';
      break;
    default: // info
      notification.style.background = '#cce7ff';
      notification.style.color = '#0056b3';
      notification.style.border = '1px solid #99d6ff';
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  // Remove notification after duration
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
}
