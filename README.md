# 🔍 Element Embeddings Chrome Extension

A Chrome extension that adds an `.embedding` property to every HTML element on web pages, powered by Google's Gemini AI embedding model.

## Features

- **Universal Element Embeddings**: Automatically adds `.embedding` property to all HTML elements
- **Multi-Modal Support**: Handles text, images, audio, and video elements differently
- **Gemini AI Integration**: Uses Google's powerful Gemini embedding model
- **Intelligent Caching**: Avoids redundant API calls for better performance
- **Real-time Processing**: Handles dynamically added content via mutation observers

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension will be installed and ready to use

## Configuration

1. Click the extension icon in your browser toolbar
2. Enter your Gemini API key (get one at [Google AI Studio](https://ai.google.dev/gemini-api))
3. Click "Save Key" to store it securely
4. Optionally test your key using the "Test Key" button

## Usage

Once installed and configured, every HTML element on any webpage will have an `.embedding` property that returns a promise resolving to the element's embedding data.

### Basic Example

```javascript
// Get embedding for any element
const element = document.querySelector('p');
const embedding = await element.embedding;
console.log(embedding);

// Example output:
{
  vector: [0.1, -0.2, 0.3, ...], // 768-dimensional vector
  content: "Element text content",
  type: "text",
  timestamp: 1640995200000,
  model: "text-embedding-004"
}
```

### Element Type Handling

The extension processes different element types intelligently:

#### Text Elements
```javascript
const paragraph = document.querySelector('p');
const embedding = await paragraph.embedding;
// Uses the element's innerText for embedding generation
```

#### Images
```javascript
const image = document.querySelector('img');
const embedding = await image.embedding;
// Uses alt text and src information for embedding
```

#### Videos
```javascript
const video = document.querySelector('video');
const embedding = await video.embedding;
// Uses title, aria-label, and src for embedding
```

#### Audio
```javascript
const audio = document.querySelector('audio');
const embedding = await audio.embedding;
// Uses title, aria-label, and src for embedding
```

### Advanced Usage

#### Batch Processing
```javascript
// Get embeddings for multiple elements
const elements = document.querySelectorAll('p, h1, h2');
const embeddings = await Promise.all(
  Array.from(elements).map(el => el.embedding)
);
```

#### Semantic Search
```javascript
// Find semantically similar elements
async function findSimilarElements(queryElement, candidates) {
  const queryEmbedding = await queryElement.embedding;
  const candidateEmbeddings = await Promise.all(
    candidates.map(el => el.embedding)
  );
  
  // Calculate cosine similarity (simplified)
  const similarities = candidateEmbeddings.map((emb, i) => ({
    element: candidates[i],
    similarity: cosineSimilarity(queryEmbedding.vector, emb.vector)
  }));
  
  return similarities.sort((a, b) => b.similarity - a.similarity);
}
```

#### Content Analysis
```javascript
// Analyze page content
async function analyzePageContent() {
  const textElements = document.querySelectorAll('p, h1, h2, h3');
  const embeddings = await Promise.all(
    Array.from(textElements).map(async el => ({
      element: el,
      embedding: await el.embedding,
      text: el.innerText
    }))
  );
  
  return embeddings.filter(item => item.embedding.vector);
}
```

## API Reference

### Embedding Object Structure

```typescript
interface Embedding {
  vector: number[];        // 768-dimensional embedding vector
  content: string;         // Processed content used for embedding
  type: 'text' | 'image' | 'video' | 'audio'; // Element type
  timestamp: number;       // When embedding was generated
  model: string;          // Model used ('text-embedding-004')
  error?: string;         // Error message if embedding failed
}
```

### Error Handling

```javascript
const element = document.querySelector('div');
const embedding = await element.embedding;

if (embedding.error) {
  console.error('Embedding failed:', embedding.error);
} else {
  console.log('Embedding vector:', embedding.vector);
}
```

## Performance Considerations

- **Caching**: Embeddings are cached to avoid redundant API calls
- **Batch Processing**: Elements are processed in batches to avoid blocking the main thread
- **Lazy Loading**: Embeddings are only generated when accessed
- **Rate Limiting**: Be mindful of API rate limits when processing many elements

## Privacy & Security

- API keys are stored securely in Chrome's sync storage
- Only the processed content (not raw media) is sent to the API
- Caching reduces the number of API calls needed

## Development

### File Structure
```
/
├── manifest.json       # Extension manifest
├── content.js         # Content script (adds .embedding property)
├── background.js      # Background script (API communication)
├── popup.html        # Extension popup UI
├── popup.js          # Popup functionality
├── popup.css         # Popup styles
└── icons/            # Extension icons
```

### Building
No build process required - this is a pure JavaScript extension.

### Testing
Use the "Demo" button in the extension popup to test functionality on the current page.

## Troubleshooting

### No API Key Configured
- Open the extension popup and enter your Gemini API key
- Test the key to ensure it's valid

### Embedding Returns Error
- Check console for detailed error messages
- Verify API key is valid and has sufficient quota
- Ensure element has content to embed

### Performance Issues
- Large pages may take time to process all elements
- Consider processing only visible elements for better performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Licensed under the Apache License, Version 2.0. See LICENSE file for details.

## Support

For issues and questions, please open an issue on the GitHub repository.
