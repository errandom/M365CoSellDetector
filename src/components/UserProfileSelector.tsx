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
  EnvelopeSimple,
  TrendUp,
  Clock,
  CurrencyDollar
} from '@phosphor-icons/react'
import { MOCK_USERS, type MockUser } from '@/lib/mockUsers'
import { getUserStatsSummary } from '@/lib/mockDataGenerator'
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

  const formatDealSize = (user: MockUser) => {
    const min = user.opportunityProfile.avgDealSize.min / 1000000
    const max = user.opportunityProfile.avgDealSize.max / 1000000
    return `$${min.toFixed(1)}M - $${max.toFixed(1)}M`
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User size={28} weight="duotone" className="text-primary" />
              Test User Profile Selector
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select a user persona to simulate different co-sell scenarios with role-specific data
            </p>
          </div>
          <Button onClick={onClose} variant="outline">
            Continue as {selectedUser.name.split(' ')[0]}
          </Button>
        </div>

        <Separator className="mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MOCK_USERS.map(user => (
            <Card
              key={user.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]',
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
                        {user.role} • {user.yearsExperience}yr exp
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
                  {user.department} {user.territory && `• ${user.territory}`}
                </div>

                <p className="text-sm text-foreground leading-relaxed">
                  {user.description}
                </p>

                <Separator className="my-2" />

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-foreground">Communication Profile</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <EnvelopeSimple size={12} className="text-muted-foreground" />
                      <span className="text-muted-foreground">{user.communicationPattern.avgMessagesPerDay} msgs/day</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-muted-foreground" />
                      <span className="text-muted-foreground">{user.communicationPattern.responseTimeHours}hr response</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Preferred: {user.communicationPattern.preferredChannels.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-foreground">Opportunity Profile</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <TrendUp size={12} className="text-muted-foreground" />
                      <span className="text-muted-foreground">{user.opportunityProfile.opportunitiesPerMonth}/mo</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle size={12} className="text-muted-foreground" />
                      <span className="text-muted-foreground">{user.opportunityProfile.conversionRate}% conversion</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <CurrencyDollar size={12} className="text-muted-foreground" />
                    <span className="text-muted-foreground">{formatDealSize(user)} avg deal</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.opportunityProfile.avgSalesCycle} days sales cycle
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <Badge className={getAccessLevelColor(user.accessLevel)}>
                    <Sparkle size={12} className="mr-1" />
                    {user.accessLevel.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getCommunicationVolumeIcon(user.communicationVolume)}
                    {user.communicationVolume}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">🧪 Role-Based Testing Mode</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              Each user persona generates realistic, role-specific communications and opportunities based on their profile. Switch between users to test different co-sell scenarios.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <strong className="text-foreground">Account Executives</strong>
                <p>High volume enterprise opportunities, formal communications, strategic partners</p>
              </div>
              <div>
                <strong className="text-foreground">Partner Managers</strong>
                <p>Maximum partner engagement, casual style, diverse solution areas</p>
              </div>
              <div>
                <strong className="text-foreground">Sales Managers</strong>
                <p>Strategic deals, executive-level discussions, high deal values</p>
              </div>
              <div>
                <strong className="text-foreground">Solution Architects</strong>
                <p>Technical deep-dives, detailed proposals, infrastructure focus</p>
              </div>
              <div>
                <strong className="text-foreground">Junior Reps</strong>
                <p>Learning mode, smaller deals, formal communications, SMB focus</p>
              </div>
              <div>
                <strong className="text-foreground">VP of Sales</strong>
                <p>Executive oversight, mega-deals, brief updates, strategic only</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
