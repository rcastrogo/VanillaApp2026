
import { ComponentRegistry } from './app.components';
import { iconRegistry } from './app.icons';
import { reportRegistry } from './app.reports';
import { i18nService } from './i18n';

export const APP_CONFIG = {
  i18n : i18nService,
  ...iconRegistry,
  ...ComponentRegistry,
  ...reportRegistry,
};