import fs from 'fs';
import YAML from 'yaml';
import Joi from 'joi';
import chokidar from 'chokidar';
import { config } from '../config';
import { AppConfig, Category, CategoryData } from '../types';
import logger from '../utils/logger';

const configSchema = Joi.object({
  categories: Joi.object()
    .pattern(
      Joi.string(),
      Joi.object({
        name: Joi.string().required(),
        icon: Joi.string().required(),
        order: Joi.number().required(),
        description: Joi.string(),
        adminGroups: Joi.array().items(Joi.string()),
        apps: Joi.array()
          .items(
            Joi.object({
              id: Joi.string().required(),
              name: Joi.string().required(),
              description: Joi.string().required(),
              url: Joi.string().uri().required(),
              icon: Joi.string().required(),
              groups: Joi.array().items(Joi.string()),
              external: Joi.boolean(),
            })
          )
          .required(),
      })
    )
    .required(),
});

export class ConfigService {
  private appConfig: AppConfig | null = null;
  private watcher: chokidar.FSWatcher | null = null;

  async loadConfig(): Promise<void> {
    try {
      logger.info('Loading configuration from file', {
        path: config.app.configPath,
      });

      const fileContents = fs.readFileSync(config.app.configPath, 'utf8');
      const parsedConfig = YAML.parse(fileContents);

      const { error, value } = configSchema.validate(parsedConfig);

      if (error) {
        throw new Error(`Configuration validation failed: ${error.message}`);
      }

      this.appConfig = value as AppConfig;

      const categoryCount = Object.keys(this.appConfig.categories).length;
      const totalApps = Object.values(this.appConfig.categories).reduce(
        (sum, cat) => sum + cat.apps.length,
        0
      );

      logger.info('Configuration loaded successfully', {
        categoriesCount: categoryCount,
        totalApps,
      });

      if (config.app.configWatch && !this.watcher) {
        this.watchConfig();
      }
    } catch (error) {
      logger.error('Failed to load configuration', { error });
      throw error;
    }
  }

  private watchConfig(): void {
    logger.info('Starting config file watcher');

    this.watcher = chokidar.watch(config.app.configPath, {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on('change', async () => {
      logger.info('Config file changed, reloading...');
      try {
        await this.loadConfig();
      } catch (error) {
        logger.error('Failed to reload config after change', { error });
      }
    });

    this.watcher.on('error', (error) => {
      logger.error('Config file watcher error', { error });
    });
  }

  getConfig(): AppConfig {
    if (!this.appConfig) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.appConfig;
  }

  getCategories(): Category[] {
    const config = this.getConfig();
    return Object.entries(config.categories)
      .map(([id, data]) => ({
        id,
        name: data.name,
        icon: data.icon,
        order: data.order,
        description: data.description,
      }))
      .sort((a, b) => a.order - b.order);
  }

  getCategoryData(categoryId: string): CategoryData | undefined {
    return this.getConfig().categories[categoryId];
  }

  getAllCategoriesWithApps(): { [categoryId: string]: CategoryData } {
    return this.getConfig().categories;
  }

  async close(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      logger.info('Config file watcher closed');
    }
  }
}

export const configService = new ConfigService();
