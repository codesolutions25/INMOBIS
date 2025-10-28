'use client';

import React from 'react';
import { useUserDetails } from '@/hooks/useUserDetails';

export function TestUserDetails() {
  const { userInfo, userDetails, loading, error } = useUserDetails();

  if (loading) {
    return <div>Loading user details...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        <h3 className="font-bold">Error loading user details</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">User Details</h2>
      
      {userInfo && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">User Info</h3>
          <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
            {JSON.stringify(userInfo, null, 2)}
          </pre>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-2">User Details</h3>
        {userDetails.length > 0 ? (
          <div className="space-y-4">
            {userDetails.map((detail, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <pre className="text-sm">
                  {JSON.stringify(detail, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No additional details found for this user.</p>
        )}
      </div>
    </div>
  );
}
