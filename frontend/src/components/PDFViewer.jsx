import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function PDFViewer({ document }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const [fileUrl, setFileUrl] = useState(null);

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 2.5;
  const SCALE_STEP = 0.25;

  useEffect(() => {
    if (document?.file) {
      const url = URL.createObjectURL(document.file);
      setFileUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setFileUrl(null);
    }
  }, [document]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
    setScale(1);
  }

  function onDocumentLoadError(error) {
    console.error('Error loading PDF:', error);
    setError(error.message);
  }

  const handleZoomIn = () => {
    setScale((current) => Math.min(MAX_SCALE, Number((current + SCALE_STEP).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((current) => Math.max(MIN_SCALE, Number((current - SCALE_STEP).toFixed(2))));
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* PDF Display */}
      <div className="flex-1 overflow-auto p-4">
        <div className="min-w-max inline-block">
          {error && (
            <div className="text-red-500 p-4">
              <p>Failed to load PDF</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          )}
          {fileUrl && !error && (
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="text-gray-500 p-4 text-center">
                  <div className="animate-pulse">Loading PDF...</div>
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                className="shadow-lg"
                renderTextLayer={false}
                renderAnnotationLayer={false}
                scale={scale}
              />
            </Document>
          )}
        </div>
      </div>

      {/* Page Navigation */}
      {numPages && (
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber <= 1}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg font-medium transition-colors"
            >
              ← Previous
            </button>
            
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Page {pageNumber} of {numPages}
            </span>
            
            <button
              onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
              disabled={pageNumber >= numPages}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg font-medium transition-colors"
            >
              Next →
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={scale <= MIN_SCALE}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg font-medium transition-colors"
              title="Zoom out"
            >
              −
            </button>
            <span className="text-sm text-gray-600 w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= MAX_SCALE}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg font-medium transition-colors"
              title="Zoom in"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PDFViewer;
