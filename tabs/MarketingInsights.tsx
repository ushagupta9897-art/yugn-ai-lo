import React from 'react';
import { LightbulbIcon } from '../components/icons/LightbulbIcon';

const MarketingInsights: React.FC = () => {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/20">
            <LightbulbIcon className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold font-heading">Marketing Insights</h3>
          <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2 max-w-md">
            This section is under construction. It will soon provide deep dives into market trends, competitive intelligence, and performance benchmarks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketingInsights;
