export type NotificationType = 'info' | 'error' | 'success' | 'warning' | '';

export type NotificationPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

export const notificationPositionEnum = {
  TopRight: 'top-right',
  TopLeft: 'top-left',
  TopCenter: 'top-center',
  BottomRight: 'bottom-right',
  BottomLeft: 'bottom-left',
  BottomCenter: 'bottom-center',
} as const;
