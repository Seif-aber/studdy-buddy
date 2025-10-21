import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker using Vite-resolved asset URL
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

function PDFViewer({ document }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(null);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
  }

  function onDocumentLoadError(error) {
    console.error('Error loading PDF:', error);
    setError(error.message);
  }

  const fileUrl = document.file ? URL.createObjectURL(document.file) : null;

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* PDF Display */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
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
              width={500}
            />
          </Document>
        )}
      </div>

      {/* Page Navigation */}
      {numPages && (
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg font-medium transition-colors"
          >
            ← Previous
          </button>
          
          <span className="text-sm text-gray-600">
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
      )}
    </div>
  );
}

export default PDFViewer;
