export type ApiResult = 'Ok' | 'Error';
export type ActionType =
  | 'error'
  | 'alert'
  | 'navigate'
  | 'focus'
  | 'publish'
  | 'success'
  | 'reload'
  | 'info'
  | 'log'
  | null;

export interface ServerAction {
  type: ActionType;
  payload: unknown | null;
}

export interface ApiResponse<T> {
  result: ApiResult;
  response: T;
  actions: ServerAction[] | null;
}