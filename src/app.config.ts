
import { ComponentRegistry } from './app.components';
import { iconRegistry } from './app.icons';
import { messagesRegistry } from './app.messages';
import { reportRegistry } from './app.reports';
import { notificationPositionEnum, type NotificationPosition } from './components/notification-panel/notification-panel.component';
import { i18nService } from './i18n';

const notificationPosition: NotificationPosition = notificationPositionEnum.TopRight;

export const APP_CONFIG = {
  i18n : i18nService,
  ...messagesRegistry,
  ...iconRegistry,
  ...ComponentRegistry,
  ...reportRegistry,
  notificationPosition,
};