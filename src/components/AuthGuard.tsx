import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authService } from '@/lib/authService'
import { Sparkle, ShieldCheck, EnvelopeSimple, Chat, Video, SignIn } from '@phosphor-icons/react'
import { AccountInfo } from '@azure/msal-browser'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      await authService.initialize()
      const currentAccount = authService.getAccount()
      
      if (currentAccount) {
        setAccount(currentAccount)
        setIsAuthenticated(true)
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err)
      setError('Failed to initialize authentication')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await authService.login()
      setAccount(result.account)
      setIsAuthenticated(true)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      setAccount(null)
      setIsAuthenticated(false)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto p-3 bg-accent/10 rounded-xl w-fit">
              <Sparkle size={48} weight="duotone" className="text-accent" />
            </div>
            <div>
              <CardTitle className="text-2xl mb-2">M365 Co-Sell Intelligence</CardTitle>
              <CardDescription>
                Sign in with your Microsoft 365 account to detect co-sell opportunities
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <p className="text-sm font-medium">This app requires access to:</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <EnvelopeSimple size={16} className="text-primary" />
                  <span>Read your Outlook emails</span>
                </div>
                <div className="flex items-center gap-2">
                  <Chat size={16} className="text-primary" />
                  <span>Read your Teams chats</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video size={16} className="text-primary" />
                  <span>Read your meeting transcripts</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              <SignIn size={20} weight="bold" />
              Sign in with Microsoft
            </Button>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" />
              <p>
                Your data is processed securely and never stored. We only analyze communications
                to detect co-sell opportunities.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      {children}
      {account && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg flex items-center gap-3">
          <div className="text-sm">
            <p className="font-medium">{account.name}</p>
            <p className="text-xs text-muted-foreground">{account.username}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      )}
    </div>
  )
}
