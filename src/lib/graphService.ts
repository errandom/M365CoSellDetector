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
  private accessToken: string | null = null

  setCurrentUser(user: MockUser): void {
    this.currentUser = user
  }

  private async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      this.accessToken = await authService.getAccessToken()
    }
    return this.accessToken
  }

  private async graphRequest(endpoint: string, options?: RequestInit): Promise<any> {
    const token = await this.getAccessToken()
    const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error: any = new Error(`Graph API request failed: ${response.statusText}`)
      error.statusCode = response.status
      throw error
    }

    return response.json()
  }

  private formatDateForGraph(date: Date): string {
    return date.toISOString()
  }

  async getEmails(startDate: Date, endDate: Date, lastScanDate?: Date): Promise<EmailMessage[]> {
    try {
      const effectiveStartDate = lastScanDate && lastScanDate > startDate ? lastScanDate : startDate
      
      const filter = `receivedDateTime ge ${this.formatDateForGraph(effectiveStartDate)} and receivedDateTime le ${this.formatDateForGraph(endDate)}`
      const select = 'id,subject,from,receivedDateTime,bodyPreview,body'
      
      const response = await this.graphRequest(
        `/me/messages?$filter=${encodeURIComponent(filter)}&$select=${select}&$top=1000`
      )

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
      const effectiveStartDate = lastScanDate && lastScanDate > startDate ? lastScanDate : startDate
      
      const chatsResponse = await this.graphRequest(
        '/me/chats?$select=id,topic,createdDateTime&$top=50'
      )

      const allMessages: ChatMessage[] = []

      for (const chat of chatsResponse.value) {
        try {
          const messagesResponse = await this.graphRequest(
            `/me/chats/${chat.id}/messages?$select=id,from,createdDateTime,body&$top=100`
          )

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
      const effectiveStartDate = lastScanDate && lastScanDate > startDate ? lastScanDate : startDate
      
      const filter = `startDateTime ge ${this.formatDateForGraph(effectiveStartDate)} and startDateTime le ${this.formatDateForGraph(endDate)}`
      
      const meetingsResponse = await this.graphRequest(
        `/me/onlineMeetings?$filter=${encodeURIComponent(filter)}&$select=id,subject,startDateTime&$top=100`
      )

      const transcripts: MeetingTranscript[] = []

      for (const meeting of meetingsResponse.value) {
        try {
          const transcriptsResponse = await this.graphRequest(
            `/me/onlineMeetings/${meeting.id}/transcripts`
          )

          for (const transcript of transcriptsResponse.value) {
            try {
              const contentResponse = await this.graphRequest(
                `/me/onlineMeetings/${meeting.id}/transcripts/${transcript.id}/content`
              )

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
