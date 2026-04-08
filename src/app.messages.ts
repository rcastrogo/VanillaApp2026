const messages = {
  router: {
    viewChanged: 'router-view-changed',
    loading:     'router-loading',
    loaded:      'router-loaded',
    error:       'router-error',
    navigate:    'router-navigate-to',
  },
  auth: {
    login:       'auth-login',
    logout:      'auth-logout'
  },
  httpClient: {
    loading:     'http-request-loading',
    loaded:      'http-request-loaded',  
  },
  app : {
    themeChanged: 'app-theme-changed',
    message:      'app-message',
    dialogClosed: 'app-dialog-closed',
    showNotification: 'app-show-notification',
    closeNotification: 'app-close-notification'
  }
} as const;

export const messagesRegistry = {
  messages
};