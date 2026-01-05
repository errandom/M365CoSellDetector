import type { Communication, DetectedOpportunity, Entity, DashboardMetrics } from './types'

const partners = [
  'Accenture', 'Deloitte Digital', 'IBM Consulting', 'Capgemini', 
  'TCS', 'Infosys', 'Wipro', 'Cognizant', 'DXC Technology', 'Atos'
]

const customers = [
  'Contoso Ltd', 'Fabrikam Inc', 'Northwind Traders', 'Adventure Works',
  'Wide World Importers', 'Tailspin Toys', 'Fourth Coffee', 'Woodgrove Bank'
]

const keywords = [
  'co-sell', 'partner', 'joint opportunity', 'collaboration', 'partnership',
  'co-selling', 'referral', 'joint proposal', 'partner engagement'
]

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
    
    const partnerMatch = partners.find(p => 
      comm.content.includes(p) || comm.from.toLowerCase().includes(p.toLowerCase().replace(/\s+/g, ''))
    )
    
    const customerMatch = customers.find(c => comm.content.includes(c) || comm.subject.includes(c))
    
    if (!partnerMatch && !customerMatch) return
    
    const partner: Entity | null = partnerMatch ? {
      name: partnerMatch,
      type: 'partner',
      confidence: 0.85 + Math.random() * 0.14
    } : null
    
    const customer: Entity | null = customerMatch ? {
      name: customerMatch,
      type: 'customer',
      confidence: 0.80 + Math.random() * 0.19
    } : null
    
    const dealSizeMatch = comm.content.match(/\$(\d+(?:\.\d+)?[MK]?)/i)
    const timelineMatch = comm.content.match(/Q[1-4]\s+\d{4}|(\d+)\s+months?/i)
    
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
      dealSize: dealSizeMatch ? dealSizeMatch[0] : undefined,
      timeline: timelineMatch ? timelineMatch[0] : undefined,
      createdAt: comm.date,
      updatedAt: new Date().toISOString()
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
