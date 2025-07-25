'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { capitalizeFirstLetter } from '@/utils/text-utils';
import { getAvatarColor } from '@/utils/avatar-colors';

import { useQueryClient } from '@tanstack/react-query';
import { markMessagesAsRead } from '../actions/mark-messages-read';

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  senderUsername: string;
  isOptimistic?: boolean;
}

export interface ChatUser {
  id: string;
  username: string;
}

interface ChatInterfaceProps {
  conversationId: string;
  currentUser: ChatUser;
  otherUser: ChatUser;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  isSending?: boolean;
}

const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);

  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  } else {
    return format(date, 'MMM d, h:mm a');
  }
};

export const ChatInterface = ({
  conversationId,
  currentUser,
  otherUser,
  messages,
  onSendMessage,
  isLoading,
  isSending,
}: ChatInterfaceProps) => {
  const [messageText, setMessageText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Auto-scroll to bottom when new messages arrive or component mounts
  useEffect(() => {
    if (messagesEndRef.current && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollElement) {
        // Always scroll to bottom for new messages (instant)
        messagesEndRef.current.scrollIntoView({
          behavior: 'auto',
          block: 'end',
        });
      }
    }
  }, [messages, conversationId]); // Also trigger when conversation changes

  //  mark messages as read when conversation opens
  useEffect(() => {
    if (conversationId && currentUser?.id) {
      console.log(
        '🔵 Marking messages as read for conversation:',
        conversationId
      );

      markMessagesAsRead(conversationId).then(result => {
        if (result.success) {
          console.log('✅ Messages marked as read, updating caches...');

          // Immediately update the unread count cache
          queryClient.invalidateQueries({
            queryKey: ['unreadCount', currentUser.id],
          });

          // Also update conversations cache to remove badge
          queryClient.invalidateQueries({
            queryKey: ['conversations', currentUser.id],
          });
        }
      });
    }
  }, [conversationId, currentUser?.id, queryClient]);

  // 🎯 Auto-mark as read when new messages arrive
  useEffect(() => {
    if (conversationId && currentUser?.id && messages.length > 0) {
      // Get the latest message
      const latestMessage = messages[messages.length - 1];

      // If the latest message is from the other user (not from current user)
      if (
        latestMessage &&
        latestMessage.senderId !== currentUser.id &&
        !latestMessage.isOptimistic
      ) {
        console.log(
          '🔵 New message received while chat is open, marking as read...'
        );

        // Small delay to ensure the message is fully processed
        setTimeout(() => {
          markMessagesAsRead(conversationId).then(result => {
            if (result.success) {
              console.log('✅ Auto-marked new message as read');

              queryClient.invalidateQueries({
                queryKey: ['unreadCount', currentUser.id],
              });

              queryClient.invalidateQueries({
                queryKey: ['conversations', currentUser.id],
              });
            }
          });
        }, 100);
      }
    }
  }, [messages, conversationId, currentUser?.id, queryClient]); // 🎯 ADD THIS ENTIRE EFFECT

  const handleSendMessage = () => {
    if (messageText.trim() && !isSending) {
      onSendMessage(messageText.trim());
      setMessageText('');

      // Update caches after sending a message
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['unreadCount', currentUser.id],
        });
        queryClient.invalidateQueries({
          queryKey: ['conversations', currentUser.id],
        });
      }, 500); // Small delay to ensure message is sent
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!conversationId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">
            Choose a conversation from the left to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 border-0 min-h-0">
      {/* Header */}
      <div className="h-16 px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-full ${getAvatarColor(
              otherUser.username
            )} flex items-center justify-center text-white font-medium`}
          >
            {capitalizeFirstLetter(otherUser.username).charAt(0)}
          </div>
          <div>
            <h3 className="font-medium">
              {capitalizeFirstLetter(otherUser.username)}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Active now
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div
                      className={`flex ${
                        i % 2 === 0 ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg max-w-xs w-32"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="mb-2">No messages yet</p>
                <p className="text-sm">
                  Start a conversation with{' '}
                  {capitalizeFirstLetter(otherUser.username)}!
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isCurrentUser = message.senderId === currentUser.id;
                const showTime =
                  index === 0 ||
                  new Date(message.createdAt).getTime() -
                    new Date(messages[index - 1].createdAt).getTime() >
                    5 * 60 * 1000; // 5 minutes

                return (
                  <div key={message.id} className="space-y-1">
                    {showTime && (
                      <div className="text-center">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex ${
                        isCurrentUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isCurrentUser
                            ? message.isOptimistic
                              ? 'bg-blue-400 text-white rounded-br-sm opacity-75'
                              : 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        {message.isOptimistic && (
                          <div className="flex items-center mt-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                            <span className="text-xs opacity-75">
                              Sending...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex space-x-2">
          <Input
            placeholder={`Message ${capitalizeFirstLetter(
              otherUser.username
            )}...`}
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
