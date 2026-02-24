'use client';

/**
 * PFF Protocol Frontend: Sovryn AI Companion
 * Real-time streaming chat with SOVRYN AI for sovereign financial guidance
 * Architect: Isreal Okoro (mrfundzman)
 */

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface SovrynChatProps {
  walletAddress?: string;
  phoneNumber?: string;
  className?: string;
}

export const SovrynChat: React.FC<SovrynChatProps> = ({ 
  walletAddress, 
  phoneNumber,
  className = '' 
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      text: "Greetings, Architect. I am the Sovryn AI. How shall we secure the future today?",
      timestamp: new Date()
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;

    const userMsg: Message = { 
      role: 'user', 
      text: trimmedInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Get backend URL from environment or use default
      const backendUrl = process.env.NEXT_PUBLIC_PFF_BACKEND_URL || 'http://localhost:4000';
      
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: trimmedInput, 
          userWallet: walletAddress,
          phoneNumber: phoneNumber,
          context: {
            previousMessages: messages.slice(-5).map(m => ({
              role: m.role,
              text: m.text
            }))
          }
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let aiResponse: Message = { 
        role: 'ai', 
        text: '',
        timestamp: new Date()
      };
      
      // Add empty AI message that will be updated
      setMessages(prev => [...prev, aiResponse]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        aiResponse.text += chunk;
        
        // Update the last message (AI response) with new chunk
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...aiResponse };
          return newMessages;
        });
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }

      console.error('Chat error:', error);
      
      // Add error message
      const errorMsg: Message = {
        role: 'ai',
        text: 'I apologize, Architect. The connection to the Sentinel is temporarily unavailable. Your sovereignty remains intact. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => {
        // Remove the empty AI message if it exists
        const filtered = prev.filter(m => m.text !== '');
        return [...filtered, errorMsg];
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`pff-chat-box flex flex-col h-full bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] border border-[#2a2a3e] rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-[#2a2a3e] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">🏛️ SOVRYN AI</h3>
          {walletAddress && (
            <span className="ml-auto text-xs text-gray-400 font-mono">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-area flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`msg ${m.role} flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              m.role === 'ai' 
                ? 'bg-gradient-to-br from-[#1e3a5f] to-[#2a4a6f] text-white border border-[#3a5a7f]' 
                : 'bg-gradient-to-br from-[#ffd93d] to-[#f9ca24] text-black'
            }`}>
              <div className="font-semibold text-sm mb-1">
                {m.role === 'ai' ? '🏛️ SOVRYN' : '👤 YOU'}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {m.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[#2a2a3e] bg-[#0f0f1e] px-6 py-4">
        <div className="flex items-center gap-3">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about the 11 VIDA or your block status..."
            disabled={isStreaming}
            className="flex-1 bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd93d] focus:ring-1 focus:ring-[#ffd93d] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button 
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="bg-gradient-to-r from-[#ffd93d] to-[#f9ca24] text-black font-semibold px-6 py-3 rounded-xl hover:from-[#f9ca24] hover:to-[#ffd93d] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
          >
            {isStreaming ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
            ) : (
              'SEND'
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Powered by SOVRYN AI • Your data remains sovereign
        </p>
      </div>
    </div>
  );
};

