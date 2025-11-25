'use client';

import { useEffect } from 'react';

export default function Home() {
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const targetPath = '/admin';
        
        // 1. Check if we are already at the target path to prevent unnecessary redirection loops
        // and to avoid the React Child Error if the component mounts after navigation is already done.
        if (window.location.pathname !== targetPath && window.location.pathname !== `${targetPath}/`) {

            // 2. FIX: Prepend window.location.origin to create a fully qualified URL
            // This resolves the SyntaxError: Location.replace: '/admin' is not a valid URL.
            const fullUrl = window.location.origin + targetPath;
            
            // Use client-side redirection to move from the root page to the admin dashboard.
            window.location.replace(fullUrl);
        }
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-xl shadow-lg">
        <p className="text-xl font-semibold text-indigo-600 animate-pulse">
          Redirecting to Admin Dashboard...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Please wait while the page loads.
        </p>
      </div>
    </div>
  );
}