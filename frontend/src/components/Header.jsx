import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

function Header({ onUpload }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="text-2xl font-bold text-blue-600">
          📚 AIStudyBuddy
        </div>
      </div>
      
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          {isDragActive ? 'Drop PDF here' : '+ Upload PDF'}
        </button>
      </div>
    </header>
  );
}

export default Header;
