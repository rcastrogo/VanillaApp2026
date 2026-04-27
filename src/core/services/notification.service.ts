
import { pubSub } from "./pubsub.service";

import { APP_CONFIG } from "@/app.config";
import type { NotificationType } from "@/components/notification-panel/notification-panel.model";


class NotificationService {

  show(message: string, autoCloseMs?: number, type: NotificationType = '') {
    pubSub.publish(APP_CONFIG.messages.app.showNotification, {
      message,
      autoCloseMs,
      type
    });
  }

  success(message: string, autoCloseMs = 4000) {
    this.show(message, autoCloseMs, 'success');
  }

  info(message: string, autoCloseMs = 4000) {
    this.show(message, autoCloseMs, 'info');
  }

  warning(message: string, autoCloseMs = 6000) {
    this.show(message, autoCloseMs, 'warning');
  }

  error(message: string, autoCloseMs = 8000) {
    this.show(message, autoCloseMs, 'error');
  }

  close(id: number) {
    pubSub.publish(APP_CONFIG.messages.app.closeNotification, id);
  }

}

export const notificationService = new NotificationService();