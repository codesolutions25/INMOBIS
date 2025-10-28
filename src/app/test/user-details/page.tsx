'use client';

import React from 'react';
import { TestUserDetails } from '@/components/test/TestUserDetails';

export default function UserDetailsTestPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">User Details Test</h1>
      <TestUserDetails />
    </div>
  );
}
