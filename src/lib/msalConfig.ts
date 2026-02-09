import { Configuration, LogLevel } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'YOUR_CLIENT_ID',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        switch (level) {
          case LogLevel.Error:
            console.error(message)
            return
          case LogLevel.Info:
            console.info(message)
            return
          case LogLevel.Verbose:
            console.debug(message)
            return
          case LogLevel.Warning:
            console.warn(message)
            return
        }
      },
    },
  },
}

export const loginRequest = {
  scopes: [
    'User.Read',
    'Mail.Read',
  ],
}

// Scope for Azure SQL / Fabric SQL database access
export const sqlDatabaseRequest = {
  scopes: ['https://database.windows.net/.default'],
}

// Additional scopes that require admin consent (enable when granted):
// 'Chat.Read' - Read Teams chat messages
// 'OnlineMeetings.Read' - Read meeting information
// 'CallRecords.Read' - Read call records

export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
}
