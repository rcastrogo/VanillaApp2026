const messages = {
  Router: {
    ViewChanged: 'router-view-changed',
    Loading:     'router-loading',
    Loaded:      'router-loaded',
    Error:       'router-:error',
    Navigate:    'router-navigate-to',
  },
  Auth: {
    Login:       'auth-login',
    Logout:      'auth-logout'
  },
  HttpClient: {
    Loading:     'http-request:loading',
    Loaded:      'http-request:loaded',  
  },
  App : {
    ThemeChanged: 'app-theme-changed',
    message:      'app-message'
  }
} as const;

export const messagesRegistry = {
  messages
};