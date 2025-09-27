# Work Sampling Teacher Comment Generator

A Chrome extension that uses AI to generate thoughtful, compassionate teacher comments for Work Sampling System assessments.

## Features

- **One-Click Generation**: Generate AI comments with a single click using the on-page button
- **Automated Data Extraction**: Intelligently extracts student assessment data from Work Sampling System pages
- **AI-Powered Comments**: Uses OpenAI's GPT-4 to generate professional, compassionate teacher comments
- **Teacher Persona**: Comments are written from the perspective of an exceptional preschool teacher
- **Seamless Integration**: Adds a floating button directly on Work Sampling pages for instant access
- **Smart API Management**: Remembers your API key and shows setup status
- **Visual Feedback**: Real-time notifications and button states show generation progress
- **Dual Interface**: Use either the convenient on-page button or the extension popup
- **Secure**: API keys stored locally in Chrome, never transmitted to third parties

## Installation

1. **Download the Extension Files**
   - Download all files in this folder to a local directory on your computer

2. **Create Extension Icons** (Required)
   Since Chrome extensions require icon files, create three simple PNG icons:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels) 
   - `icon128.png` (128x128 pixels)
   
   You can use any simple icon - even a solid colored square will work for testing.

3. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the folder containing all the extension files
   - The extension should appear in your extensions list

4. **Get OpenAI API Key**
   - Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Create an account if you don't have one
   - Generate a new API key (starts with "sk-")
   - Copy the key - you'll need it to use the extension

## Usage

### First-Time Setup
1. **Install the Extension** (see Installation section above)
2. **Navigate to a Work Sampling Assessment Page**
   - Log into your Work Sampling System
   - Go to a student's checklist entry page
   - The page should have a comment textarea at the bottom
3. **Set up API Key**
   - Click the extension icon in your Chrome toolbar
   - Enter your OpenAI API key in the popup
   - Check "Remember API key" to save it for future use
   - Click "Generate Comment" (or close popup to use the on-page button)

### Daily Usage (After Setup)
1. **Navigate to any Work Sampling Assessment Page**
   - You'll see a green "🤖 Generate AI Comment" button in the top-right corner
   - If you haven't set up your API key yet, it will show "⚙️ Setup AI Key" in orange

2. **Generate Comments Instantly**
   - Simply click the "🤖 Generate AI Comment" button
   - The button will show "⏳ Generating..." while working
   - The AI comment will automatically appear in the comment textarea

3. **Review and Submit**
   - Review the generated comment and make any necessary edits
   - Submit the form as usual

### Alternative Method
You can also use the extension popup:
- Click the extension icon in your Chrome toolbar
- Click "Generate Comment" in the popup
- This is useful if you want to change your API key settings

## How It Works

1. **Data Extraction**: The extension analyzes the assessment page to extract:
   - Student name, gender, birthday, and grade level
   - Assessment categories and ratings (NY, IP, PRO, NA, DNO)
   - Subject area being assessed

2. **AI Processing**: This data is sent to OpenAI's GPT-4 with a carefully crafted prompt that:
   - Establishes the AI as an exceptional preschool teacher
   - Emphasizes compassion, professionalism, and encouragement
   - Requests comments highlighting strengths while acknowledging growth areas
   - Ensures age-appropriate language for preschool contexts

3. **Comment Generation**: The AI generates a 150-300 word comment that:
   - Celebrates the child's achievements
   - Provides insight into their development
   - Uses warm, professional teacher language
   - Focuses on growth and encouragement

## Privacy & Security

- **API Key Storage**: Your OpenAI API key is stored locally in Chrome's storage - it never leaves your browser
- **Data Processing**: Assessment data is only sent to OpenAI's API and is not stored by this extension
- **No Third-Party Tracking**: The extension doesn't collect or transmit any personal data

## Cost Considerations

- This extension uses OpenAI's GPT-4 API, which charges per token
- Typical cost per comment generation: $0.01-0.03 USD
- You can monitor usage in your OpenAI dashboard

## Troubleshooting

### Extension Not Working
- Ensure all files are in the same folder
- Check that icon files exist (create simple PNG files if needed)
- Reload the extension in `chrome://extensions/`

### "Not a Work Sampling Page" Error
- Ensure you're on a student's checklist entry page
- The page should have both a comment textarea (#comments) and assessment table
- Try refreshing the page

### API Errors
- Check that your API key is valid and starts with "sk-"
- Ensure you have credits available in your OpenAI account
- Try generating the comment again

### Comment Not Inserted
- Check that the comment textarea exists on the page
- Try clicking in the textarea before generating
- Refresh the page and try again

## Support

This extension is designed specifically for the Work Sampling System interface. If you encounter issues:

1. Check the browser console for error messages (F12 → Console tab)
2. Verify you're on the correct type of assessment page
3. Ensure your OpenAI API key is valid and has available credits

## Files in This Extension

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface  
- `popup.js` - Popup functionality and API key management
- `content.js` - Page interaction and data extraction
- `icon16.png`, `icon48.png`, `icon128.png` - Extension icons (you need to create these)

## Version History

- **v1.0** - Initial release with GPT-4 integration and compassionate teacher persona
