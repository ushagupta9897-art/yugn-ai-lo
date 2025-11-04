import React from 'react';
import { BuildingOfficeIcon } from '../components/icons/BuildingOfficeIcon';

const ComingSoon: React.FC = () => {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center mb-6 shadow-2xl shadow-slate-500/20">
          <BuildingOfficeIcon className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-2xl font-bold font-heading">Feature Under Construction</h3>
        <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2 max-w-md">
          Our team is hard at work building this feature. Check back soon for exciting new capabilities to enhance your marketing workflow!
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
