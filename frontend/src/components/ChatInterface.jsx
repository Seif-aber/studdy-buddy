import { useState } from 'react';
import axios from 'axios';

function ChatInterface({ currentDocument }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Format text with markdown-style bold and italic
  const formatText = (text) => {
    if (!text) return text;
    
    let formatted = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')  // Bold: **text**
      .replace(/\*(.+?)\*/g, '<em>$1</em>');              // Italic: *text*
    
    return formatted;
  };

  // Component to render formatted text
  const FormattedText = ({ text }) => {
    const formatted = formatText(text);
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const currentQuery = input;
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add a placeholder for the streaming response
    const aiMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      sources: [],
      context_used: 0,
      isStreaming: true
    }]);

    try {
      // Use Server-Sent Events for streaming
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentQuery,
          document_id: currentDocument?.id || null,
          conversation_history: messages,
          n_results: 5
        }),
      });

      if (!response.ok) {
        throw new Error('Stream request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'content') {
              // Append content chunk
              setMessages(prev => {
                const updated = [...prev];
                updated[aiMessageIndex] = {
                  ...updated[aiMessageIndex],
                  content: updated[aiMessageIndex].content + data.data
                };
                return updated;
              });
            } else if (data.type === 'sources') {
              // Add sources and context info
              setMessages(prev => {
                const updated = [...prev];
                updated[aiMessageIndex] = {
                  ...updated[aiMessageIndex],
                  sources: data.data.sources,
                  context_used: data.data.context_used,
                  isStreaming: false
                };
                return updated;
              });
            } else if (data.type === 'done') {
              // Streaming complete
              setMessages(prev => {
                const updated = [...prev];
                updated[aiMessageIndex] = {
                  ...updated[aiMessageIndex],
                  isStreaming: false
                };
                return updated;
              });
            } else if (data.type === 'error') {
              throw new Error(data.data);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const updated = [...prev];
        updated[aiMessageIndex] = {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your question. Please try again.',
          isError: true,
          isStreaming: false
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-lg">Ask me anything about your document!</p>
            <p className="text-sm mt-2">Try: "Summarize this document" or "What are the key points?"</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.isError
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  <FormattedText text={msg.content} />
                  {msg.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-gray-600 animate-pulse"></span>
                  )}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs font-semibold mb-1">📚 Sources:</p>
                    {msg.sources.map((source, i) => (
                      <p key={i} className="text-xs opacity-75">
                        • {source.filename} (Page {source.page_number}) - {Math.round(source.similarity * 100)}% relevant
                      </p>
                    ))}
                  </div>
                )}
                {msg.context_used && (
                  <p className="text-xs mt-2 opacity-60">
                    Used {msg.context_used} context chunks
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <p className="text-gray-500">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your document..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
