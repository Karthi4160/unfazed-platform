import React from 'react';

const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
  const sizes = { sm: 'h-6 w-6', md: 'h-12 w-12', lg: 'h-16 w-16' };
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full ${sizes[size]} border-b-2 border-indigo-600`} />
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
