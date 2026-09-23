import React, { useState, useRef, useEffect } from 'react';
import { useMachine } from '../context/MachineContext';
import { askAssistant } from '../api/assistant';
import { Send, Bot, User, AlertCircle, Sparkles } from 'lucide-react';

const Assistant = () => {
  const { selectedMachine } = useMachine();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello! I am your Caterpillar Fleet Copilot. How can I assist you with ${selectedMachine} today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e, customText) => {
    if (e) e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await askAssistant(textToSend, selectedMachine);
      let content = res.answer || "No response received.";
      
      if (res.recommendations && res.recommendations.length > 0) {
        content += '\n\nOperator Recommendations:\n' + res.recommendations.map(r => `• ${r}`).join('\n');
      }

      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch (err) {
      setError(err.message || "Failed to connect to AI Assistant API");
      setMessages(prev => [...prev, { role: 'assistant', content: "Unable to connect to Machine Intelligence Backend. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Why is this machine high risk?",
    "What anomalies were detected?",
    "What should I do about this machine?",
    "Explain the safety alerts."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#FFCD00] flex items-center justify-center text-gray-950 font-black">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-950 uppercase tracking-tight">Caterpillar AI Copilot</h1>
            <p className="text-xs text-gray-500 font-medium">Telemetry Diagnostic Assistant • Unit: <span className="font-bold text-gray-900">{selectedMachine}</span></p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
          <Sparkles size={14} className="text-amber-600" />
          LLM Engine Online
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-white border border-gray-200 rounded-t p-6 overflow-y-auto space-y-4 shadow-xs">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded bg-[#FFCD00] flex items-center justify-center text-gray-950 flex-shrink-0 font-bold shadow-xs">
                <Bot size={18} />
              </div>
            )}
            <div className={`p-4 rounded-lg text-sm max-w-[80%] leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-gray-900 text-white font-medium rounded-br-none shadow-xs' 
                : 'bg-gray-50 border border-gray-200 text-gray-900 whitespace-pre-wrap rounded-bl-none shadow-2xs'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-700 flex-shrink-0 font-bold">
                <User size={18} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded bg-[#FFCD00] flex items-center justify-center text-gray-950 flex-shrink-0">
              <Bot size={18} />
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 rounded-bl-none">
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                <span className="text-xs text-gray-400 ml-2 font-medium">Analyzing telemetry...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 p-3 rounded text-sm justify-center">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form & Suggestions */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b p-4 shadow-xs">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {suggestions.map((s, i) => (
            <button 
              key={i} 
              onClick={() => handleSend(null, s)}
              className="whitespace-nowrap bg-gray-50 border border-gray-300 hover:border-gray-900 hover:bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
            >
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => handleSend(e)} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${selectedMachine} fuel, idle, or anomalies...`}
            className="flex-1 bg-gray-50 border border-gray-300 rounded px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-900 transition-colors"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()} 
            className="cat-btn-primary py-2.5 px-5 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assistant;
