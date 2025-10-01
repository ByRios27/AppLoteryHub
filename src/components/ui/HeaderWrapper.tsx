'use client';

import { ReactNode } from 'react';

interface HeaderWrapperProps {
  children: ReactNode;
  title: string;
}

export default function HeaderWrapper({ children, title }: HeaderWrapperProps) {
  return (
    <div className="w-full flex flex-col justify-center items-center py-4 px-2 bg-white dark:bg-gray-900 shadow-md">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="max-w-4xl w-full flex justify-center items-center">
        {children}
      </div>
    </div>
  );
}
