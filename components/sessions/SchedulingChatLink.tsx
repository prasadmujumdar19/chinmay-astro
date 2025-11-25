/**
 * Scheduling chat link component - navigates to related scheduling chat
 * Feature 6 - Task 4.0.4
 */

'use client';

import { useRouter } from 'next/navigation';

interface SchedulingChatLinkProps {
  chatId: string;
  sessionType?: 'audio' | 'video';
  className?: string;
}

export function SchedulingChatLink({
  chatId,
  sessionType,
  className = '',
}: SchedulingChatLinkProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/dashboard/consultations/${chatId}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`text-blue-600 hover:text-blue-700 hover:underline font-medium ${className}`}
      data-testid={`scheduling-chat-link-${chatId}`}
    >
      {sessionType
        ? `View ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session Scheduling`
        : 'View Scheduling Chat'}
    </button>
  );
}
