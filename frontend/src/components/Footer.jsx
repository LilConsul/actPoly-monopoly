import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-gray-100 py-4">
      <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
        &copy; {new Date().getFullYear()} Monopoly App. All rights reserved.
      </div>
    </footer>
  );
};
