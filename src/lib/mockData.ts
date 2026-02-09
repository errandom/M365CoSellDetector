import type { 
  Communication, 
  DetectedOpportunity, 
  Entity, 
  DashboardMetrics, 
  SolutionArea, 
  BANT, 
  Budget, 
  Authority, 
  Need, 
  Timeline,
  Contact 
} from './types'

// Partner data with identifiers
const partnersData = [
  { name: 'Accenture', partnerOneId: 'P1-ACN-001', mpnId: 'MPN-4567890' },
  { name: 'Deloitte Digital', partnerOneId: 'P1-DEL-002', mpnId: 'MPN-3456789' },
  { name: 'IBM Consulting', partnerOneId: 'P1-IBM-003', mpnId: 'MPN-2345678' },
  { name: 'Capgemini', partnerOneId: 'P1-CAP-004', mpnId: 'MPN-1234567' },
  { name: 'TCS', partnerOneId: 'P1-TCS-005', mpnId: 'MPN-9876543' },
  { name: 'Infosys', partnerOneId: 'P1-INF-006', mpnId: 'MPN-8765432' },
  { name: 'Wipro', partnerOneId: 'P1-WIP-007', mpnId: 'MPN-7654321' },
  { name: 'Cognizant', partnerOneId: 'P1-COG-008', mpnId: 'MPN-6543210' },
  { name: 'DXC Technology', partnerOneId: 'P1-DXC-009', mpnId: 'MPN-5432109' },
  { name: 'Atos', partnerOneId: 'P1-ATO-010', mpnId: 'MPN-4321098' }
]

// Account data with identifiers
const accountsData = [
  { name: 'Contoso Ltd', crmAccountId: 'CRM-CNT-001', tpid: 'TPID-100001' },
  { name: 'Fabrikam Inc', crmAccountId: 'CRM-FAB-002', tpid: 'TPID-100002' },
  { name: 'Northwind Traders', crmAccountId: 'CRM-NWT-003', tpid: 'TPID-100003' },
  { name: 'Adventure Works', crmAccountId: 'CRM-ADW-004', tpid: 'TPID-100004' },
  { name: 'Wide World Importers', crmAccountId: 'CRM-WWI-005', tpid: 'TPID-100005' },
  { name: 'Tailspin Toys', crmAccountId: 'CRM-TST-006', tpid: 'TPID-100006' },
  { name: 'Fourth Coffee', crmAccountId: 'CRM-4CF-007', tpid: 'TPID-100007' },
  { name: 'Woodgrove Bank', crmAccountId: 'CRM-WGB-008', tpid: 'TPID-100008' }
]

// Legacy arrays for backward compatibility
const partners = partnersData.map(p => p.name)
const customers = accountsData.map(a => a.name)

const keywords = [
  'co-sell', 'partner', 'joint opportunity', 'collaboration', 'partnership',
  'co-selling', 'referral', 'joint proposal', 'partner engagement'
]

const solutionAreas: SolutionArea[] = [
  'azure-migration', 'modern-workplace', 'security', 'data-ai', 'app-modernization', 'infrastructure', 'business-applications', 'dynamics-365'
]

const engagementTypes = [
  'Co-sell', 'Partner Referral', 'Joint Proposal', 'Co-Build', 'Marketplace Transaction'
]

// Customer needs/asks for BANT
const customerNeeds = [
  'Migrate on-premises infrastructure to Azure with minimal downtime',
  'Implement Zero Trust security architecture across the organization',
  'Modernize legacy applications to cloud-native microservices',
  'Deploy Microsoft 365 Copilot for 5000+ users organization-wide',
  'Build real-time analytics platform using Azure Synapse and Power BI',
  'Implement Dynamics 365 for unified customer engagement',
  'Establish disaster recovery and business continuity on Azure',
  'Create AI/ML solution for predictive maintenance using Azure AI'
]

// Products and services for BANT Need
const productsOptions = [
  ['Azure', 'Azure Migrate', 'Azure Site Recovery'],
  ['Microsoft 365', 'Microsoft Copilot', 'Teams'],
  ['Azure Security Center', 'Microsoft Defender', 'Entra ID'],
  ['Azure Synapse', 'Power BI', 'Azure Data Factory'],
  ['Dynamics 365 Sales', 'Dynamics 365 Customer Service'],
  ['Azure Kubernetes Service', 'Azure App Service', 'Azure Functions']
]

const servicesOptions = [
  'Architecture review', 'Implementation', 'Migration support',
  'Training and enablement', 'Managed services', 'Technical consultation'
]

// Contact titles for Authority
const customerTitles = ['CTO', 'CIO', 'VP of IT', 'Director of Digital Transformation', 'Head of Cloud Strategy', 'IT Director']
const partnerTitles = ['Partner Director', 'Engagement Manager', 'Solution Architect', 'Account Executive', 'Practice Lead']

const nextStepsOptions = [
  'Schedule joint customer call',
  'Register opportunity in Partner Center',
  'Assign Microsoft technical seller',
  'Share customer requirements with partner',
  'Set up internal alignment meeting'
]

// Currency conversion rates to USD (approximate)
const currencyRates: Record<string, number> = {
  'USD': 1,
  'EUR': 1.08,
  'GBP': 1.27,
  'CAD': 0.74,
  'AUD': 0.65,
  'JPY': 0.0067,
  'INR': 0.012
}

const currencies = Object.keys(currencyRates)

/**
 * Generate a random BANT object
 */
function generateBANT(): BANT {
  const missingElements: ('budget' | 'authority' | 'need' | 'timeline')[] = []
  
  // Randomly decide which elements are present (70% chance each)
  const hasBudget = Math.random() > 0.3
  const hasAuthority = Math.random() > 0.3
  const hasNeed = Math.random() > 0.2 // Need is more commonly available
  const hasTimeline = Math.random() > 0.3
  
  let budget: Budget | undefined
  if (hasBudget) {
    const currency = currencies[Math.floor(Math.random() * currencies.length)]
    const amount = Math.floor(Math.random() * 5000000) + 100000 // $100K - $5M
    budget = {
      amount,
      currency,
      amountUSD: Math.round(amount * currencyRates[currency]),
      confidence: 0.7 + Math.random() * 0.25
    }
  } else {
    missingElements.push('budget')
  }
  
  let authority: Authority | undefined
  if (hasAuthority) {
    const customerContact: Contact = {
      name: `${['John', 'Sarah', 'Michael', 'Emily', 'David'][Math.floor(Math.random() * 5)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]}`,
      email: `contact@${customers[Math.floor(Math.random() * customers.length)].toLowerCase().replace(/\s+/g, '')}.com`,
      title: customerTitles[Math.floor(Math.random() * customerTitles.length)],
      role: 'Decision Maker'
    }
    
    const partnerContact: Contact = {
      name: `${['Alex', 'Chris', 'Jordan', 'Taylor', 'Morgan'][Math.floor(Math.random() * 5)]} ${['Miller', 'Davis', 'Garcia', 'Wilson', 'Moore'][Math.floor(Math.random() * 5)]}`,
      email: `partner@${partners[Math.floor(Math.random() * partners.length)].toLowerCase().replace(/\s+/g, '')}.com`,
      title: partnerTitles[Math.floor(Math.random() * partnerTitles.length)]
    }
    
    authority = {
      customerContact,
      partnerContact,
      confidence: 0.75 + Math.random() * 0.2
    }
  } else {
    missingElements.push('authority')
  }
  
  let need: Need | undefined
  if (hasNeed) {
    const solutionArea = solutionAreas[Math.floor(Math.random() * solutionAreas.length)]
    const products = productsOptions[Math.floor(Math.random() * productsOptions.length)]
    const services = [servicesOptions[Math.floor(Math.random() * servicesOptions.length)]]
    
    need = {
      description: customerNeeds[Math.floor(Math.random() * customerNeeds.length)],
      solutionArea,
      products,
      services,
      confidence: 0.8 + Math.random() * 0.15
    }
  } else {
    missingElements.push('need')
  }
  
  let timeline: Timeline | undefined
  if (hasTimeline) {
    const monthsAhead = Math.floor(Math.random() * 12) + 1
    const closeDate = new Date()
    closeDate.setMonth(closeDate.getMonth() + monthsAhead)
    
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
    const quarter = quarters[Math.floor(closeDate.getMonth() / 3)]
    
    timeline = {
      estimatedCloseDate: closeDate.toISOString(),
      timeframeDescription: `${quarter} ${closeDate.getFullYear()}`,
      urgency: (['low', 'medium', 'high', 'critical'] as const)[Math.floor(Math.random() * 4)],
      confidence: 0.7 + Math.random() * 0.25
    }
  } else {
    missingElements.push('timeline')
  }
  
  // Calculate BANT score (25 points each element, weighted by confidence)
  let score = 0
  if (budget) score += 25 * budget.confidence
  if (authority) score += 25 * authority.confidence
  if (need) score += 25 * need.confidence
  if (timeline) score += 25 * timeline.confidence
  
  return {
    budget,
    authority,
    need,
    timeline,
    score: Math.round(score),
    missingElements
  }
}

export function generateMockEmails(count: number = 5): Communication[] {
  const emails: Communication[] = []
  const subjects = [
    'Re: Partnership opportunity with {customer}',
    'Joint proposal for {customer} - Azure Migration',
    'Co-sell discussion: {customer} modernization project',
    'Partner collaboration: {customer} digital transformation',
    'Following up on {customer} opportunity',
  ]

  for (let i = 0; i < count; i++) {
    const partner = partners[Math.floor(Math.random() * partners.length)]
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const subject = subjects[Math.floor(Math.random() * subjects.length)].replace('{customer}', customer)
    const daysAgo = Math.floor(Math.random() * 30)
    
    emails.push({
      id: `email-${i + 1}`,
      type: 'email',
      subject,
      from: `contact@${partner.toLowerCase().replace(/\s+/g, '')}.com`,
      date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      preview: `Hi team, I wanted to discuss our joint opportunity with ${customer}. They're looking to migrate their infrastructure to Azure and this could be a great co-sell opportunity...`,
      content: `Hi team,\n\nI wanted to discuss our joint opportunity with ${customer}. They're looking to migrate their infrastructure to Azure and this could be a great co-sell opportunity for both our organizations.\n\nKey details:\n- Customer: ${customer}\n- Project scope: Azure cloud migration\n- Estimated timeline: Q2 2024\n- Potential deal size: $2.5M\n\nWe've already had preliminary discussions with their CTO and they're interested in a joint proposal from Microsoft and ${partner}. Can we schedule a call this week to align on our approach?\n\nBest regards,\nPartner Team`,
      participants: [`contact@${partner.toLowerCase().replace(/\s+/g, '')}.com`, 'you@microsoft.com']
    })
  }

  return emails
}

export function generateMockChats(count: number = 4): Communication[] {
  const chats: Communication[] = []
  
  for (let i = 0; i < count; i++) {
    const partner = partners[Math.floor(Math.random() * partners.length)]
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const daysAgo = Math.floor(Math.random() * 14)
    
    chats.push({
      id: `chat-${i + 1}`,
      type: 'chat',
      subject: `Teams chat with ${partner}`,
      from: partner,
      date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      preview: `Quick question about the ${customer} opportunity - are we positioning this as a co-sell?`,
      content: `[10:24 AM] Partner: Quick question about the ${customer} opportunity - are we positioning this as a co-sell?\n\n[10:26 AM] You: Yes, definitely! They need both our Azure expertise and your implementation services.\n\n[10:27 AM] Partner: Perfect. I'll update our CRM to reflect the partnership. What's the opportunity ID on your side?\n\n[10:30 AM] You: Let me check and get back to you. We should make sure both systems are linked.`,
      participants: [partner, 'You']
    })
  }

  return chats
}

export function generateMockMeetings(count: number = 3): Communication[] {
  const meetings: Communication[] = []
  
  for (let i = 0; i < count; i++) {
    const partner = partners[Math.floor(Math.random() * partners.length)]
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const daysAgo = Math.floor(Math.random() * 7)
    
    meetings.push({
      id: `meeting-${i + 1}`,
      type: 'meeting',
      subject: `Partner Sync: ${customer} Opportunity`,
      from: 'Teams Meeting Transcript',
      date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      preview: `Discussion about joint engagement with ${customer} for digital transformation project...`,
      content: `[Meeting Transcript]\n\nSpeaker 1 (Microsoft): Thanks everyone for joining. Today we want to discuss the ${customer} opportunity and how we can work together with ${partner}.\n\nSpeaker 2 (${partner}): Happy to be here. We've been in talks with ${customer} about their digital transformation needs. This seems like a perfect fit for a joint engagement.\n\nSpeaker 1: Agreed. What's the scope they're looking at?\n\nSpeaker 2: They want to modernize their entire application portfolio and move to cloud-native architecture. Estimated $3M+ project over 18 months.\n\nSpeaker 1: That's substantial. We should definitely register this as a co-sell opportunity in both systems. I'll create the opportunity on our side and link it to your partner record.\n\nSpeaker 2: Sounds good. When can we schedule the joint discovery session with their team?\n\nSpeaker 1: How about next Tuesday? I'll send a calendar invite.`,
      participants: ['You', partner, `${customer} team`]
    })
  }

  return meetings
}

export function detectOpportunities(communications: Communication[], customKeywords?: string[]): DetectedOpportunity[] {
  const opportunities: DetectedOpportunity[] = []
  const keywordsToUse = customKeywords && customKeywords.length > 0 ? customKeywords : keywords
  
  communications.forEach(comm => {
    const foundKeywords = keywordsToUse.filter(kw => 
      comm.content.toLowerCase().includes(kw) || 
      comm.subject.toLowerCase().includes(kw)
    )
    
    if (foundKeywords.length === 0) return
    
    // Find partner with full identifier data
    const partnerData = partnersData.find(p => 
      comm.content.includes(p.name) || comm.from.toLowerCase().includes(p.name.toLowerCase().replace(/\s+/g, ''))
    )
    
    // Find account with full identifier data
    const accountData = accountsData.find(a => comm.content.includes(a.name) || comm.subject.includes(a.name))
    
    if (!partnerData && !accountData) return
    
    // Create Entity with extended identifiers
    const partner: Entity | null = partnerData ? {
      name: partnerData.name,
      type: 'partner',
      confidence: 0.85 + Math.random() * 0.14,
      partnerOneId: partnerData.partnerOneId,
      mpnId: partnerData.mpnId
    } : null
    
    const customer: Entity | null = accountData ? {
      name: accountData.name,
      type: 'customer',
      confidence: 0.80 + Math.random() * 0.19,
      crmAccountId: accountData.crmAccountId,
      tpid: accountData.tpid
    } : null
    
    // Generate BANT qualification
    const bant = generateBANT()
    
    // Derive legacy fields from BANT for backward compatibility
    const dealSize = bant.budget 
      ? `$${(bant.budget.amountUSD / 1000000).toFixed(1)}M` 
      : `$${(Math.random() * 5 + 0.5).toFixed(1)}M`
    
    const timeline = bant.timeline?.timeframeDescription || 'Q2 2026'
    const askExpectation = bant.need?.description || customerNeeds[Math.floor(Math.random() * customerNeeds.length)]
    const solutionArea = bant.need?.solutionArea || solutionAreas[Math.floor(Math.random() * solutionAreas.length)]
    
    opportunities.push({
      id: `opp-${comm.id}`,
      communication: comm,
      partner,
      customer,
      summary: generateSummary(comm, partner, customer),
      keywords: foundKeywords,
      confidence: Math.min((partner?.confidence || 0.5) + (customer?.confidence || 0.5)) / 2,
      status: 'new',
      crmAction: Math.random() > 0.5 ? 'create' : 'update',
      existingOpportunityId: Math.random() > 0.5 ? `OPP-${Math.floor(Math.random() * 10000)}` : undefined,
      createdAt: comm.date,
      updatedAt: new Date().toISOString(),
      // BANT qualification
      bant,
      // Legacy/derived fields for display  
      dealSize,
      timeline,
      askExpectation,
      solutionArea,
      engagementType: engagementTypes[Math.floor(Math.random() * engagementTypes.length)],
      nextSteps: nextStepsOptions[Math.floor(Math.random() * nextStepsOptions.length)]
    })
  })
  
  return opportunities
}

function generateSummary(comm: Communication, partner: Entity | null, customer: Entity | null): string {
  const summaries = [
    `${partner?.name || 'Partner'} discussing joint ${customer?.name || 'customer'} opportunity for cloud migration and digital transformation.`,
    `Co-sell opportunity identified with ${partner?.name || 'partner'} for ${customer?.name || 'customer'} modernization project.`,
    `Partnership proposal from ${partner?.name || 'partner'} to jointly serve ${customer?.name || 'customer'} with Azure solutions.`,
    `${customer?.name || 'Customer'} engagement requiring collaboration with ${partner?.name || 'partner'} for implementation services.`,
  ]
  
  return summaries[Math.floor(Math.random() * summaries.length)]
}

export function generateDashboardMetrics(): DashboardMetrics {
  const recentActivity = Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * 8) + 1
  }))
  
  const topPartners = partners.slice(0, 5).map(p => ({
    name: p,
    opportunities: Math.floor(Math.random() * 12) + 3,
    value: (Math.random() * 15 + 2) * 1000000
  })).sort((a, b) => b.value - a.value)
  
  return {
    totalOpportunities: 47,
    pendingReview: 12,
    synced: 35,
    activePartners: 23,
    pipelineValue: 28500000,
    conversionRate: 67.5,
    recentActivity,
    topPartners
  }
}

export async function simulateAIScan(
  sources: ('email' | 'chat' | 'meeting')[],
  customKeywords?: string[],
  onProgress?: (stage: string, progress: number) => void
): Promise<DetectedOpportunity[]> {
  const stages = [
    'Connecting to Microsoft Graph API...',
    'Fetching communications...',
    'Applying keyword filters...',
    'Extracting entities with AI...',
    'Matching against CRM records...',
    'Finalizing results...'
  ]
  
  let allCommunications: Communication[] = []
  
  for (let i = 0; i < stages.length; i++) {
    if (onProgress) onProgress(stages[i], (i + 1) / stages.length)
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (i === 1) {
      if (sources.includes('email')) allCommunications.push(...generateMockEmails())
      if (sources.includes('chat')) allCommunications.push(...generateMockChats())
      if (sources.includes('meeting')) allCommunications.push(...generateMockMeetings())
    }
  }
  
  return detectOpportunities(allCommunications, customKeywords)
}
