/**
 * Thumbnail Generator Utility
 * Uses pdf.js in a WebView to render the first page of a PDF as an image
 */

/**
 * HTML template for pdf.js thumbnail generation in WebView
 */
export const THUMBNAIL_GENERATOR_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { margin: 0; padding: 0; background: transparent; }
    canvas { display: block; }
  </style>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    async function generateThumbnail(pdfBase64, targetWidth) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'debug',
          message: 'Starting thumbnail generation...'
        }));
        
        if (!pdfBase64) {
          throw new Error('No PDF data provided');
        }
        
        // Decode base64 and load PDF
        const loadingTask = pdfjsLib.getDocument({ data: atob(pdfBase64) });
        const pdf = await loadingTask.promise;
        
        // Get first page
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Calculate scale to fit target width
        const scale = targetWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        
        // Render page to canvas
        await page.render({
          canvasContext: context,
          viewport: scaledViewport
        }).promise;
        
        // Convert to base64 PNG
        const dataUrl = canvas.toDataURL('image/png', 0.8);
        const base64Image = dataUrl.split(',')[1];
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'complete',
          base64Image: base64Image,
          width: canvas.width,
          height: canvas.height
        }));
        
      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: error.message || 'Unknown error'
        }));
      }
    }
    
    // Listen for messages from React Native
    document.addEventListener('message', function(e) {
      const data = JSON.parse(e.data);
      if (data.type === 'generate') {
        generateThumbnail(data.pdfBase64, data.targetWidth || 200);
      }
    });
    
    // For Android
    window.addEventListener('message', function(e) {
      const data = JSON.parse(e.data);
      if (data.type === 'generate') {
        generateThumbnail(data.pdfBase64, data.targetWidth || 200);
      }
    });
  </script>
</head>
<body>
</body>
</html>
`;


/**
 * Generate a unique filename for a thumbnail
 */
export function generateThumbnailFilename(docId: number): string {
  return `thumbnail_${docId}_${Date.now()}.png`;
}

/**
 * HTML template for epub.js thumbnail generation in WebView
 */
export const EPUB_THUMBNAIL_GENERATOR_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>
  <style>
    body { margin: 0; padding: 0; background: #fff; overflow: hidden; }
    #cover { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
    img { max-width: 100%; max-height: 100%; object-fit: contain; }
  </style>
  <script>
    document.addEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);

    function handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'generate') {
                generateThumbnail(data.epubBase64);
            }
        } catch (e) {
             window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Parse error: ' + e.message }));
        }
    }

    async function generateThumbnail(base64Data) {
        try {
             window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'debug', message: 'Starting EPUB thumbnail...' }));
             
             const book = ePub(base64Data, { encoding: 'base64' });
             await book.ready;
             
             // Try to get cover URL
             // This often returns a blob URL or internal path
             const coverUrl = await book.coverUrl();
             
             if (coverUrl) {
                 // Convert blob/url to base64 via canvas
                 const img = new Image();
                 img.crossOrigin = "Anonymous";
                 img.onload = function() {
                     const canvas = document.createElement('canvas');
                     canvas.width = img.width;
                     canvas.height = img.height;
                     const ctx = canvas.getContext('2d');
                     ctx.drawImage(img, 0, 0);
                     
                     const dataUrl = canvas.toDataURL('image/png', 0.8);
                     const base64Image = dataUrl.split(',')[1];
                     
                     window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'complete',
                        base64Image: base64Image
                     }));
                 };
                 img.onerror = function() {
                     // Fallback if image fails to load (e.g. CORS)
                     generateFallbackThumbnail(book);
                 };
                 img.src = coverUrl;
             } else {
                 // No cover found
                 generateFallbackThumbnail(book);
             }
             
        } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Thumbnail error: ' + e.message }));
        }
    }
    
    function generateFallbackThumbnail(book) {
        // Simple fallback: just capture the first page of text? 
        // Or just fail gracefully so app uses default icon.
        // Let's try to render the first page.
        
        // For now, let's just return error so app uses default icon, 
        // or we could generate a placeholder.
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'No cover found' }));
    }
  </script>
</head>
<body>
  <div id="cover"></div>
</body>
</html>
`;
