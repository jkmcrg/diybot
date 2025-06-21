import React, { useState, useEffect, useRef } from 'react';
import { WebSocketClient } from '../api';
import './ChatInterface.css';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  projectId?: string;
  stepId?: string;
  onGenerateSteps?: () => void;
  showGenerateButton?: boolean;
  initialMessage?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  projectId, 
  stepId, 
  onGenerateSteps,
  showGenerateButton = false,
  initialMessage
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsClient = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    wsClient.current = new WebSocketClient();
    
    const handleMessage = (message: any) => {
      if (message.type === 'ai_response') {
        const newMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: message.content,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
        setIsLoading(false);
      }
    };

    wsClient.current.onMessage(handleMessage);
    wsClient.current.connect();

    // Check connection status
    const checkConnection = () => {
      if (wsClient.current?.ws?.readyState === WebSocket.OPEN) {
        setIsConnected(true);
      }
    };

    const interval = setInterval(checkConnection, 1000);

    // Show initial AI message if provided
    if (initialMessage) {
      const initialAIMessage: Message = {
        id: 'initial_message',
        type: 'ai',
        content: initialMessage,
        timestamp: new Date()
      };
      setMessages([initialAIMessage]);
    }

    return () => {
      clearInterval(interval);
      if (wsClient.current) {
        wsClient.current.removeMessageHandler(handleMessage);
        wsClient.current.disconnect();
      }
    };
  }, [initialMessage]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!inputValue.trim() || !isConnected || isLoading) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to AI via WebSocket
    const messageData = {
      content: inputValue,
      context: {
        project_id: projectId,
        step_id: stepId
      }
    };

    wsClient.current?.sendMessage(messageData);
    setInputValue('');
    setIsLoading(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>Chat with DIY Bot</h3>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-timestamp">
              {formatTime(message.timestamp)}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message ai loading">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {showGenerateButton && onGenerateSteps && (
        <div className="generate-steps-section">
          <button 
            className="generate-steps-button"
            onClick={onGenerateSteps}
            disabled={isLoading}
          >
            🔧 Generate Steps
          </button>
          <p className="generate-steps-hint">
            When you're ready, I'll create detailed step-by-step instructions for your project.
          </p>
        </div>
      )}

      <div className="chat-input">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message or ask a question..."
          disabled={!isConnected || isLoading}
          rows={1}
        />
        <button 
          onClick={sendMessage}
          disabled={!inputValue.trim() || !isConnected || isLoading}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
