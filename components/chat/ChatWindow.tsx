'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ClosedConsultationNotice } from './ClosedConsultationNotice';
import { useAuthStore } from '@/stores/authStore';

interface ChatWindowProps {
  consultationId: string;
}

/**
 * ChatWindow Component
 *
 * Main chat interface with auto-scroll, message display, and input
 *
 * Reference: TDD section 11.2.1 "ChatWindow Component" (lines 10190-10279)
 * Reference: PRD FR-CHAT-006, FR-CHAT-010
 */
export function ChatWindow({ consultationId }: ChatWindowProps) {
  const { messages, consultation, loading, error, sendMessage, markMessagesAsRead } =
    useMessages(consultationId);
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when component mounts or new messages arrive
  useEffect(() => {
    if (!loading && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages, loading, markMessagesAsRead]);

  // Handle sending message
  const handleSendMessage = useCallback(
    async (text: string) => {
      setIsSending(true);
      try {
        await sendMessage(text);
      } catch (err) {
        // Error already logged in hook
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [sendMessage]
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading consultation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96" role="alert">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Error loading consultation</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return null;
  }

  const isClosed = consultation.status === 'closed';

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{consultation.threadTitle}</h2>
          <p className="text-sm text-gray-600">
            {consultation.userName} ({consultation.userEmail})
          </p>
        </div>

        {/* Status badge */}
        {isClosed && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
            Closed
          </span>
        )}
      </div>

      {/* Closed consultation notice */}
      {isClosed && (
        <div className="p-4">
          <ClosedConsultationNotice />
        </div>
      )}

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No messages yet</p>
            <p className="text-sm text-gray-400">Start the conversation by sending a message</p>
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble key={message.id} message={message} currentUserRole={user?.role} />
          ))
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <MessageInput onSend={handleSendMessage} disabled={isClosed} isLoading={isSending} />
    </div>
  );
}
