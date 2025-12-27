import { useState, useEffect } from 'react';
import { appsApi } from '../services/api';
import { CategoryWithApps } from '../types';

export const useApps = () => {
  const [categories, setCategories] = useState<CategoryWithApps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await appsApi.getApps();
      setCategories(data.categories);
    } catch (err) {
      setError('Failed to load applications');
      console.error('Error fetching apps:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  return { categories, isLoading, error, refetch: fetchApps };
};
