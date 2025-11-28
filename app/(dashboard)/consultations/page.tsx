'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { getUserConsultations } from '@/lib/firestore/consultations';
import { formatDistanceToNow } from 'date-fns';
import type { Consultation } from '@/types/consultation';

/**
 * Consultations List Page
 *
 * Displays all user consultations (active + closed) with ability to:
 * - View consultation history
 * - Click to open individual consultation
 * - Start new consultation (if credits available)
 * - Filter by status (active/closed)
 *
 * Reference: PRD FR-CHAT-015
 */
export default function ConsultationsPage() {
  const { user } = useAuthStore();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');

  useEffect(() => {
    const fetchConsultations = async () => {
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userConsultations = await getUserConsultations(user.uid);
        setConsultations(userConsultations);
      } catch (err) {
        console.error('Error fetching consultations:', err);
        setError('Failed to load consultations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, [user]);

  const filteredConsultations = consultations.filter(consultation => {
    if (filter === 'all') return true;
    if (filter === 'active') return consultation.status === 'active';
    if (filter === 'closed') return consultation.status === 'closed';
    return true;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending_scheduling':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'closed':
        return 'Closed';
      case 'pending_scheduling':
        return 'Pending Scheduling';
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading consultations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Consultations</h1>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Start New Consultation
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 border-b-2 font-medium transition-colors ${
            filter === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({consultations.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 border-b-2 font-medium transition-colors ${
            filter === 'active'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Active ({consultations.filter(c => c.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('closed')}
          className={`px-4 py-2 border-b-2 font-medium transition-colors ${
            filter === 'closed'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Closed ({consultations.filter(c => c.status === 'closed').length})
        </button>
      </div>

      {/* Consultations List */}
      {filteredConsultations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No consultations found.</p>
          {filter === 'all' && (
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Start Your First Consultation
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConsultations.map(consultation => (
            <Link
              key={consultation.id}
              href={`/consultations/${consultation.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {consultation.threadTitle}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {consultation.consultationType === 'chat'
                      ? 'Chat Consultation'
                      : consultation.consultationType === 'audio'
                        ? 'Audio Session'
                        : 'Video Session'}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(
                    consultation.status
                  )}`}
                >
                  {getStatusLabel(consultation.status)}
                </span>
              </div>

              <div className="flex items-center text-sm text-gray-500 mt-4">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Last activity:{' '}
                {formatDistanceToNow(consultation.lastActivityAt.toDate(), {
                  addSuffix: true,
                })}
              </div>

              {consultation.status === 'closed' && consultation.closedAt && (
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Closed:{' '}
                  {formatDistanceToNow(consultation.closedAt.toDate(), {
                    addSuffix: true,
                  })}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
