import {
  PublicClientApplication,
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
  SilentRequest,
} from '@azure/msal-browser'
import { msalConfig, loginRequest } from './msalConfig'

export class AuthService {
  private msalInstance: PublicClientApplication

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig)
  }

  async initialize(): Promise<void> {
    await this.msalInstance.initialize()
    await this.msalInstance.handleRedirectPromise()
  }

  async login(): Promise<AuthenticationResult> {
    try {
      const response = await this.msalInstance.loginPopup(loginRequest)
      return response
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async logout(): Promise<void> {
    const account = this.getAccount()
    if (account) {
      await this.msalInstance.logoutPopup({
        account,
      })
    }
  }

  getAccount(): AccountInfo | null {
    const accounts = this.msalInstance.getAllAccounts()
    if (accounts.length === 0) {
      return null
    }
    return accounts[0]
  }

  async getAccessToken(scopes: string[] = loginRequest.scopes): Promise<string> {
    const account = this.getAccount()
    if (!account) {
      throw new Error('No active account')
    }

    const request: SilentRequest = {
      scopes,
      account,
    }

    try {
      const response = await this.msalInstance.acquireTokenSilent(request)
      return response.accessToken
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const response = await this.msalInstance.acquireTokenPopup(request)
        return response.accessToken
      }
      throw error
    }
  }

  isAuthenticated(): boolean {
    return this.getAccount() !== null
  }
}

export const authService = new AuthService()
