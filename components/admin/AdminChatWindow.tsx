'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseApp } from '@/lib/firebase/config';
import { useMessages } from '@/hooks/useMessages';
import { updateConsultationStatus } from '@/lib/firestore/consultations';
import { MessageBubble } from '@/components/chat/MessageBubble';
import type { CloseConsultationRequest } from '@/types/consultation';

interface AdminChatWindowProps {
  consultationId: string;
}

/**
 * AdminChatWindow Component
 *
 * Admin-specific chat interface with Send and Send & Close buttons
 *
 * Reference: TDD section 11.3.1 "AdminChatWindow Component" (lines 10500-10659)
 * Reference: PRD FR-CHAT-009
 */
export function AdminChatWindow({ consultationId }: AdminChatWindowProps) {
  const { messages, consultation, loading, error, sendMessage, markMessagesAsRead } =
    useMessages(consultationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const MAX_LENGTH = 2000;

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

  // Count unread messages from users
  const unreadCount = messages.filter(msg => !msg.readByAdmin && msg.senderRole === 'user').length;

  // Handle send message
  const handleSend = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setIsSending(true);
    setErrorMessage(null);
    try {
      await sendMessage(trimmedMessage);
      setMessage('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [message, sendMessage]);

  // Handle send and close
  const handleSendAndClose = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setErrorMessage('Closing message is required');
      return;
    }

    setShowCloseConfirm(true);
  }, [message]);

  // Confirm close consultation
  const confirmClose = useCallback(async () => {
    setShowCloseConfirm(false);
    setIsClosing(true);
    setErrorMessage(null);

    try {
      const functions = getFunctions(firebaseApp);
      const closeConsultationFn = httpsCallable<CloseConsultationRequest, { success: boolean }>(
        functions,
        'closeConsultation'
      );

      await closeConsultationFn({
        consultationId,
        closingMessage: message.trim(),
      });

      setMessage('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to close consultation');
    } finally {
      setIsClosing(false);
    }
  }, [consultationId, message]);

  // Handle reopen consultation
  const handleReopen = useCallback(async () => {
    try {
      await updateConsultationStatus(consultationId, 'active');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to reopen consultation');
    }
  }, [consultationId]);

  // Check if there are follow-up messages after closure
  const hasFollowUpMessages =
    consultation?.status === 'closed' &&
    messages.some(
      msg =>
        msg.senderRole === 'user' &&
        consultation.closedAt &&
        msg.timestamp.toMillis() > consultation.closedAt.toMillis()
    );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
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
      <div className="flex items-center justify-center h-96">
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
  const isDisabled = isClosed || isSending || isClosing;

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

        <div className="flex items-center gap-3">
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
              {unreadCount} unread
            </span>
          )}

          {/* Status badge */}
          {isClosed && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
              Consultation Closed
            </span>
          )}
        </div>
      </div>

      {/* Reopen button (shown when closed with follow-ups) */}
      {isClosed && hasFollowUpMessages && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">User has added follow-up messages</p>
            <button
              onClick={handleReopen}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Reopen
            </button>
          </div>
        </div>
      )}

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No messages yet</p>
            <p className="text-sm text-gray-400">Waiting for user to start conversation</p>
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble key={message.id} message={message} currentUserRole="admin" />
          ))
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      {/* Message input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-2">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, MAX_LENGTH))}
            disabled={isDisabled}
            placeholder="Type your response..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={3}
          />

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {message.length} / {MAX_LENGTH}
            </span>

            <div className="flex gap-2">
              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={isDisabled || message.trim().length === 0}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>

              {/* Send & Close button */}
              <button
                onClick={handleSendAndClose}
                disabled={isDisabled || message.trim().length === 0}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isClosing ? 'Closing...' : 'Send & Close'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Close Consultation?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to close this consultation? The user will still be able to add
              follow-up messages.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmClose}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
