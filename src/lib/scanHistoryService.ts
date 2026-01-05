import type { CommunicationType } from './types'

export interface ScanHistory {
  lastScanBySource: {
    email?: string
    chat?: string
    meeting?: string
  }
  lastFullScan?: string
}

class ScanHistoryService {
  private readonly STORAGE_KEY = 'scan-history'

  async getLastScanDate(source: CommunicationType): Promise<Date | null> {
    try {
      const history = await window.spark.kv.get<ScanHistory>(this.STORAGE_KEY)
      if (!history?.lastScanBySource?.[source]) {
        return null
      }
      return new Date(history.lastScanBySource[source]!)
    } catch (error) {
      console.error('Error getting last scan date:', error)
      return null
    }
  }

  async getLastFullScanDate(): Promise<Date | null> {
    try {
      const history = await window.spark.kv.get<ScanHistory>(this.STORAGE_KEY)
      if (!history?.lastFullScan) {
        return null
      }
      return new Date(history.lastFullScan)
    } catch (error) {
      console.error('Error getting last full scan date:', error)
      return null
    }
  }

  async updateScanDate(source: CommunicationType, date: Date): Promise<void> {
    try {
      const history = await window.spark.kv.get<ScanHistory>(this.STORAGE_KEY) || {
        lastScanBySource: {}
      }
      
      history.lastScanBySource[source] = date.toISOString()
      
      await window.spark.kv.set(this.STORAGE_KEY, history)
    } catch (error) {
      console.error('Error updating scan date:', error)
    }
  }

  async updateFullScanDate(date: Date): Promise<void> {
    try {
      const history = await window.spark.kv.get<ScanHistory>(this.STORAGE_KEY) || {
        lastScanBySource: {}
      }
      
      history.lastFullScan = date.toISOString()
      
      await window.spark.kv.set(this.STORAGE_KEY, history)
    } catch (error) {
      console.error('Error updating full scan date:', error)
    }
  }

  async getScanHistory(): Promise<ScanHistory> {
    try {
      const history = await window.spark.kv.get<ScanHistory>(this.STORAGE_KEY)
      return history || { lastScanBySource: {} }
    } catch (error) {
      console.error('Error getting scan history:', error)
      return { lastScanBySource: {} }
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await window.spark.kv.delete(this.STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing scan history:', error)
    }
  }
}

export const scanHistoryService = new ScanHistoryService()
