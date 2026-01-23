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
  private currentUser: MockUser | null = null
  private graphClient: Client | null = null

  setCurrentUser(user: MockUser): void {
    this.currentUser = user
  }

  private async getGraphClient(): Promise<Client> {
    if (!this.graphClient) {
      const token = await authService.getAccessToken()
      this.graphClient = Client.init({
        authProvider: (done) => {
          done(null, token)
        },
      })
    }
    return this.graphClient
  }

  private formatDateForGraph(date: Date): string {
    return date.toISOString()
  }

  async getEmails(startDate: Date, endDate: Date, lastScanDate?: Date): Promise<EmailMessage[]> {
    try {
      const client = await this.getGraphClient()
      const effectiveStartDate = lastScanDate && lastScanDate > startDate ? lastScanDate : startDate
      
      const filter = `receivedDateTime ge ${this.formatDateForGraph(effectiveStartDate)} and receivedDateTime le ${this.formatDateForGraph(endDate)}`
      
      const response = await client
        .api('/me/messages')
        .filter(filter)
        .select('id,subject,from,receivedDateTime,bodyPreview,body')
        .top(1000)
        .get()

      return response.value.map((email: any) => ({
        id: email.id,
        subject: email.subject || '(No Subject)',
        from: email.from?.emailAddress?.address || 'Unknown',
        receivedDateTime: email.receivedDateTime,
        bodyPreview: email.bodyPreview || '',
        body: email.body?.content || email.bodyPreview || ''
      }))
    } catch (error: any) {
      console.error('Error fetching emails from Graph API:', error)
      
      if (error?.statusCode === 401 || error?.code === 'InvalidAuthenticationToken') {
        throw new Error('Authentication expired. Please sign in again.')
      }
      if (error?.statusCode === 403) {
        throw new Error('Insufficient permissions to read emails. Mail.Read permission required.')
      }
      
      throw new Error(`Failed to fetch emails: ${error?.message || 'Unknown error'}`)
    }
  }

  async getChats(startDate: Date, endDate: Date, lastScanDate?: Date): Promise<ChatMessage[]> {
    try {
      const client = await this.getGraphClient()
      const effectiveStartDate = lastScanDate && lastScanDate > startDate ? lastScanDate : startDate
      
      const chatsResponse = await client
        .api('/me/chats')
        .select('id,topic,createdDateTime')
        .top(50)
        .get()

      const allMessages: ChatMessage[] = []

      for (const chat of chatsResponse.value) {
        try {
          const messagesResponse = await client
            .api(`/me/chats/${chat.id}/messages`)
            .select('id,from,createdDateTime,body')
            .top(100)
            .get()

          const filteredMessages = messagesResponse.value
            .filter((msg: any) => {
              const msgDate = new Date(msg.createdDateTime)
              return msgDate >= effectiveStartDate && msgDate <= endDate
            })
            .map((msg: any) => ({
              id: msg.id,
              chatId: chat.id,
              from: msg.from?.user?.displayName || msg.from?.application?.displayName || 'Unknown',
              createdDateTime: msg.createdDateTime,
              body: msg.body?.content || ''
            }))

          allMessages.push(...filteredMessages)
        } catch (chatError) {
          console.warn(`Failed to fetch messages for chat ${chat.id}:`, chatError)
        }
      }

      return allMessages
    } catch (error: any) {
      console.error('Error fetching chats from Graph API:', error)
      
      if (error?.statusCode === 401 || error?.code === 'InvalidAuthenticationToken') {
        throw new Error('Authentication expired. Please sign in again.')
      }
      if (error?.statusCode === 403) {
        throw new Error('Insufficient permissions to read chats. Chat.Read permission required.')
      }
      
      throw new Error(`Failed to fetch chats: ${error?.message || 'Unknown error'}`)
    }
  }

  async getMeetingTranscripts(startDate: Date, endDate: Date, lastScanDate?: Date): Promise<MeetingTranscript[]> {
    try {
      const client = await this.getGraphClient()
      const effectiveStartDate = lastScanDate && lastScanDate > startDate ? lastScanDate : startDate
      
      const filter = `startDateTime ge ${this.formatDateForGraph(effectiveStartDate)} and startDateTime le ${this.formatDateForGraph(endDate)}`
      
      const meetingsResponse = await client
        .api('/me/onlineMeetings')
        .filter(filter)
        .select('id,subject,startDateTime')
        .top(100)
        .get()

      const transcripts: MeetingTranscript[] = []

      for (const meeting of meetingsResponse.value) {
        try {
          const transcriptsResponse = await client
            .api(`/me/onlineMeetings/${meeting.id}/transcripts`)
            .get()

          for (const transcript of transcriptsResponse.value) {
            try {
              const contentResponse = await client
                .api(`/me/onlineMeetings/${meeting.id}/transcripts/${transcript.id}/content`)
                .get()

              transcripts.push({
                id: transcript.id,
                meetingId: meeting.id,
                createdDateTime: transcript.createdDateTime,
                content: contentResponse
              })
            } catch (contentError) {
              console.warn(`Failed to fetch transcript content for ${transcript.id}:`, contentError)
            }
          }
        } catch (transcriptError) {
          console.warn(`Failed to fetch transcripts for meeting ${meeting.id}:`, transcriptError)
        }
      }

      return transcripts
    } catch (error: any) {
      console.error('Error fetching meeting transcripts from Graph API:', error)
      
      if (error?.statusCode === 401 || error?.code === 'InvalidAuthenticationToken') {
        throw new Error('Authentication expired. Please sign in again.')
      }
      if (error?.statusCode === 403) {
        console.warn('Insufficient permissions for meeting transcripts. OnlineMeetings.Read permission required.')
        return []
      }
      
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
}

export const graphService = new GraphService()
