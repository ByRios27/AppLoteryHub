'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface HeaderWrapperProps {
  children: ReactNode;
  title: string;
}

export default function HeaderWrapper({ children, title }: HeaderWrapperProps) {
  return (
    <div className="relative w-full flex flex-col justify-center items-center py-4 px-2 bg-white dark:bg-gray-900 shadow-md">
      <Link href="/dashboard" className="absolute left-4 top-1/2 -translate-y-1/2">
        <ArrowLeft className="h-6 w-6" />
      </Link>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="max-w-4xl w-full flex justify-center items-center">
        {children}
      </div>
    </div>
  );
}
