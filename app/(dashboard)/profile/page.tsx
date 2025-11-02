/**
 * Profile page - User profile display and editing
 * Reference: TDD section 7.1 "Frontend Architecture" (lines 5211-5360)
 *
 * Features:
 * - Display user profile data
 * - Edit birth details
 * - Show persona image with fallback
 * - Admin: Upload persona image
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getUserProfile, updateUserProfile } from '@/lib/api/users';
import { PersonaImage } from '@/components/profile/PersonaImage';
import { BirthDetailsForm } from '@/components/profile/BirthDetailsForm';
import { PersonaImageUpload } from '@/components/admin/PersonaImageUpload';
import type { User, BirthDetails } from '@/types/user';

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch user profile on mount
  useEffect(() => {
    async function fetchProfile() {
      if (!authUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        const userProfile = await getUserProfile(authUser.uid);
        if (userProfile) {
          setProfile(userProfile);
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [authUser]);

  const handleBirthDetailsSubmit = async (data: BirthDetails) => {
    if (!profile) return;

    try {
      setError(null);
      await updateUserProfile(profile.uid, data);

      // Update local state
      setProfile({
        ...profile,
        ...data,
        updatedAt: new Date(),
      });

      setIsEditing(false);
      setSuccessMessage('Birth details updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to update profile');
    }
  };

  const handlePersonaUploadComplete = (imageUrl: string, imagePath: string) => {
    if (!profile) return;

    setProfile({
      ...profile,
      personaImageUrl: imageUrl,
      personaImagePath: imagePath,
      personaUploadedAt: new Date(),
    });

    setSuccessMessage('Persona image uploaded successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handlePersonaUploadError = (errorMsg: string) => {
    setError(errorMsg);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!authUser || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No profile found</p>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Persona Image */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Persona Image</h2>
            <div className="flex justify-center mb-4">
              <PersonaImage imageUrl={profile.personaImageUrl} userName={profile.name} size={200} />
            </div>
            {profile.personaUploadedAt && (
              <p className="text-xs text-gray-500 text-center">
                Updated: {profile.personaUploadedAt.toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Admin: Upload Persona Image */}
          {isAdmin && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Persona Image</h2>
              <PersonaImageUpload
                userId={profile.uid}
                currentImagePath={profile.personaImagePath}
                onUploadComplete={handlePersonaUploadComplete}
                onError={handlePersonaUploadError}
              />
            </div>
          )}
        </div>

        {/* Right Column - Profile Details */}
        <div className="md:col-span-2">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="text-base text-gray-900">{profile.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-base text-gray-900">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="text-base text-gray-900 capitalize">{profile.role}</dd>
              </div>
            </dl>
          </div>

          {/* Birth Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Birth Details</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <BirthDetailsForm
                initialData={{
                  dateOfBirth: profile.dateOfBirth,
                  timeOfBirth: profile.timeOfBirth,
                  placeOfBirth: profile.placeOfBirth,
                }}
                onSubmit={handleBirthDetailsSubmit}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="text-base text-gray-900">
                    {profile.dateOfBirth.toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Time of Birth</dt>
                  <dd className="text-base text-gray-900">{profile.timeOfBirth}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Place of Birth</dt>
                  <dd className="text-base text-gray-900">{profile.placeOfBirth}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
