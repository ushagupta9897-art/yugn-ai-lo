import React from 'react';
import Spinner from './Spinner';

const PageLoader: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="large" />
        <p className="mt-4 text-secondary-text-light dark:text-secondary-text-dark font-semibold">
          Loading...
        </p>
      </div>
    </div>
  );
};

export default PageLoader;