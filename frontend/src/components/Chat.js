import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import './Chat.css';

const Chat = ({ messages, onSendMessage, onTyping, typingUsers, disabled }) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && !disabled) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      setIsTyping(false);
      onTyping(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      onTyping(true);
    } else if (isTyping && !value.trim()) {
      setIsTyping(false);
      onTyping(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div 
      className="chat-container"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="chat-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3>Game Chat</h3>
        {disabled && <span className="connection-warning">Disconnected</span>}
      </motion.div>

      <motion.div 
        className="messages-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div 
              className="no-messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p>No messages yet. Start the conversation!</p>
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={index}
                className={`message ${message.sender?.id === user?.id ? 'own-message' : 'other-message'}`}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 200
                }}
              >
                <motion.div 
                  className="message-header"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="message-sender">
                    {message.sender?.id === user?.id ? 'You' : message.sender?.username}
                  </span>
                  <span className="message-time">
                    {formatTime(message.timestamp)}
                  </span>
                </motion.div>
                <motion.div 
                  className="message-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {message.content}
                </motion.div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div 
              className="typing-indicator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </motion.div>

      <motion.form 
        onSubmit={handleSubmit} 
        className="message-input-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder={disabled ? "Disconnected..." : "Type a message..."}
          disabled={disabled}
          className="message-input"
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        />
        <motion.button 
          type="submit" 
          disabled={disabled || !newMessage.trim()}
          className="send-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Send
        </motion.button>
      </motion.form>
    </motion.div>
  );
};

export default Chat; 