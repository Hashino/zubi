/**
 * Chat Service - Shared between Driver and Passenger Apps
 * 
 * Handles real-time messaging between drivers and passengers during trips.
 * 
 * Current Status: MVP - Mock implementation
 * Production TODO:
 * - Replace with real P2P messaging (libp2p, Nostr)
 * - Add encryption for messages
 * - Add message persistence
 * - Implement message queue for offline scenarios
 * - Add typing indicators
 * - Add message status (sent, delivered, read)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock connection setup
  const connectToChat = (tripId, userId, userType) => {
    setIsConnected(true);
    // In production, establish P2P connection or join chat room
    console.log(`Connected to chat for trip ${tripId} as ${userType}`);
    
    // Simulate receiving a welcome message
    setTimeout(() => {
      addMessage({
        id: Date.now(),
        text: 'Chat conectado! Você pode conversar durante a viagem.',
        sender: 'system',
        timestamp: Date.now(),
        type: 'system'
      });
    }, 1000);
  };

  const disconnectFromChat = () => {
    setIsConnected(false);
    setMessages([]);
    setUnreadCount(0);
    console.log('Disconnected from chat');
  };

  const sendMessage = (text, senderId, senderType) => {
    if (!isConnected || !text.trim()) return false;

    const message = {
      id: Date.now() + Math.random(),
      text: text.trim(),
      sender: senderId,
      senderType,
      timestamp: Date.now(),
      type: 'user',
      status: 'sent'
    };

    setMessages(prev => [...prev, message]);

    // Simulate receiving response (for demo)
    if (senderType === 'passenger') {
      setTimeout(() => {
        simulateDriverResponse();
      }, 2000 + Math.random() * 3000);
    }

    return true;
  };

  const simulateDriverResponse = () => {
    const responses = [
      'Entendido!',
      'Já estou a caminho!',
      'Chego em poucos minutos.',
      'Tudo certo, obrigado pela informação.',
      'Pode deixar comigo!',
      'Estou chegando no local.',
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    
    const message = {
      id: Date.now() + Math.random(),
      text: response,
      sender: 'driver123',
      senderType: 'driver',
      timestamp: Date.now(),
      type: 'user',
      status: 'delivered'
    };

    setMessages(prev => [...prev, message]);
    setUnreadCount(prev => prev + 1);
  };

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const startTyping = () => {
    setIsTyping(true);
    // In production, notify other party
  };

  const stopTyping = () => {
    setIsTyping(false);
    // In production, notify other party
  };

  // Quick message templates
  const quickMessages = {
    passenger: [
      'Onde você está?',
      'Estou esperando no local',
      'Já estou descendo',
      'Obrigado!',
      'Pode parar aqui',
    ],
    driver: [
      'Já estou a caminho',
      'Chego em 2 minutos',
      'Estou na frente',
      'Buzinei para você',
      'Boa viagem!',
    ]
  };

  const sendQuickMessage = (messageText, senderId, senderType) => {
    return sendMessage(messageText, senderId, senderType);
  };

  return (
    <ChatContext.Provider value={{
      messages,
      isConnected,
      isTyping,
      unreadCount,
      connectToChat,
      disconnectFromChat,
      sendMessage,
      sendQuickMessage,
      markAsRead,
      startTyping,
      stopTyping,
      quickMessages
    }}>
      {children}
    </ChatContext.Provider>
  );
};