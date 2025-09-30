'use client';

import { ReactNode } from 'react';

interface HeaderWrapperProps {
  children: ReactNode;
}

export default function HeaderWrapper({ children }: HeaderWrapperProps) {
  return (
    <div className="w-full flex justify-center items-center py-4 px-2 bg-white dark:bg-gray-900 shadow-md">
      <div className="max-w-4xl w-full flex justify-center items-center">
        {children}
      </div>
    </div>
  );
}
