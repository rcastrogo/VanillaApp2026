export const literals = {
  noYes: ['ui.actions.no', 'ui.actions.yes'],
  cancelYes: ['ui.actions.cancel', 'ui.actions.yes'],
} as const;

export type AlertSize =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'fullscreen'
  | 'none'
  | 'image';

export interface AlertComponentRef {
  close: () => void;
  canClose: () => boolean;
  getContainer: () => HTMLElement | null;
  setFeedback: (text: string) => void;
}

export type afterOpenCallback = ((data: AlertComponentRef) => void) | null;

export interface AlertRef {
  afterOpen: (callback: (sender: AlertComponentRef) => void) => void;
  instance?: AlertComponentRef;
}

export interface confirmParams {
  element: HTMLElement;
  setFeedback: (text: string) => void;
  data: AlertComponentRef;
}

export interface AlertOptions {
  title?: string;
  subTitle?: string;
  message?: string;
  asHtml?: boolean;
  onAfterOpen?: afterOpenCallback;
  context?: unknown;
  icon?: string;
  showFooter?: boolean;
  showConfirmButton?: boolean;
  autoCloseMs?: number;
  onConfirm?: (sender: AlertComponentRef) => boolean | void;
  onCancel?: () => void;
  onClose?: () => void;
  literals?: readonly string[];
  disableClose?: boolean;
  size?: AlertSize;
}
