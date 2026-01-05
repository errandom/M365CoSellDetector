import { Client } from '@microsoft/microsoft-graph-client'
import { authService } from './authService'
import type { CommunicationType } from './types'

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
      const client = await this.getClient()
      const effectiveStartDate = lastScanDate && lastScanDate > startDate ? lastScanDate : startDate
      const startISO = effectiveStartDate.toISOString()
      const endISO = endDate.toISOString()
      
      const response = await client
        .api('/me/messages')
        .filter(`receivedDateTime ge ${startISO} and receivedDateTime le ${endISO}`)
        .select('id,subject,from,receivedDateTime,bodyPreview,body')
        .top(100)
        .get()

      return response.value.map((msg: any) => ({
        id: msg.id,
        subject: msg.subject || '(No Subject)',
        from: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || 'Unknown',
        receivedDateTime: msg.receivedDateTime,
        bodyPreview: msg.bodyPreview || '',
        body: msg.body?.content || msg.bodyPreview || '',
      }))
    } catch (error) {
      console.error('Error fetching emails:', error)
      throw new Error('Failed to fetch emails. Please check your permissions.')
    }
  }

  async getChats(startDate: Date, endDate: Date, lastScanDate?: Date): Promise<ChatMessage[]> {
    try {
      const client = await this.getClient()
      const effectiveStartDate = lastScanDate && lastScanDate > startDate ? lastScanDate : startDate
      
      const chatsResponse = await client
        .api('/me/chats')
        .top(50)
        .get()

      const allMessages: ChatMessage[] = []

      for (const chat of chatsResponse.value) {
        try {
          const messagesResponse = await client
            .api(`/me/chats/${chat.id}/messages`)
            .top(50)
            .get()

          for (const msg of messagesResponse.value) {
            const msgDate = new Date(msg.createdDateTime)
            if (msgDate >= effectiveStartDate && msgDate <= endDate) {
              allMessages.push({
                id: msg.id,
                chatId: chat.id,
                from: msg.from?.user?.displayName || 'Unknown',
                createdDateTime: msg.createdDateTime,
                body: msg.body?.content || '',
              })
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch messages for chat ${chat.id}:`, error)
        }
      }

      return allMessages
    } catch (error) {
      console.error('Error fetching chats:', error)
      throw new Error('Failed to fetch chats. Please check your permissions.')
    }
  }

  async getMeetingTranscripts(startDate: Date, endDate: Date, lastScanDate?: Date): Promise<MeetingTranscript[]> {
    try {
      const client = await this.getClient()
      const effectiveStartDate = lastScanDate && lastScanDate > startDate ? lastScanDate : startDate
      
      const meetingsResponse = await client
        .api('/me/onlineMeetings')
        .filter(`startDateTime ge ${effectiveStartDate.toISOString()} and endDateTime le ${endDate.toISOString()}`)
        .top(50)
        .get()

      const transcripts: MeetingTranscript[] = []

      for (const meeting of meetingsResponse.value) {
        try {
          const transcriptsResponse = await client
            .api(`/me/onlineMeetings/${meeting.id}/transcripts`)
            .get()

          for (const transcript of transcriptsResponse.value) {
            const contentResponse = await client
              .api(`/me/onlineMeetings/${meeting.id}/transcripts/${transcript.id}/content`)
              .get()

            transcripts.push({
              id: transcript.id,
              meetingId: meeting.id,
              createdDateTime: transcript.createdDateTime,
              content: contentResponse,
            })
          }
        } catch (error) {
          console.warn(`Failed to fetch transcripts for meeting ${meeting.id}:`, error)
        }
      }

      return transcripts
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
