'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import {
  MAX_MESSAGE_LENGTH,
  isApproachingCharacterLimit,
  truncateMessage,
} from '@/lib/utils/chatUtils';

interface MessageInputProps {
  onSend: (message: string) => void | Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * MessageInput Component
 *
 * Textarea with character count, send button, and keyboard shortcuts
 *
 * Reference: TDD section 11.2.2 "MessageInput Component" (lines 10280-10379)
 * Reference: PRD FR-CHAT-006
 */
export function MessageInput({ onSend, disabled = false, isLoading = false }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = useCallback(async () => {
    const trimmedMessage = message.trim();

    // Don't send if empty or only whitespace
    if (!trimmedMessage) {
      return;
    }

    try {
      await onSend(trimmedMessage);
      setMessage(''); // Clear after successful send
    } catch (error) {
      // Error handling done by parent component
      console.error('Failed to send message:', error);
    }
  }, [message, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = (value: string) => {
    // Enforce max length using utility
    setMessage(truncateMessage(value));
  };

  const characterCount = message.length;
  const isNearLimit = isApproachingCharacterLimit(characterCount);
  const isSendDisabled = disabled || isLoading || message.trim().length === 0;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Textarea */}
      <div className="flex flex-col gap-2">
        <textarea
          value={message}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder="Type your message..."
          aria-label="Message input"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={3}
        />

        {/* Character count and send button */}
        <div className="flex items-center justify-between">
          <span
            className={`text-sm ${isNearLimit ? 'text-warning text-yellow-600' : 'text-gray-500'}`}
            aria-live="polite"
          >
            {characterCount} / {MAX_MESSAGE_LENGTH}
          </span>

          <button
            onClick={handleSend}
            disabled={isSendDisabled}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span
                  className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  role="status"
                  aria-label="Sending"
                />
                Sending...
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>

        {/* Keyboard shortcut hint */}
        <p className="text-xs text-gray-500">
          Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">Ctrl</kbd> +{' '}
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">Enter</kbd> to send
        </p>
      </div>
    </div>
  );
}
