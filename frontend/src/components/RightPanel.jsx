import ChatInterface from './ChatInterface';
import QuizInterface from './QuizInterface';

function RightPanel({ activeTab, setActiveTab, selectedDocument }) {
  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* Tab Switcher */}
      <div className="border-b border-gray-200 px-6 py-3">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'quiz'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📝 Quiz
          </button>
        </div>
      </div>

      {/* Active Interface */}
      <div className="flex-1 overflow-hidden">
        {!selectedDocument ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-4xl mb-2">🤖</p>
              <p>Upload a document to get started</p>
            </div>
          </div>
        ) : activeTab === 'chat' ? (
          <ChatInterface selectedDocument={selectedDocument} />
        ) : (
          <QuizInterface selectedDocument={selectedDocument} />
        )}
      </div>
    </div>
  );
}

export default RightPanel;
