'use client';

import type { Message } from '@/types/consultation';
import { formatMessageTimestamp } from '@/lib/utils/chatUtils';

interface MessageBubbleProps {
  message: Message;
  currentUserRole?: 'user' | 'admin';
}

/**
 * MessageBubble Component
 *
 * Displays a single message with sender info, timestamp, and read status
 *
 * Reference: TDD section 11.2.3 "MessageBubble Component" (lines 10380-10460)
 * Reference: PRD FR-CHAT-006
 */
export function MessageBubble({ message, currentUserRole }: MessageBubbleProps) {
  const isUserMessage = message.senderRole === 'user';
  const messageDate = message.timestamp.toDate();

  // Determine read status
  const isRead = currentUserRole === 'admin' ? message.readByAdmin : message.readByUser;

  return (
    <article
      className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}
      aria-label={`Message from ${message.senderName}`}
      data-role={message.senderRole}
    >
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3 ${
          isUserMessage
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-900 border border-gray-200'
        }`}
        data-testid="message-bubble"
      >
        {/* Sender name with role badge */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`font-semibold text-sm ${isUserMessage ? 'text-white' : 'text-gray-900'}`}
            aria-label={`Message from ${message.senderRole} ${message.senderName}`}
          >
            {message.senderName}
          </span>
          {message.senderRole === 'admin' && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">
              Admin
            </span>
          )}
        </div>

        {/* Message text */}
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>

        {/* Closing message badge */}
        {message.isClosingMessage && (
          <div className="mt-2 pt-2 border-t border-yellow-300">
            <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded badge-warning">
              Consultation Closed
            </span>
          </div>
        )}

        {/* Reopening message badge */}
        {message.isReopeningMessage && (
          <div className="mt-2 pt-2 border-t border-green-300">
            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
              Consultation Reopened
            </span>
          </div>
        )}

        {/* Timestamp and read status */}
        <div className="flex items-center justify-between mt-2 gap-2">
          <time
            className={`text-xs ${isUserMessage ? 'text-primary-100' : 'text-gray-500'}`}
            dateTime={messageDate.toISOString()}
            role="time"
          >
            {formatMessageTimestamp(messageDate)}
          </time>

          {/* Read status indicator (only shown to message sender) */}
          {currentUserRole && (
            <span
              className={`text-xs ${isUserMessage ? 'text-primary-100' : 'text-gray-500'}`}
              aria-label={isRead ? 'Read' : 'Sent'}
            >
              {isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
