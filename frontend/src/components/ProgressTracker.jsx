import { useState, useEffect } from 'react';

function ProgressTracker({ taskId, onComplete, onError }) {
  const [progress, setProgress] = useState({
    status: 'started',
    message: 'Initializing...',
    progress: 0,
    current_stage: 'Starting'
  });

  useEffect(() => {
    if (!taskId) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/documents/status/${taskId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const data = await response.json();
        setProgress(data);

        if (data.status === 'completed') {
          onComplete?.(data.result);
        } else if (data.status === 'failed') {
          onError?.(data.message);
        } else {
          // Continue polling if still processing
          setTimeout(checkStatus, 500);
        }
      } catch (error) {
        console.error('Error checking status:', error);
        onError?.(error.message);
      }
    };

    checkStatus();
  }, [taskId, onComplete, onError]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Processing PDF
        </h3>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{progress.current_stage}</span>
            <span>{progress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        <p className="text-sm text-gray-500 text-center">
          {progress.message}
        </p>

        {/* Spinner for processing state */}
        {progress.status === 'processing' && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {progress.status === 'failed' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              ❌ {progress.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgressTracker;
