export interface MockUser {
  id: string
  name: string
  email: string
  role: string
  department: string
  avatar: string
  description: string
  accessLevel: 'basic' | 'premium' | 'admin'
  communicationVolume: 'low' | 'medium' | 'high'
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@contoso.com',
    role: 'Account Executive',
    department: 'Sales',
    avatar: '👩‍💼',
    description: 'Heavy partner collaboration, manages 15+ enterprise accounts',
    accessLevel: 'premium',
    communicationVolume: 'high'
  },
  {
    id: 'user-2',
    name: 'Marcus Johnson',
    email: 'marcus.johnson@contoso.com',
    role: 'Sales Manager',
    department: 'Sales',
    avatar: '👨‍💼',
    description: 'Oversees multiple teams, strategic partner relationships',
    accessLevel: 'admin',
    communicationVolume: 'medium'
  },
  {
    id: 'user-3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@contoso.com',
    role: 'Partner Manager',
    department: 'Partnerships',
    avatar: '👩‍🔧',
    description: 'Dedicated partner coordination, co-sell specialist',
    accessLevel: 'premium',
    communicationVolume: 'high'
  },
  {
    id: 'user-4',
    name: 'David Kim',
    email: 'david.kim@contoso.com',
    role: 'Junior Sales Rep',
    department: 'Sales',
    avatar: '👨‍💻',
    description: 'New to co-selling, learning partner processes',
    accessLevel: 'basic',
    communicationVolume: 'low'
  },
  {
    id: 'user-5',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@contoso.com',
    role: 'Solution Architect',
    department: 'Technical',
    avatar: '👩‍🔬',
    description: 'Technical pre-sales, partner solution integration',
    accessLevel: 'premium',
    communicationVolume: 'medium'
  },
  {
    id: 'user-6',
    name: 'James Wilson',
    email: 'james.wilson@contoso.com',
    role: 'VP of Sales',
    department: 'Leadership',
    avatar: '👔',
    description: 'Executive oversight, strategic partner deals only',
    accessLevel: 'admin',
    communicationVolume: 'low'
  }
]

export const getDefaultUser = (): MockUser => MOCK_USERS[0]

export const getUserById = (id: string): MockUser | undefined => {
  return MOCK_USERS.find(user => user.id === id)
}
