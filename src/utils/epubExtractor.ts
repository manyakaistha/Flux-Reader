import { RSVPToken } from '../types';
import { generateTokenStream } from './tokenizer';

/**
 * HTML template for epub.js text extraction in WebView
 */
export const EPUB_WORKER_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>
  <script>
    let book = null;

    // Listen for messages from React Native
    document.addEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);
    
    // Signal ready
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));

    function handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'extract') {
                extractText(data.epubBase64);
            }
        } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Message parse error: ' + e.message }));
        }
    }

    async function extractText(base64Data) {
        try {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'debug', message: 'Starting EPUB load...' }));
            
            // Load book from base64
            book = ePub(base64Data, { encoding: 'base64' });
            
            await book.ready;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'debug', message: 'Book ready. Parsing spine...' }));

            const pages = {};
            let pageCount = 0;
            const spine = book.spine;
            const spineItems = spine.spineItems; // Access internal array if needed, or use iteration

            // Iterate through spine items (chapters/sections)
            // Note: EPUBs don't have fixed "pages" like PDFs. We will treat each spine item as a "page" 
            // or split long spine items. For text extraction simplicity, let's treat each spine item as a section.
            
            for (let i = 0; i < spine.length; i++) {
                const item = spine.get(i);
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'debug', message: 'Processing section ' + (i+1) + '/' + spine.length }));
                
                // Load the section content
                // We use load() to get the document
                const doc = await item.load(book.load.bind(book));
                
                if (!doc) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'debug', message: 'Warning: Failed to load document for section ' + i }));
                    continue;
                }

                // Extract text from the document body
                // Simple textContent extraction. For better structure, we might want to traverse.
                // Replace newlines with spaces to avoid breaking RSVP flow, or keep them for paragraphs.
                const body = doc.body || doc.documentElement; // Fallback for some XML types
                const text = body ? (body.textContent || "") : "";
                
                // Simple cleanup
                const cleanText = text.replace(/\\s+/g, ' ').trim();
                
                if (cleanText.length > 0) {
                   pageCount++;
                   pages[pageCount] = {
                       text: cleanText,
                       lines: [], // EPUB doesn't give us lines easily, we'll let tokenizer handle the raw text
                       width: 0,
                       height: 0
                   };
                   
                   // Send progress
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'progress',
                        current: i + 1,
                        total: spine.length
                    }));
                }
                
                // Unload to save memory
                // item.unload(); // epub.js v0.3 might handle this, or we call unload() if available
            }

            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'complete',
                totalPages: pageCount,
                pages: pages
            }));

        } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Extraction error: ' + e.message }));
        }
    }
  </script>
</head>
<body></body>
</html>
`;

/**
 * Process extracted EPUB text into token stream
 * Same pipeline as PDF, since we normalize the data structure in the worker.
 */
export function processExtractedEpubText(
    extractedData: { totalPages: number; pages: { [key: number]: { text: string; lines: { text: string; lineIndex: number }[] } } },
    docId: string
): RSVPToken[] {
    return generateTokenStream(extractedData.pages, docId);
}
