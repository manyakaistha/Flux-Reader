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
