# Installation & Testing Guide

## Prerequisites

1. **Gemini API Key**: Get a free API key from [Google AI Studio](https://ai.google.dev/gemini-api)
2. **Chrome Browser**: Version 88 or later (for Manifest V3 support)

## Installation Steps

### Option 1: Local Installation (Recommended for Development)

1. **Download/Clone the Extension**
   ```bash
   git clone https://github.com/PaulKinlan/Embeddings-.git
   cd Embeddings-
   ```

2. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the extension directory

3. **Configure API Key**
   - Click the extension icon in your browser toolbar
   - Enter your Gemini API key
   - Click "Save Key"
   - Test the key using "Test Key" button

### Option 2: Manual Installation

1. Download the source code as a ZIP file
2. Extract to a local directory
3. Follow steps 2-3 from Option 1 above

## Testing the Extension

### Quick Test

1. **Open any webpage** (try a news site with lots of text)
2. **Open Developer Console** (F12)
3. **Run test code**:
   ```javascript
   // Test on first paragraph
   const p = document.querySelector('p');
   if (p) {
     p.embedding.then(emb => console.log('Embedding:', emb));
   }
   ```

### Comprehensive Test

Use the built-in demo feature:
1. Open the extension popup
2. Click "Try on Current Page"  
3. Check results in the popup

### Manual Testing

```javascript
// Test different element types
const elements = {
  paragraph: document.querySelector('p'),
  heading: document.querySelector('h1'),
  image: document.querySelector('img'),
  link: document.querySelector('a')
};

for (const [type, element] of Object.entries(elements)) {
  if (element) {
    console.log(`Testing ${type}:`, element);
    element.embedding.then(emb => {
      console.log(`${type} embedding:`, emb);
    }).catch(err => {
      console.error(`${type} failed:`, err);
    });
  }
}
```

## Troubleshooting

### Extension Not Loading
- Check that all files are present
- Verify manifest.json syntax
- Check Chrome developer console for errors

### API Key Issues
- Ensure API key is valid and active
- Check API quotas and billing
- Verify network connectivity

### No Embeddings Generated
- Check browser console for error messages
- Ensure elements have text content
- Try refreshing the page

### Performance Issues
- Large pages may take time to process
- Check network tab for API request status
- Consider testing on simpler pages first

## Development Setup

For development and debugging:

1. **Enable Extension Debugging**
   - In `chrome://extensions/`, click "Inspect views: background page" 
   - This opens DevTools for the background script

2. **Monitor API Calls**
   - Open Network tab in DevTools
   - Look for requests to `generativelanguage.googleapis.com`

3. **Debug Content Script**
   - Open DevTools on any webpage
   - Content script logs appear in main console
   - Check `window.embeddingManager` object

## Common Issues

### "API key not configured" Error
- Solution: Configure API key in extension popup

### "Failed to generate embedding" Error
- Check API key validity
- Verify API quotas
- Check element content

### Extension Icon Missing
- Icons are optional for development
- Comment out icons section in manifest.json if needed

### Slow Performance
- Normal for large pages
- Embeddings are cached after first generation
- Consider testing on smaller pages initially

## Next Steps

Once installed and working:
1. Try the extension on different types of websites
2. Experiment with the API in browser console
3. Build applications using the embedding data
4. Share feedback and contribute improvements

## Support

- Check browser console for detailed error messages
- Review the full README.md for API documentation  
- Open issues on GitHub for bugs or feature requests