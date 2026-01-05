import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, CaretDown, UserSwitch, TrendUp, ChartBar } from '@phosphor-icons/react'
import type { MockUser } from '@/lib/mockUsers'

interface UserProfileBadgeProps {
  user: MockUser
  onChangeUser: () => void
}

export function UserProfileBadge({ user, onChangeUser }: UserProfileBadgeProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span className="text-lg">{user.avatar}</span>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium leading-none">{user.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{user.role}</div>
          </div>
          <CaretDown size={14} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Test User Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{user.avatar}</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {user.department}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {user.accessLevel}
              </Badge>
              {user.territory && (
                <Badge variant="outline" className="text-xs">
                  {user.territory}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className="flex items-center gap-1.5">
                <TrendUp size={12} className="text-muted-foreground" />
                <span className="text-muted-foreground">{user.opportunityProfile.opportunitiesPerMonth}/mo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ChartBar size={12} className="text-muted-foreground" />
                <span className="text-muted-foreground">{user.opportunityProfile.conversionRate}% rate</span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground italic">
              {user.yearsExperience}yr experience • {user.communicationVolume} volume
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onChangeUser} className="cursor-pointer">
          <UserSwitch size={16} className="mr-2" />
          Switch User Profile
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
