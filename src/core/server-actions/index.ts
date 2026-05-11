import type { ServerAction } from "./model";

import { $ } from "@/core/dom";
import { notificationService } from "@/core/services/notification.service";
import { pubSub } from "@/core/services/pubsub.service";

export function executeServerAction(action: ServerAction) {
  const { type, payload } = action;
  const text = typeof payload === 'string' ? payload : null;

  if (type === 'alert') return text && alert(text);
  if (type === 'error') return text && notificationService.error(text);
  if (type === 'success') return text && notificationService.success(text);
  if (type === 'info') return text && notificationService.info(text);
  // if (type === 'navigate') return text && router.navigateTo(text);
  if (type === 'focus') return text && $(text).one()?.focus();
  // if (type === 'reload') return window.location.reload();
  if (type === 'log') return console.log('[ServerAction]', payload);

  if (type === 'publish') {
    if (text) return pubSub.publish(text);
    if (payload && typeof payload === 'object') {
      const { topic, data } = payload as { topic: string; data?: unknown };
      return pubSub.publish(topic, data);
    }
  }
}