
import { ComponentRegistry } from './app.config.components';
import { iconRegistry } from './app.config.icons';
import { reportRegistry } from './app.config.reports';
import { i18nService } from './i18n';

export const APP_CONFIG = {
  i18n : i18nService,
  ...iconRegistry,
  ...ComponentRegistry,
  ...reportRegistry,
};