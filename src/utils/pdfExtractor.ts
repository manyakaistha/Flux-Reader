import { RSVPToken } from '../types';
import { generateTokenStream } from './tokenizer';

/**
 * Simple hash function for cache validation
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * HTML template for pdf.js text extraction in WebView
 */
export const PDF_WORKER_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    async function extractText(pdfData, pdfUrl) {
      try {
        // Send debug message
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'debug',
          message: 'extractText called with pdfUrl: ' + (pdfUrl ? 'YES' : 'NO') + ', pdfData: ' + (pdfData ? 'YES (' + pdfData.length + ' chars)' : 'NO')
        }));
        
        let loadingTask;
        if (pdfData) {
          // Prefer base64 data if available
          console.log('Loading PDF from base64 data');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'debug',
            message: 'Loading from base64 data...'
          }));
          loadingTask = pdfjsLib.getDocument({ data: atob(pdfData) });
        } else if (pdfUrl) {
          // Fallback to URL (may not work for file:// due to CORS)
          console.log('Loading PDF from URL:', pdfUrl);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'debug',
            message: 'Loading from URL: ' + pdfUrl
          }));
          loadingTask = pdfjsLib.getDocument(pdfUrl);
        } else {
          throw new Error('No PDF data or URL provided');
        }
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'debug',
          message: 'Waiting for PDF to load...'
        }));
        
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        const pages = {};
        
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1.0 });
          
          // Group items into lines based on Y-coordinate proximity
          const lines = groupItemsIntoLines(textContent.items);
          
          // Sort lines by Y (top to bottom) and items within lines by X (left to right)
          const sortedLines = lines
            .sort((a, b) => b.y - a.y) // Higher Y = higher on page
            .map(line => ({
              ...line,
              items: line.items.sort((a, b) => a.x - b.x),
              text: line.items.sort((a, b) => a.x - b.x).map(item => item.str).join('')
            }));
          
          pages[pageNum] = {
            text: sortedLines.map(l => l.text).join('\\n'),
            lines: sortedLines.map((l, idx) => ({
              lineIndex: idx,
              text: l.text,
              y: l.y
            })),
            width: viewport.width,
            height: viewport.height
          };
          
          // Send progress
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'progress',
            current: pageNum,
            total: totalPages
          }));
        }
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'complete',
          totalPages,
          pages
        }));
      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    }
    
    function groupItemsIntoLines(items) {
      const lineGroups = [];
      const tolerance = 3; // Y-coordinate tolerance for same line
      
      items.forEach(item => {
        // Get transform matrix to extract position
        const x = item.transform[4];
        const y = item.transform[5];
        
        // Find existing line with similar Y
        let existingLine = lineGroups.find(line => 
          Math.abs(line.y - y) < tolerance
        );
        
        if (existingLine) {
          existingLine.items.push({ str: item.str, x, y, width: item.width, height: item.height });
        } else {
          lineGroups.push({
            y,
            items: [{ str: item.str, x, y, width: item.width, height: item.height }]
          });
        }
      });
      
      return lineGroups;
    }
    
    // Listen for messages from React Native
    document.addEventListener('message', function(e) {
      const data = JSON.parse(e.data);
      if (data.type === 'extract') {
        extractText(data.pdfBase64, data.pdfUrl);
      }
    });
    
    // For Android
    window.addEventListener('message', function(e) {
      const data = JSON.parse(e.data);
      if (data.type === 'extract') {
        extractText(data.pdfBase64, data.pdfUrl);
      }
    });
  </script>
</head>
<body>
  <p>PDF Extraction Worker</p>
</body>
</html>
`;

/**
 * Process extracted pages into token stream
 */
export function processExtractedText(
  extractedData: { totalPages: number; pages: { [key: number]: { text: string; lines: { lineIndex: number; text: string }[] } } },
  docId: string
): RSVPToken[] {
  return generateTokenStream(extractedData.pages, docId);
}

/**
 * Validate extracted text
 */
export function validateExtraction(tokens: RSVPToken[]): { valid: boolean; error?: string } {
  if (!tokens || tokens.length === 0) {
    return { valid: false, error: 'No text found in PDF. It may be a scanned document or image-only PDF.' };
  }

  const wordCount = tokens.filter(t => t.type === 'word').length;
  if (wordCount < 5) {
    return { valid: false, error: 'Very little readable text found in this PDF.' };
  }

  return { valid: true };
}

/**
 * Count words in token array
 */
export function countWords(tokens: RSVPToken[]): number {
  return tokens.filter(t => t.type === 'word' || t.type === 'number').length;
}
