import { Client } from '@microsoft/microsoft-graph-client'
import { authService } from './authService'
import type { CommunicationType } from './types'
import type { MockUser } from './mockUsers'
import { generateCommunicationsForUser } from './mockDataGenerator'

export interface EmailMessage {
  id: string
  subject: string
  from: string
  receivedDateTime: string
  bodyPreview: string
  body: string
}

export interface ChatMessage {
  id: string
  from: string
  createdDateTime: string
  body: string
  chatId: string
}

export interface MeetingTranscript {
  id: string
  meetingId: string
  createdDateTime: string
  content: string
}

class GraphService {
  private client: Client | null = null
  private currentUser: MockUser | null = null

  setCurrentUser(user: MockUser): void {
    this.currentUser = user
  }

  private async getClient(): Promise<Client> {
    if (!this.client) {
      const accessToken = await authService.getAccessToken()
      this.client = Client.init({
        authProvider: (done) => {
          done(null, accessToken)
        },
      })
    }
    return this.client
  }

  async getEmails(startDate: Date, endDate: Date, lastScanDate?: Date): Promise<EmailMessage[]> {
    try {
      if (!this.currentUser) {
        throw new Error('No user set for mock data generation')
      }
      
      if (!this.currentUser.opportunityProfile) {
        console.error('User missing opportunityProfile:', this.currentUser)
        throw new Error('User data is incomplete - missing opportunityProfile')
      }

      const communications = generateCommunicationsForUser(this.currentUser)
      const emails = communications.filter(c => c.type === 'email')
      
      const effectiveStartDate = lastScanDate && lastScanDate > startDate ? lastScanDate : startDate
      
      return emails
        .filter(email => {
          const emailDate = new Date(email.date)
          return emailDate >= effectiveStartDate && emailDate <= endDate
        })
        .map(email => ({
          id: email.id,
          subject: email.subject,
          from: email.from,
          receivedDateTime: email.date,
          bodyPreview: email.preview,
          body: email.content
        }))
    } catch (error) {
      console.error('Error fetching emails:', error)
      throw new Error('Failed to fetch emails. Please check your permissions.')
    }
  }

  async getChats(startDate: Date, endDate: Date, lastScanDate?: Date): Promise<ChatMessage[]> {
    try {
      if (!this.currentUser) {
        throw new Error('No user set for mock data generation')
      }
      
      if (!this.currentUser.opportunityProfile) {
        console.error('User missing opportunityProfile:', this.currentUser)
        throw new Error('User data is incomplete - missing opportunityProfile')
      }

      const communications = generateCommunicationsForUser(this.currentUser)
      const chats = communications.filter(c => c.type === 'chat')
      
      const effectiveStartDate = lastScanDate && lastScanDate > startDate ? lastScanDate : startDate
      
      return chats
        .filter(chat => {
          const chatDate = new Date(chat.date)
          return chatDate >= effectiveStartDate && chatDate <= endDate
        })
        .map(chat => ({
          id: chat.id,
          chatId: `chat-${Math.random().toString(36).substr(2, 9)}`,
          from: chat.from,
          createdDateTime: chat.date,
          body: chat.content
        }))
    } catch (error) {
      console.error('Error fetching chats:', error)
      throw new Error('Failed to fetch chats. Please check your permissions.')
    }
  }

  async getMeetingTranscripts(startDate: Date, endDate: Date, lastScanDate?: Date): Promise<MeetingTranscript[]> {
    try {
      if (!this.currentUser) {
        throw new Error('No user set for mock data generation')
      }
      
      if (!this.currentUser.opportunityProfile) {
        console.error('User missing opportunityProfile:', this.currentUser)
        throw new Error('User data is incomplete - missing opportunityProfile')
      }

      const communications = generateCommunicationsForUser(this.currentUser)
      const meetings = communications.filter(c => c.type === 'meeting')
      
      const effectiveStartDate = lastScanDate && lastScanDate > startDate ? lastScanDate : startDate
      
      return meetings
        .filter(meeting => {
          const meetingDate = new Date(meeting.date)
          return meetingDate >= effectiveStartDate && meetingDate <= endDate
        })
        .map(meeting => ({
          id: meeting.id,
          meetingId: `meeting-${Math.random().toString(36).substr(2, 9)}`,
          createdDateTime: meeting.date,
          content: meeting.content
        }))
    } catch (error) {
      console.error('Error fetching meeting transcripts:', error)
      return []
    }
  }

  async scanCommunications(
    startDate: Date,
    endDate: Date,
    sources: CommunicationType[],
    keywords: string[],
    lastScanDates?: { email?: Date; chat?: Date; meeting?: Date }
  ): Promise<{
    emails: EmailMessage[]
    chats: ChatMessage[]
    transcripts: MeetingTranscript[]
  }> {
    const results = {
      emails: [] as EmailMessage[],
      chats: [] as ChatMessage[],
      transcripts: [] as MeetingTranscript[],
    }

    const keywordRegex = new RegExp(keywords.join('|'), 'gi')

    if (sources.includes('email')) {
      const emails = await this.getEmails(startDate, endDate, lastScanDates?.email)
      results.emails = emails.filter(
        (email) =>
          keywordRegex.test(email.subject) ||
          keywordRegex.test(email.body) ||
          keywordRegex.test(email.bodyPreview)
      )
    }

    if (sources.includes('chat')) {
      const chats = await this.getChats(startDate, endDate, lastScanDates?.chat)
      results.chats = chats.filter((chat) => keywordRegex.test(chat.body))
    }

    if (sources.includes('meeting')) {
      const transcripts = await this.getMeetingTranscripts(startDate, endDate, lastScanDates?.meeting)
      results.transcripts = transcripts.filter((transcript) =>
        keywordRegex.test(transcript.content)
      )
    }

    return results
  }

  clearClient(): void {
    this.client = null
  }
}

export const graphService = new GraphService()
