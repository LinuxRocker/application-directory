import { configService } from './config.service';
import { Application, CategoryWithApps } from '../types';
import logger from '../utils/logger';

export class AppsService {
  /**
   * Get all apps accessible to a user based on their groups
   * - If app has NO groups: accessible to everyone (public)
   * - If app has groups: user must be in one of those groups
   * - If user is admin of category: sees ALL apps in that category
   */
  getAppsForUser(userGroups: string[]): CategoryWithApps[] {
    logger.debug('Filtering apps for user', {
      groupsCount: userGroups.length,
    });

    const allCategories = configService.getAllCategoriesWithApps();
    const categories = configService.getCategories();

    const result: CategoryWithApps[] = [];

    for (const category of categories) {
      const categoryData = allCategories[category.id];
      if (!categoryData || !categoryData.apps || categoryData.apps.length === 0) {
        continue;
      }

      const isAdminOfCategory = this.isUserAdminOfCategory(
        categoryData.adminGroups,
        userGroups
      );

      if (isAdminOfCategory) {
        logger.debug('User is admin of category, showing all apps', {
          category: category.id,
          appsCount: categoryData.apps.length,
        });
        result.push({
          category,
          apps: categoryData.apps,
        });
      } else {
        const accessibleApps = categoryData.apps.filter((app) =>
          this.hasAccessToApp(app, userGroups)
        );

        if (accessibleApps.length > 0) {
          logger.debug('User has access to some apps in category', {
            category: category.id,
            appsCount: accessibleApps.length,
          });
          result.push({
            category,
            apps: accessibleApps,
          });
        }
      }
    }

    logger.info('Filtered apps for user', {
      categoriesCount: result.length,
      totalApps: result.reduce((sum, cat) => sum + cat.apps.length, 0),
    });

    return result;
  }

  /**
   * Check if user is admin of the given category
   */
  private isUserAdminOfCategory(
    adminGroups: string[] | undefined,
    userGroups: string[]
  ): boolean {
    if (!adminGroups || adminGroups.length === 0) {
      return false;
    }
    return adminGroups.some((adminGroup) => userGroups.includes(adminGroup));
  }

  /**
   * Check if user has access to a specific app
   * - If app has NO groups: accessible to everyone (public)
   * - If app has groups: user must be in one of those groups
   */
  private hasAccessToApp(app: Application, userGroups: string[]): boolean {
    // No groups specified = public app, accessible to all authenticated users
    if (!app.groups || app.groups.length === 0) {
      return true;
    }

    // Has groups = check if user is in any of them
    return app.groups.some((group) => userGroups.includes(group));
  }

  /**
   * Search apps by name or description
   */
  searchApps(query: string, userGroups: string[]): Application[] {
    const categoriesWithApps = this.getAppsForUser(userGroups);
    const allApps = categoriesWithApps.flatMap((cat) => cat.apps);

    const lowerQuery = query.toLowerCase();

    return allApps.filter(
      (app) =>
        app.name.toLowerCase().includes(lowerQuery) ||
        app.description.toLowerCase().includes(lowerQuery)
    );
  }
}

export const appsService = new AppsService();
