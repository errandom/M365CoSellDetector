import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  CheckCircle, 
  Buildings, 
  Sparkle,
  ChartBar,
  EnvelopeSimple
} from '@phosphor-icons/react'
import { MOCK_USERS, type MockUser } from '@/lib/mockUsers'
import { cn } from '@/lib/utils'

interface UserProfileSelectorProps {
  selectedUser: MockUser
  onSelectUser: (user: MockUser) => void
  onClose: () => void
}

export function UserProfileSelector({ selectedUser, onSelectUser, onClose }: UserProfileSelectorProps) {
  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'admin':
        return 'bg-destructive text-destructive-foreground'
      case 'premium':
        return 'bg-accent text-accent-foreground'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  const getCommunicationVolumeIcon = (volume: string) => {
    switch (volume) {
      case 'high':
        return <ChartBar size={16} weight="fill" className="text-accent" />
      case 'medium':
        return <ChartBar size={16} weight="fill" className="text-muted-foreground" />
      default:
        return <ChartBar size={16} className="text-muted-foreground" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User size={28} weight="duotone" className="text-primary" />
              Test User Profile Selector
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select a user persona to simulate different co-sell scenarios
            </p>
          </div>
          <Button onClick={onClose} variant="outline">
            Continue as {selectedUser.name.split(' ')[0]}
          </Button>
        </div>

        <Separator className="mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_USERS.map(user => (
            <Card
              key={user.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]',
                selectedUser.id === user.id && 'ring-2 ring-primary shadow-lg'
              )}
              onClick={() => onSelectUser(user)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{user.avatar}</div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {user.name}
                        {selectedUser.id === user.id && (
                          <CheckCircle size={18} weight="fill" className="text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {user.role}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <EnvelopeSimple size={14} />
                  {user.email}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Buildings size={14} />
                  {user.department}
                </div>

                <p className="text-sm text-foreground leading-relaxed">
                  {user.description}
                </p>

                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <Badge className={getAccessLevelColor(user.accessLevel)}>
                    <Sparkle size={12} className="mr-1" />
                    {user.accessLevel.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getCommunicationVolumeIcon(user.communicationVolume)}
                    {user.communicationVolume} volume
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Testing Mode Active</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-2">
              This mock user selector bypasses Azure AD authentication for testing purposes. Each user profile will generate different mock data based on their role and communication volume.
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>High volume users</strong> will see more detected opportunities</li>
              <li><strong>Admin access</strong> users can view all team opportunities</li>
              <li><strong>Partner Managers</strong> see more partner-focused communications</li>
              <li><strong>Technical roles</strong> see solution architecture discussions</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
