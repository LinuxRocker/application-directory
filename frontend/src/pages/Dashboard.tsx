import React, { useState, useMemo } from 'react';
import { Layout } from '../components/layout/Layout';
import { CategorySection } from '../components/apps/CategorySection';
import { SearchBar } from '../components/apps/SearchBar';
import { useApps } from '../hooks/useApps';

export const Dashboard: React.FC = () => {
  const { categories, isLoading, error } = useApps();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }

    const query = searchQuery.toLowerCase();
    return categories
      .map((categoryWithApps) => ({
        ...categoryWithApps,
        apps: categoryWithApps.apps.filter(
          (app) =>
            app.name.toLowerCase().includes(query) ||
            app.description.toLowerCase().includes(query)
        ),
      }))
      .filter((categoryWithApps) => categoryWithApps.apps.length > 0);
  }, [categories, searchQuery]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your applications...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">{error}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Please try refreshing the page
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Applications
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Access your homelab services and resources
          </p>
        </div>

        <SearchBar onSearch={setSearchQuery} />

        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No applications found
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery
                ? 'Try a different search term'
                : 'You don\'t have access to any applications yet'}
            </p>
          </div>
        ) : (
          <div>
            {filteredCategories.map((categoryWithApps) => (
              <CategorySection
                key={categoryWithApps.category.id}
                categoryWithApps={categoryWithApps}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
