import type { Communication, DetectedOpportunity, Entity, IndustryVertical, SolutionArea } from './types'
import type { MockUser } from './mockUsers'

const INDUSTRY_CUSTOMERS: Record<IndustryVertical, string[]> = {
  'financial-services': [
    'First National Bank', 'Global Investment Corp', 'Summit Financial', 'Apex Capital Partners',
    'Metropolitan Trust', 'Horizon Bank Group', 'Prestige Wealth Management'
  ],
  'healthcare': [
    'Regional Medical Center', 'HealthFirst Systems', 'MediCare Solutions', 'Unity Health Network',
    'Evergreen Hospital', 'CarePoint Medical Group', 'Wellness Partners Inc'
  ],
  'retail': [
    'MegaMart Retail', 'Fashion Forward Inc', 'QuickShop Markets', 'Lifestyle Brands Co',
    'Urban Retail Group', 'Prime Commerce', 'TrendSet Stores'
  ],
  'manufacturing': [
    'Precision Industries', 'Global Manufacturing Corp', 'TechParts International', 'Advanced Fabrication',
    'Industrial Solutions Ltd', 'Quantum Manufacturing', 'Atlas Production Systems'
  ],
  'technology': [
    'TechVision Software', 'DataStream Analytics', 'CloudFirst Technologies', 'NextGen Systems',
    'Innovate Software Group', 'Digital Solutions Inc', 'FutureTech Labs'
  ],
  'government': [
    'Department of Transportation', 'State Education Board', 'City Services Agency', 'Federal Health Bureau',
    'Regional Planning Commission', 'Public Safety Department', 'Infrastructure Development Authority'
  ],
  'education': [
    'State University', 'Metropolitan College', 'Tech Academy', 'Learning Excellence School District',
    'Innovation University', 'Community College Network', 'Global Education Institute'
  ]
}

const SOLUTION_DESCRIPTIONS: Record<SolutionArea, { keywords: string[], topics: string[], dealDrivers: string[] }> = {
  'azure-migration': {
    keywords: ['cloud migration', 'Azure', 'lift-and-shift', 'datacenter modernization', 'cloud adoption'],
    topics: ['migrating workloads to Azure', 'retiring on-premises infrastructure', 'cloud transformation'],
    dealDrivers: ['cost savings', 'scalability', 'datacenter lease expiring', 'legacy infrastructure']
  },
  'modern-workplace': {
    keywords: ['Microsoft 365', 'Teams', 'hybrid work', 'collaboration', 'productivity'],
    topics: ['modern workplace transformation', 'Teams deployment', 'hybrid work enablement'],
    dealDrivers: ['remote work requirements', 'collaboration needs', 'employee productivity', 'digital workplace']
  },
  'security': {
    keywords: ['zero trust', 'security', 'compliance', 'threat protection', 'identity management'],
    topics: ['implementing zero trust architecture', 'enhancing security posture', 'compliance requirements'],
    dealDrivers: ['security incidents', 'compliance mandates', 'cyber threats', 'data protection']
  },
  'data-ai': {
    keywords: ['AI', 'machine learning', 'data analytics', 'Power BI', 'data modernization'],
    topics: ['AI implementation', 'data platform modernization', 'analytics transformation'],
    dealDrivers: ['data-driven decisions', 'competitive advantage', 'insights generation', 'automation']
  },
  'app-modernization': {
    keywords: ['application modernization', 'containerization', 'microservices', 'DevOps', 'cloud-native'],
    topics: ['modernizing legacy applications', 'adopting cloud-native architecture', 'DevOps transformation'],
    dealDrivers: ['technical debt', 'agility needs', 'deployment speed', 'scalability requirements']
  },
  'infrastructure': {
    keywords: ['infrastructure', 'hybrid cloud', 'disaster recovery', 'business continuity', 'Azure Stack'],
    topics: ['infrastructure modernization', 'hybrid cloud strategy', 'disaster recovery planning'],
    dealDrivers: ['aging infrastructure', 'business continuity', 'operational efficiency', 'cost optimization']
  }
}

const COMMUNICATION_TEMPLATES = {
  email: {
    brief: (user: MockUser, partner: string, customer: string, solution: SolutionArea) => {
      const templates = [
        {
          subject: `Re: ${customer} - ${solution.replace('-', ' ')} opportunity`,
          content: `Hi team,\n\nQuick update on ${customer}. They're ready to move forward with ${SOLUTION_DESCRIPTIONS[solution].topics[0]}. ${partner} is aligned on the technical approach.\n\nDeal size: $${formatDealSize(user)}. Timeline: Q${Math.ceil(Math.random() * 4)} 2024.\n\nLet's sync this week.\n\nBest,\n${user.name.split(' ')[0]}`
        },
        {
          subject: `${customer} co-sell with ${partner}`,
          content: `Team,\n\n${partner} brought ${customer} to us for ${SOLUTION_DESCRIPTIONS[solution].topics[1]}. Strong fit. Estimated ${formatDealSize(user)}.\n\nNeed to register as co-sell opportunity. Can someone create the CRM record?\n\nThanks,\n${user.name.split(' ')[0]}`
        }
      ]
      return templates[Math.floor(Math.random() * templates.length)]
    },
    detailed: (user: MockUser, partner: string, customer: string, solution: SolutionArea) => {
      const solutionInfo = SOLUTION_DESCRIPTIONS[solution]
      const topic = solutionInfo.topics[Math.floor(Math.random() * solutionInfo.topics.length)]
      const driver = solutionInfo.dealDrivers[Math.floor(Math.random() * solutionInfo.dealDrivers.length)]
      
      return {
        subject: `Partnership Opportunity: ${customer} ${solution.replace('-', ' ')} Initiative`,
        content: `Hi everyone,\n\nI wanted to provide a comprehensive update on an exciting co-sell opportunity with ${partner} for ${customer}.\n\n**Background:**\n${customer} is looking to address their ${driver} challenges through ${topic}. They've been working with ${partner} on the initial assessment and ${partner} has recommended Microsoft as the strategic technology partner.\n\n**Opportunity Details:**\n- Customer: ${customer}\n- Partner: ${partner}\n- Solution Area: ${solution.replace('-', ' ')}\n- Estimated Deal Size: $${formatDealSize(user)}\n- Timeline: ${Math.floor(Math.random() * 6 + 3)} months\n- Decision Makers: CIO and CFO\n\n**Next Steps:**\n1. Schedule joint discovery session with ${customer}, ${partner}, and our solution architects\n2. Create formal opportunity in CRM and link partner engagement\n3. Develop joint proposal with ${partner}\n4. Present to customer executive team\n\n**Key Differentiators:**\n- ${partner}'s deep ${solution} expertise\n- Our strategic relationship with ${customer}\n- Proven success in similar implementations\n\nThis represents a significant co-sell opportunity that aligns perfectly with our partner strategy. I'll need support from our technical team for the discovery session.\n\nPlease let me know if you have any questions or need additional context.\n\nBest regards,\n${user.name}`
      }
    },
    formal: (user: MockUser, partner: string, customer: string, solution: SolutionArea) => {
      return {
        subject: `Joint Opportunity Notification - ${customer}`,
        content: `Dear Team,\n\nI am writing to formally notify you of a partnership opportunity that has been identified with ${partner} regarding ${customer}.\n\nThe customer has expressed interest in ${SOLUTION_DESCRIPTIONS[solution].topics[0]} and we believe this presents a viable co-sell opportunity.\n\n**Summary:**\n- Customer Organization: ${customer}\n- Partner Organization: ${partner}\n- Project Focus: ${solution.replace('-', ' ')}\n- Estimated Value: $${formatDealSize(user)}\n- Projected Timeline: ${Math.floor(Math.random() * 180 + 60)} days\n\nI will be scheduling a meeting to discuss the next steps for this opportunity. Please review this information and come prepared with any questions or concerns.\n\nThank you for your attention to this matter.\n\nSincerely,\n${user.name}\n${user.role}\n${user.email}`
      }
    },
    casual: (user: MockUser, partner: string, customer: string, solution: SolutionArea) => {
      return {
        subject: `🎯 ${customer} opportunity with ${partner}`,
        content: `Hey team! 👋\n\nGot some exciting news - ${partner} just connected us with ${customer} for a ${solution.replace('-', ' ')} project.\n\nThey're looking at ${SOLUTION_DESCRIPTIONS[solution].topics[2]} and it's looking like a solid ~$${formatDealSize(user)} deal. The timeline is pretty aggressive (they want to start in Q${Math.ceil(Math.random() * 4)}) but totally doable.\n\n${partner} has been working with them for a while and they specifically asked to bring us in as the technology partner. Great validation of our partnership! 🙌\n\nI'm thinking we should set up a quick call this week to discuss the approach. Who's available?\n\n- ${user.name.split(' ')[0]}`
      }
    }
  },
  chat: {
    brief: (user: MockUser, partner: string, customer: string, solution: SolutionArea) => 
      `[9:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} AM] ${partner} Partner: Hey ${user.name.split(' ')[0]}, quick question about ${customer}. Are we positioning this as a co-sell?\n\n[9:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} AM] ${user.name}: Yes definitely! They need our ${solution.replace('-', ' ')} solutions. Estimated ${formatDealSize(user)}.\n\n[9:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} AM] ${partner} Partner: Perfect. Should I create the opportunity on our side?\n\n[9:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} AM] ${user.name}: Yes, and send me the ref # so I can link it in our CRM.`,
    
    detailed: (user: MockUser, partner: string, customer: string, solution: SolutionArea) => {
      const driver = SOLUTION_DESCRIPTIONS[solution].dealDrivers[Math.floor(Math.random() * SOLUTION_DESCRIPTIONS[solution].dealDrivers.length)]
      return `[2:15 PM] ${partner} Partner: Hi ${user.name.split(' ')[0]}, wanted to discuss the ${customer} opportunity in more detail\n\n[2:17 PM] ${user.name}: Sure! What's the latest?\n\n[2:18 PM] ${partner} Partner: We've completed the initial assessment. They have significant ${driver} that needs to be addressed. Our team recommended your ${solution.replace('-', ' ')} solutions as the best fit.\n\n[2:20 PM] ${user.name}: That's great alignment. What's the scope looking like?\n\n[2:21 PM] ${partner} Partner: Pretty substantial - we're looking at $${formatDealSize(user)} over ${Math.floor(Math.random() * 12 + 6)} months. They want to start with a pilot in Q${Math.ceil(Math.random() * 4)}.\n\n[2:23 PM] ${user.name}: Excellent. This should definitely be registered as a co-sell opportunity. Have you talked to their CIO yet?\n\n[2:24 PM] ${partner} Partner: Meeting scheduled for next week. Can you join?\n\n[2:25 PM] ${user.name}: Absolutely. Send me the invite. I'll also loop in our solution architect.`
    },
    
    formal: (user: MockUser, partner: string, customer: string, solution: SolutionArea) => 
      `[10:00 AM] ${user.name}: Good morning. I wanted to follow up on our discussion regarding the ${customer} opportunity.\n\n[10:05 AM] ${partner} Partner: Good morning ${user.name}. Yes, I have prepared the documentation for the proposed ${solution.replace('-', ' ')} engagement.\n\n[10:07 AM] ${user.name}: Excellent. What is the estimated project value?\n\n[10:08 AM] ${partner} Partner: Based on our assessment, we are estimating approximately $${formatDealSize(user)}.\n\n[10:10 AM] ${user.name}: That aligns with our expectations. Please proceed with the formal proposal. I will create the opportunity record in our CRM system.\n\n[10:11 AM] ${partner} Partner: Understood. I will send the proposal by end of week.`,
    
    casual: (user: MockUser, partner: string, customer: string, solution: SolutionArea) => 
      `[3:42 PM] ${user.name.split(' ')[0]}: Hey! Just got off the phone with ${customer} 📞\n\n[3:43 PM] ${partner} Contact: Oh nice! How'd it go?\n\n[3:44 PM] ${user.name.split(' ')[0]}: Really well! They're super interested in the ${solution.replace('-', ' ')} stuff we talked about. Thinking ${formatDealSize(user)} range 💰\n\n[3:45 PM] ${partner} Contact: That's awesome!! 🎉\n\n[3:46 PM] ${user.name.split(' ')[0]}: Yeah! We should definitely register this as a co-sell. They mentioned you specifically which is great\n\n[3:47 PM] ${partner} Contact: Perfect! Want to set up a joint call with them?\n\n[3:48 PM] ${user.name.split(' ')[0]}: For sure. I'll send some times tomorrow 👍`
  },
  meeting: {
    brief: (user: MockUser, partner: string, customer: string, solution: SolutionArea) => 
      `[Meeting Transcript - ${customer} Partner Sync]\n\n${user.name}: Thanks for joining. Let's discuss the ${customer} opportunity.\n\n${partner} Rep: We've identified a ${solution.replace('-', ' ')} need worth about $${formatDealSize(user)}.\n\n${user.name}: Timeline?\n\n${partner} Rep: They want to start Q${Math.ceil(Math.random() * 4)}.\n\n${user.name}: Good. I'll create the co-sell opportunity today.\n\n${partner} Rep: Great. I'll send over the technical requirements.\n\n${user.name}: Perfect. Let's schedule the customer meeting for next week.`,
    
    detailed: (user: MockUser, partner: string, customer: string, solution: SolutionArea) => {
      const topic = SOLUTION_DESCRIPTIONS[solution].topics[Math.floor(Math.random() * SOLUTION_DESCRIPTIONS[solution].topics.length)]
      const driver = SOLUTION_DESCRIPTIONS[solution].dealDrivers[Math.floor(Math.random() * SOLUTION_DESCRIPTIONS[solution].dealDrivers.length)]
      
      return `[Meeting Transcript - ${customer} Discovery Call]\nDate: ${new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}\nAttendees: ${user.name} (Microsoft), ${partner} Team, ${customer} Stakeholders\n\n${user.name}: Thank you everyone for joining today's discovery session. I'm ${user.name}, ${user.role} at Microsoft. We're excited to explore how we can support ${customer}'s ${solution.replace('-', ' ')} initiative in partnership with ${partner}.\n\n${customer} CIO: Thanks for making the time. We're at a critical juncture with our ${driver} and need to make some strategic decisions quickly.\n\n${partner} Consultant: We've been working with ${customer} for the past few months on the assessment phase. The findings clearly indicate that ${topic} is the right path forward.\n\n${user.name}: That aligns well with what we've been seeing in the ${solution} space. Can you share more about the current challenges and what success looks like?\n\n${customer} CIO: Certainly. Our primary goals are to [achieve business outcome], [improve efficiency], and [reduce costs]. We're looking at a ${Math.floor(Math.random() * 12 + 6)}-month timeline and have allocated a budget in the $${formatDealSize(user)} range.\n\n${partner} Consultant: From a technical perspective, we recommend a phased approach starting with a pilot program. This allows us to validate the architecture and demonstrate value before full-scale deployment.\n\n${user.name}: That's a sound approach. Microsoft can provide architecture guidance, technical resources, and access to our FastTrack program to ensure success. ${partner}'s implementation expertise combined with our platform capabilities makes this a strong partnership.\n\n${customer} CIO: What's the next step?\n\n${user.name}: I'll work with ${partner} to develop a joint proposal that outlines the technical solution, implementation timeline, and investment. We can review that in our next meeting.\n\n${partner} Consultant: I'll coordinate with ${user.name.split(' ')[0]} on the proposal. We should have something ready for review within two weeks.\n\n${user.name}: Perfect. I'll also register this as an official co-sell opportunity in our systems to ensure we have the right resources and support lined up.`
    },
    
    formal: (user: MockUser, partner: string, customer: string, solution: SolutionArea) => 
      `[Executive Briefing - ${customer} Strategic Initiative]\nDate: ${new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}\nConfidential\n\n${user.name}: Good afternoon. Thank you for scheduling this executive briefing. Today we'll discuss the strategic partnership opportunity between Microsoft, ${partner}, and ${customer} regarding ${solution.replace('-', ' ')}.\n\n${customer} CFO: Thank you ${user.name}. We've reviewed the preliminary assessment from ${partner} and are interested in understanding Microsoft's perspective on this initiative.\n\n${partner} Managing Director: We appreciate the opportunity to present our joint recommendation. Based on our assessment, ${customer} has a significant opportunity to ${SOLUTION_DESCRIPTIONS[solution].topics[0]}, which will address the critical ${SOLUTION_DESCRIPTIONS[solution].dealDrivers[0]} challenges.\n\n${user.name}: Microsoft is committed to supporting ${customer} through this transformation. We propose a strategic engagement valued at approximately $${formatDealSize(user)}, which includes platform licensing, professional services, and ongoing support.\n\n${customer} CIO: What is the risk mitigation strategy?\n\n${partner} Managing Director: We recommend a phased implementation approach with clearly defined success criteria at each stage. This minimizes risk and ensures alignment with business objectives.\n\n${user.name}: Additionally, Microsoft provides comprehensive support through our Success program, including technical architects, program management, and executive sponsorship.\n\n${customer} CFO: Timeline and budget?\n\n${user.name}: We're proposing a ${Math.floor(Math.random() * 180 + 120)}-day implementation timeline with quarterly milestone reviews. The investment of $${formatDealSize(user)} includes all necessary components.\n\n${customer} CIO: We'll review internally and provide feedback next week.\n\n${user.name}: Thank you. I'll document this as a formal co-sell opportunity and ensure we have the appropriate resources allocated.`,
    
    casual: (user: MockUser, partner: string, customer: string, solution: SolutionArea) => 
      `[Teams Meeting - ${customer} Quick Sync]\n\n${user.name.split(' ')[0]}: Hey everyone! Thanks for hopping on.\n\n${partner} Rep: No problem! Excited to talk about ${customer}.\n\n${user.name.split(' ')[0]}: So they reached out about ${solution.replace('-', ' ')} stuff. Seems like a really good fit for what you guys do.\n\n${partner} Rep: Definitely! We've actually been talking to them for a few weeks. They're pretty serious about moving forward.\n\n${user.name.split(' ')[0]}: That's great! What kind of budget are we thinking?\n\n${partner} Rep: They mentioned around ${formatDealSize(user)} for the full project.\n\n${user.name.split(' ')[0]}: Nice! That's solid. When do they want to kick things off?\n\n${partner} Rep: They're hoping for Q${Math.ceil(Math.random() * 4)}. Is that doable on your end?\n\n${user.name.split(' ')[0]}: Yeah totally. Let me get this registered as a co-sell opportunity and we can loop in the technical folks.\n\n${partner} Rep: Sounds good. Want me to set up the intro call with their team?\n\n${user.name.split(' ')[0]}: Perfect! Yeah, let's do that. Maybe next week?`
  }
}

function formatDealSize(user: MockUser): string {
  const { min, max } = user.opportunityProfile.avgDealSize
  const amount = Math.floor(Math.random() * (max - min) + min)
  
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  }
  return `${Math.floor(amount / 1000)}K`
}

function selectRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function generateCommunicationForUser(
  user: MockUser,
  type: 'email' | 'chat' | 'meeting',
  daysAgo: number
): Communication | null {
  const industry = selectRandomElement(user.opportunityProfile.primaryIndustries)
  const solution = selectRandomElement(user.opportunityProfile.primarySolutions)
  const partner = selectRandomElement(user.opportunityProfile.partnerTypes)
  const customer = selectRandomElement(INDUSTRY_CUSTOMERS[industry])
  
  const style = user.communicationPattern.emailStyle
  const template = COMMUNICATION_TEMPLATES[type][style](user, partner, customer, solution)
  
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  
  if (type === 'email' && typeof template === 'object' && 'subject' in template) {
    return {
      id: `${type}-${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      subject: template.subject,
      from: `${partner.toLowerCase().replace(/\s+/g, '')}@partner.com`,
      date: date.toISOString(),
      preview: template.content.substring(0, 150),
      content: template.content,
      participants: [`${partner}`, user.email]
    }
  } else if (type === 'chat') {
    const content = typeof template === 'string' ? template : template.content
    return {
      id: `${type}-${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      subject: `Teams chat with ${partner}`,
      from: partner,
      date: date.toISOString(),
      preview: content.substring(0, 150),
      content,
      participants: [partner, user.name]
    }
  } else if (type === 'meeting') {
    const content = typeof template === 'string' ? template : template.content
    return {
      id: `${type}-${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      subject: `Partner Meeting: ${customer}`,
      from: 'Teams Meeting Transcript',
      date: date.toISOString(),
      preview: content.substring(0, 150),
      content,
      participants: [user.name, partner, `${customer} team`]
    }
  }
  
  return null
}

export function generateCommunicationsForUser(user: MockUser, count?: number): Communication[] {
  const communications: Communication[] = []
  
  if (!user) {
    console.error('Invalid user - user is null or undefined')
    return []
  }
  
  if (!user.opportunityProfile) {
    console.error('Invalid user - missing opportunityProfile:', user)
    return []
  }
  
  if (typeof user.opportunityProfile.opportunitiesPerMonth !== 'number') {
    console.error('Invalid opportunityProfile - opportunitiesPerMonth is not a number:', user.opportunityProfile)
    return []
  }
  
  const targetCount = count || Math.floor(user.opportunityProfile.opportunitiesPerMonth * 1.5)
  
  const channelWeights = {
    email: user.communicationPattern.preferredChannels.includes('email') ? 40 : 20,
    chat: user.communicationPattern.preferredChannels.includes('chat') ? 35 : 15,
    meeting: user.communicationPattern.preferredChannels.includes('meeting') ? 25 : 10
  }
  
  const totalWeight = channelWeights.email + channelWeights.chat + channelWeights.meeting
  
  for (let i = 0; i < targetCount; i++) {
    const rand = Math.random() * totalWeight
    let type: 'email' | 'chat' | 'meeting'
    
    if (rand < channelWeights.email) {
      type = 'email'
    } else if (rand < channelWeights.email + channelWeights.chat) {
      type = 'chat'
    } else {
      type = 'meeting'
    }
    
    const daysAgo = Math.floor(Math.random() * 30)
    const comm = generateCommunicationForUser(user, type, daysAgo)
    
    if (comm) {
      communications.push(comm)
    }
  }
  
  return communications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function generateOpportunitiesForUser(
  user: MockUser,
  communications: Communication[],
  keywords: string[]
): DetectedOpportunity[] {
  const opportunities: DetectedOpportunity[] = []
  
  const conversionFactor = user.opportunityProfile.conversionRate / 100
  
  communications.forEach(comm => {
    if (Math.random() > conversionFactor) return
    
    const foundKeywords = keywords.filter(kw => 
      comm.content.toLowerCase().includes(kw.toLowerCase()) || 
      comm.subject.toLowerCase().includes(kw.toLowerCase())
    )
    
    if (foundKeywords.length === 0) {
      foundKeywords.push(...['co-sell', 'partner', 'joint opportunity'].slice(0, 1))
    }
    
    const partnerMatch = user.opportunityProfile.partnerTypes.find(p => 
      comm.content.includes(p) || comm.from.toLowerCase().includes(p.toLowerCase().replace(/\s+/g, ''))
    )
    
    const customerPattern = /([A-Z][a-z]+ (?:[A-Z][a-z]+ )?(?:Inc|Corp|Ltd|Group|Bank|Center|Systems|Solutions|Technologies|University|College|Department))/g
    const customerMatches = comm.content.match(customerPattern)
    const customerMatch = customerMatches ? customerMatches[0] : null
    
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
    
    const dealSizeMatch = comm.content.match(/\$(\d+(?:\.\d+)?[MK])/i)
    const timelineMatch = comm.content.match(/Q[1-4]\s+\d{4}|(\d+)[-\s]?months?/i)
    
    const solution = selectRandomElement(user.opportunityProfile.primarySolutions)
    const summary = `${partner?.name || 'Partner'} collaboration with ${customer?.name || 'customer'} on ${solution.replace('-', ' ')} initiative. ${SOLUTION_DESCRIPTIONS[solution].topics[Math.floor(Math.random() * SOLUTION_DESCRIPTIONS[solution].topics.length)]} to address ${SOLUTION_DESCRIPTIONS[solution].dealDrivers[Math.floor(Math.random() * SOLUTION_DESCRIPTIONS[solution].dealDrivers.length)]}.`
    
    opportunities.push({
      id: `opp-${comm.id}`,
      communication: comm,
      partner,
      customer,
      summary,
      keywords: foundKeywords,
      confidence: Math.min(((partner?.confidence || 0.5) + (customer?.confidence || 0.5)) / 2, 1),
      status: 'new',
      crmAction: Math.random() > 0.5 ? 'create' : 'update',
      existingOpportunityId: Math.random() > 0.5 ? `OPP-${Math.floor(Math.random() * 10000)}` : undefined,
      dealSize: dealSizeMatch ? dealSizeMatch[0] : `$${formatDealSize(user)}`,
      timeline: timelineMatch ? timelineMatch[0] : `${Math.floor(Math.random() * 6 + 3)} months`,
      createdAt: comm.date,
      updatedAt: new Date().toISOString()
    })
  })
  
  return opportunities
}

export function getUserStatsSummary(user: MockUser): string {
  return `${user.name} (${user.role}) - ${user.yearsExperience}yr exp | ${user.communicationPattern.avgMessagesPerDay} msgs/day | ~${user.opportunityProfile.opportunitiesPerMonth} opps/month | ${user.opportunityProfile.conversionRate}% conversion | Avg deal: $${(user.opportunityProfile.avgDealSize.min / 1000000).toFixed(1)}M-$${(user.opportunityProfile.avgDealSize.max / 1000000).toFixed(1)}M`
}
