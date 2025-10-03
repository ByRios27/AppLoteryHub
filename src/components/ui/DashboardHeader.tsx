
import React from 'react';

interface DashboardHeaderProps {
  title: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title }) => {
  return (
    <h1 className="text-2xl md:text-3xl font-bold font-headline">{title}</h1>
  );
};

export default DashboardHeader;
