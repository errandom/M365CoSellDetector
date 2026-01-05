import type { CommunicationType, IndustryVertical, SolutionArea } from './types'

export interface CommunicationPattern {
  preferredChannels: CommunicationType[]
  avgMessagesPerDay: number
  responseTimeHours: number
  meetingFrequency: 'rare' | 'occasional' | 'frequent' | 'daily'
  emailStyle: 'brief' | 'detailed' | 'formal' | 'casual'
}

export interface OpportunityProfile {
  avgDealSize: { min: number; max: number }
  primaryIndustries: IndustryVertical[]
  primarySolutions: SolutionArea[]
  partnerTypes: string[]
  opportunitiesPerMonth: number
  conversionRate: number
  avgSalesCycle: number
}

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
  communicationPattern: CommunicationPattern
  opportunityProfile: OpportunityProfile
  yearsExperience: number
  territory?: string
  specialization?: string
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
    communicationVolume: 'high',
    yearsExperience: 8,
    territory: 'West Coast',
    specialization: 'Enterprise Sales',
    communicationPattern: {
      preferredChannels: ['email', 'chat', 'meeting'],
      avgMessagesPerDay: 45,
      responseTimeHours: 2,
      meetingFrequency: 'frequent',
      emailStyle: 'detailed'
    },
    opportunityProfile: {
      avgDealSize: { min: 500000, max: 5000000 },
      primaryIndustries: ['financial-services', 'healthcare', 'retail'],
      primarySolutions: ['azure-migration', 'modern-workplace', 'security'],
      partnerTypes: ['Accenture', 'Deloitte Digital', 'IBM Consulting', 'Capgemini'],
      opportunitiesPerMonth: 12,
      conversionRate: 68,
      avgSalesCycle: 120
    }
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
    communicationVolume: 'medium',
    yearsExperience: 15,
    territory: 'North America',
    specialization: 'Strategic Accounts',
    communicationPattern: {
      preferredChannels: ['email', 'meeting'],
      avgMessagesPerDay: 25,
      responseTimeHours: 4,
      meetingFrequency: 'occasional',
      emailStyle: 'brief'
    },
    opportunityProfile: {
      avgDealSize: { min: 2000000, max: 15000000 },
      primaryIndustries: ['financial-services', 'manufacturing', 'government'],
      primarySolutions: ['data-ai', 'security', 'infrastructure'],
      partnerTypes: ['Accenture', 'IBM Consulting', 'TCS', 'DXC Technology'],
      opportunitiesPerMonth: 6,
      conversionRate: 75,
      avgSalesCycle: 180
    }
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
    communicationVolume: 'high',
    yearsExperience: 6,
    territory: 'Global',
    specialization: 'Partner Ecosystem',
    communicationPattern: {
      preferredChannels: ['chat', 'email', 'meeting'],
      avgMessagesPerDay: 60,
      responseTimeHours: 1,
      meetingFrequency: 'daily',
      emailStyle: 'casual'
    },
    opportunityProfile: {
      avgDealSize: { min: 250000, max: 3000000 },
      primaryIndustries: ['technology', 'retail', 'financial-services', 'healthcare'],
      primarySolutions: ['app-modernization', 'azure-migration', 'modern-workplace', 'data-ai'],
      partnerTypes: ['Infosys', 'Wipro', 'Cognizant', 'Capgemini', 'Atos', 'Deloitte Digital'],
      opportunitiesPerMonth: 20,
      conversionRate: 62,
      avgSalesCycle: 90
    }
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
    communicationVolume: 'low',
    yearsExperience: 1,
    territory: 'West Coast',
    specialization: 'SMB Sales',
    communicationPattern: {
      preferredChannels: ['email', 'chat'],
      avgMessagesPerDay: 15,
      responseTimeHours: 6,
      meetingFrequency: 'rare',
      emailStyle: 'formal'
    },
    opportunityProfile: {
      avgDealSize: { min: 50000, max: 500000 },
      primaryIndustries: ['retail', 'technology', 'education'],
      primarySolutions: ['modern-workplace', 'security', 'azure-migration'],
      partnerTypes: ['Cognizant', 'Wipro', 'Atos'],
      opportunitiesPerMonth: 4,
      conversionRate: 45,
      avgSalesCycle: 60
    }
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
    communicationVolume: 'medium',
    yearsExperience: 10,
    territory: 'East Coast',
    specialization: 'Cloud Architecture',
    communicationPattern: {
      preferredChannels: ['email', 'meeting'],
      avgMessagesPerDay: 20,
      responseTimeHours: 3,
      meetingFrequency: 'frequent',
      emailStyle: 'detailed'
    },
    opportunityProfile: {
      avgDealSize: { min: 750000, max: 4000000 },
      primaryIndustries: ['healthcare', 'financial-services', 'manufacturing'],
      primarySolutions: ['azure-migration', 'data-ai', 'app-modernization', 'security'],
      partnerTypes: ['IBM Consulting', 'Accenture', 'Deloitte Digital', 'TCS'],
      opportunitiesPerMonth: 8,
      conversionRate: 72,
      avgSalesCycle: 150
    }
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
    communicationVolume: 'low',
    yearsExperience: 20,
    territory: 'Global',
    specialization: 'Executive Strategy',
    communicationPattern: {
      preferredChannels: ['email', 'meeting'],
      avgMessagesPerDay: 10,
      responseTimeHours: 12,
      meetingFrequency: 'rare',
      emailStyle: 'brief'
    },
    opportunityProfile: {
      avgDealSize: { min: 5000000, max: 50000000 },
      primaryIndustries: ['financial-services', 'government', 'manufacturing'],
      primarySolutions: ['infrastructure', 'security', 'data-ai'],
      partnerTypes: ['Accenture', 'IBM Consulting', 'Deloitte Digital', 'DXC Technology'],
      opportunitiesPerMonth: 3,
      conversionRate: 85,
      avgSalesCycle: 240
    }
  }
]

export const getDefaultUser = (): MockUser => {
  const defaultUser = MOCK_USERS[0]
  if (!defaultUser || !defaultUser.opportunityProfile) {
    console.error('CRITICAL: Default user (MOCK_USERS[0]) is invalid or missing opportunityProfile')
    throw new Error('Application configuration error: Default user is invalid')
  }
  return defaultUser
}

export const getUserById = (id: string): MockUser | undefined => {
  const user = MOCK_USERS.find(user => user.id === id)
  if (user && !user.opportunityProfile) {
    console.error(`User ${id} is missing opportunityProfile`, user)
    return undefined
  }
  return user
}
