export interface Application {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  groups?: string[];
  adminGroups?: string[];
  external?: boolean;
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

export interface UserInfo {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user: UserInfo | null;
}

export interface UserProfile {
  user: UserInfo;
  groups: string[];
}
