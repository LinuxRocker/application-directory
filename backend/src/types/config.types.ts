export interface Application {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  groups?: string[];
  external?: boolean;
}

export interface CategoryData {
  name: string;
  icon: string;
  order: number;
  description?: string;
  adminGroups?: string[];
  apps: Application[];
}

export interface AppConfig {
  categories: {
    [categoryId: string]: CategoryData;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
  description?: string;
}

export interface CategoryWithApps {
  category: Category;
  apps: Application[];
}
