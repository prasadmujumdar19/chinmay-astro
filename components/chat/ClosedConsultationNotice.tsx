'use client';

/**
 * ClosedConsultationNotice Component
 *
 * Displays an info banner when consultation is closed, explaining follow-up behavior
 *
 * Reference: TDD section 11.4.1 "Closed Consultation Notice" (lines 10660-10710)
 * Reference: PRD FR-CHAT-010
 */
export function ClosedConsultationNotice() {
  return (
    <div
      className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg"
      role="status"
      aria-describedby="closed-notice-description"
      data-testid="closed-notice"
      data-icon="info"
    >
      <div className="flex items-start gap-3">
        {/* Info icon */}
        <svg
          className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
          data-icon="info"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>

        <div id="closed-notice-description">
          <h3 className="text-sm font-semibold text-yellow-900 mb-1">Consultation Closed</h3>
          <p className="text-sm text-yellow-800">
            This consultation has been closed by the astrologer. You can still add follow-up
            messages if you have additional questions. Your astrologer will review and respond to
            your follow-up.
          </p>
        </div>
      </div>
    </div>
  );
}
