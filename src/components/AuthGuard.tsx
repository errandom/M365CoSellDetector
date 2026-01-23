import { useEffect, useState } from 'react'
import { authService } from '@/lib/authService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, Envelope, ChatCircle, VideoCamera, SignIn } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      try {
        await authService.initialize()
        const authenticated = authService.isAuthenticated()
        setIsAuthenticated(authenticated)
      } catch (err) {
        console.error('Auth initialization error:', err)
        setError('Failed to initialize authentication')
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await authService.login()
      setIsAuthenticated(true)
      toast.success('Successfully signed in', {
        description: 'You now have access to your M365 data'
      })
    } catch (err: any) {
      console.error('Login error:', err)
      const errorMessage = err?.message || 'Failed to sign in. Please check your Azure AD configuration.'
      setError(errorMessage)
      toast.error('Authentication failed', {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
              <ShieldCheck size={32} className="text-primary" weight="duotone" />
            </div>
            <CardTitle className="text-2xl">Sign in to Continue</CardTitle>
            <CardDescription>
              Connect your Microsoft 365 account to access co-sell intelligence from your communications
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">This app will access:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Envelope size={20} className="text-primary" weight="duotone" />
                  <span>Your Outlook emails</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <ChatCircle size={20} className="text-primary" weight="duotone" />
                  <span>Your Teams chat messages</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <VideoCamera size={20} className="text-primary" weight="duotone" />
                  <span>Your meeting transcripts</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Make sure your Azure AD app is properly configured with the required permissions.
                </p>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ All permissions are read-only</p>
              <p>✓ No data is stored on external servers</p>
              <p>✓ Processing happens locally in your browser</p>
            </div>
          </CardContent>

          <CardFooter>
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleLogin}
              disabled={isLoading}
            >
              <SignIn size={20} weight="duotone" />
              Sign in with Microsoft
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
