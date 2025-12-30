import React from 'react';
import { Application } from '../../types';

interface AppCardProps {
  app: Application;
}

export const AppCard: React.FC<AppCardProps> = ({ app }) => {
  const handleClick = () => {
    window.open(app.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-left w-full"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center text-2xl text-primary-600 dark:text-primary-300">
            <i className={`fa-solid ${app.icon}`}></i>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {app.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {app.description}
          </p>
        </div>
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </div>
      </div>
    </button>
  );
};
