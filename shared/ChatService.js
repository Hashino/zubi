/**
 * Chat Service - Shared between Driver and Passenger Apps
 * 
 * Handles real-time messaging between drivers and passengers during trips.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const connectToChat = (tripId, userId, userType) => {
    setIsConnected(true);
    console.log(`Connected to chat for trip ${tripId} as ${userType}`);
    
    addMessage({
      id: Date.now(),
      text: 'Chat conectado! Você pode conversar durante a viagem.',
      sender: 'system',
      timestamp: Date.now(),
      type: 'system'
    });
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
    return true;
  };

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const startTyping = () => {
    setIsTyping(true);
  };

  const stopTyping = () => {
    setIsTyping(false);
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