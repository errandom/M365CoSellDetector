import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CaretDown, SignOut, User as UserIcon } from '@phosphor-icons/react'
import { authService } from '@/lib/authService'
import { Client } from '@microsoft/microsoft-graph-client'
import { toast } from 'sonner'

interface GraphUserProfile {
  displayName: string
  mail: string
  userPrincipalName: string
  jobTitle?: string
  department?: string
  officeLocation?: string
}

interface RealUserProfileBadgeProps {
  onSignOut: () => void
}

export function RealUserProfileBadge({ onSignOut }: RealUserProfileBadgeProps) {
  const [userProfile, setUserProfile] = useState<GraphUserProfile | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await authService.getAccessToken()
        const client = Client.init({
          authProvider: (done) => {
            done(null, token)
          },
        })

        const profile = await client.api('/me').select('displayName,mail,userPrincipalName,jobTitle,department,officeLocation').get()
        setUserProfile(profile)

        try {
          const photoBlob = await client.api('/me/photo/$value').get()
          const url = URL.createObjectURL(photoBlob)
          setPhotoUrl(url)
        } catch (photoError) {
          console.warn('Failed to fetch user photo:', photoError)
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        toast.error('Failed to load user profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()

    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl)
      }
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await authService.logout()
      onSignOut()
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
        <span className="text-sm">Loading...</span>
      </Button>
    )
  }

  if (!userProfile) {
    return null
  }

  const initials = userProfile.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Avatar className="h-6 w-6">
            {photoUrl && <AvatarImage src={photoUrl} alt={userProfile.displayName} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium leading-none">{userProfile.displayName}</div>
            {userProfile.jobTitle && (
              <div className="text-xs text-muted-foreground mt-0.5">{userProfile.jobTitle}</div>
            )}
          </div>
          <CaretDown size={14} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Microsoft 365 Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-3 space-y-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {photoUrl && <AvatarImage src={photoUrl} alt={userProfile.displayName} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{userProfile.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{userProfile.mail || userProfile.userPrincipalName}</p>
            </div>
          </div>
          
          {(userProfile.jobTitle || userProfile.department || userProfile.officeLocation) && (
            <div className="pt-2 space-y-1 text-xs text-muted-foreground">
              {userProfile.jobTitle && <p>Title: {userProfile.jobTitle}</p>}
              {userProfile.department && <p>Department: {userProfile.department}</p>}
              {userProfile.officeLocation && <p>Location: {userProfile.officeLocation}</p>}
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <SignOut size={16} className="mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
