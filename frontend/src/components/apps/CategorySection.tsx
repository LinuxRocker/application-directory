import React, { useState } from 'react';
import { CategoryWithApps } from '../../types';
import { AppCard } from './AppCard';

interface CategorySectionProps {
  categoryWithApps: CategoryWithApps;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  categoryWithApps,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { category, apps } = categoryWithApps;

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-4 group"
      >
        <div className="flex items-center space-x-3">
          <span className="text-3xl text-primary-600">
            <i className={`fa-solid ${category.icon}`}></i>
          </span>
          <div className="text-left">
            <h2 className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
              {category.name}
            </h2>
            {category.description && (
              <p className="text-sm text-gray-500">{category.description}</p>
            )}
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {apps.length}
          </span>
        </div>
        <svg
          className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <AppCard key={app.id || app.name} app={app} />
          ))}
        </div>
      )}
    </div>
  );
};
