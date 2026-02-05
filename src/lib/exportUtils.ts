import * as XLSX from 'xlsx'
import type { DetectedOpportunity, OpportunityStatus, CommunicationType, ExportTemplate } from './types'

export interface ExportFilters {
  status: OpportunityStatus[]
  communicationType: CommunicationType[]
  dateFrom?: Date
  dateTo?: Date
  minConfidence?: number
  partners?: string[]
  customers?: string[]
}

export interface ExportColumn {
  field: keyof ExportData
  label: string
  enabled: boolean
}

interface ExportData {
  id: string
  status: string
  partner: string
  customer: string
  communicationType: string
  subject: string
  date: string
  summary: string
  confidence: string
  crmAction: string
  dealSize: string
  timeline: string
  keywords: string
  existingOpportunityId: string
  from: string
}

export const defaultColumns: ExportColumn[] = [
  { field: 'id', label: 'Opportunity ID', enabled: true },
  { field: 'status', label: 'Status', enabled: true },
  { field: 'partner', label: 'Partner', enabled: true },
  { field: 'customer', label: 'Customer', enabled: true },
  { field: 'communicationType', label: 'Source Type', enabled: true },
  { field: 'subject', label: 'Subject', enabled: true },
  { field: 'date', label: 'Date', enabled: true },
  { field: 'summary', label: 'Summary', enabled: true },
  { field: 'confidence', label: 'Confidence', enabled: true },
  { field: 'crmAction', label: 'CRM Action', enabled: true },
  { field: 'dealSize', label: 'Deal Size', enabled: false },
  { field: 'timeline', label: 'Timeline', enabled: false },
  { field: 'keywords', label: 'Keywords', enabled: false },
  { field: 'existingOpportunityId', label: 'Existing Opp ID', enabled: false },
  { field: 'from', label: 'From', enabled: false },
]

export const defaultTemplates: ExportTemplate[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level overview with confirmed and synced opportunities only',
    isDefault: true,
    filters: {
      status: ['confirmed', 'synced'],
      communicationType: [],
      minConfidence: 0.7,
    },
    columns: ['status', 'partner', 'customer', 'dealSize', 'timeline', 'confidence'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'detailed-audit',
    name: 'Detailed Audit Report',
    description: 'Complete data export with all fields for auditing and analysis',
    filters: {
      status: [],
      communicationType: [],
      minConfidence: 0,
    },
    columns: ['id', 'status', 'partner', 'customer', 'communicationType', 'subject', 'date', 'summary', 'confidence', 'crmAction', 'dealSize', 'timeline', 'keywords', 'existingOpportunityId', 'from'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'partner-report',
    name: 'Partner Performance Report',
    description: 'Focus on partner relationships and collaboration patterns',
    filters: {
      status: ['confirmed', 'synced'],
      communicationType: [],
      minConfidence: 0,
    },
    columns: ['partner', 'customer', 'communicationType', 'date', 'dealSize', 'timeline', 'crmAction'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'review-queue',
    name: 'Review Queue',
    description: 'New and pending opportunities requiring review',
    filters: {
      status: ['new', 'review'],
      communicationType: [],
      minConfidence: 0,
    },
    columns: ['status', 'partner', 'customer', 'communicationType', 'subject', 'date', 'summary', 'confidence'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'email-opportunities',
    name: 'Email-Based Opportunities',
    description: 'Opportunities detected from email communications only',
    filters: {
      status: [],
      communicationType: ['email'],
      minConfidence: 0,
    },
    columns: ['partner', 'customer', 'subject', 'date', 'from', 'summary', 'confidence', 'status'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'meeting-insights',
    name: 'Meeting Insights Report',
    description: 'Opportunities from Teams meetings and transcripts',
    filters: {
      status: [],
      communicationType: ['meeting'],
      minConfidence: 0,
    },
    columns: ['partner', 'customer', 'subject', 'date', 'summary', 'keywords', 'confidence', 'status'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export function applyFilters(
  opportunities: DetectedOpportunity[],
  filters: ExportFilters
): DetectedOpportunity[] {
  return opportunities.filter(opp => {
    if (filters.status.length > 0 && !filters.status.includes(opp.status)) {
      return false
    }

    if (filters.communicationType.length > 0 && !filters.communicationType.includes(opp.communication.type)) {
      return false
    }

    if (filters.dateFrom) {
      const oppDate = new Date(opp.communication.date)
      if (oppDate < filters.dateFrom) return false
    }

    if (filters.dateTo) {
      const oppDate = new Date(opp.communication.date)
      if (oppDate > filters.dateTo) return false
    }

    if (filters.minConfidence !== undefined && opp.confidence < filters.minConfidence) {
      return false
    }

    if (filters.partners && filters.partners.length > 0) {
      if (!opp.partner || !filters.partners.includes(opp.partner.name)) {
        return false
      }
    }

    if (filters.customers && filters.customers.length > 0) {
      if (!opp.customer || !filters.customers.includes(opp.customer.name)) {
        return false
      }
    }

    return true
  })
}

export function prepareExportData(
  opportunities: DetectedOpportunity[],
  columns: ExportColumn[]
): any[] {
  const enabledColumns = columns.filter(col => col.enabled)
  
  return opportunities.map(opp => {
    const row: any = {}
    
    enabledColumns.forEach(col => {
      switch (col.field) {
        case 'id':
          row[col.label] = opp.id
          break
        case 'status':
          row[col.label] = opp.status.charAt(0).toUpperCase() + opp.status.slice(1)
          break
        case 'partner':
          row[col.label] = opp.partner?.name || 'N/A'
          break
        case 'customer':
          row[col.label] = opp.customer?.name || 'N/A'
          break
        case 'communicationType':
          row[col.label] = opp.communication.type.charAt(0).toUpperCase() + opp.communication.type.slice(1)
          break
        case 'subject':
          row[col.label] = opp.communication.subject
          break
        case 'date':
          row[col.label] = new Date(opp.communication.date).toLocaleString()
          break
        case 'summary':
          row[col.label] = opp.summary
          break
        case 'confidence':
          row[col.label] = `${Math.round(opp.confidence * 100)}%`
          break
        case 'crmAction':
          row[col.label] = opp.crmAction.charAt(0).toUpperCase() + opp.crmAction.slice(1)
          break
        case 'dealSize':
          row[col.label] = opp.dealSize || 'N/A'
          break
        case 'timeline':
          row[col.label] = opp.timeline || 'N/A'
          break
        case 'keywords':
          row[col.label] = opp.keywords.join(', ')
          break
        case 'existingOpportunityId':
          row[col.label] = opp.existingOpportunityId || 'N/A'
          break
        case 'from':
          row[col.label] = opp.communication.from
          break
      }
    })
    
    return row
  })
}

export function exportToExcel(
  opportunities: DetectedOpportunity[],
  filters: ExportFilters,
  columns: ExportColumn[],
  filename: string = 'co-sell-opportunities.xlsx'
): void {
  const filteredOpportunities = applyFilters(opportunities, filters)
  const exportData = prepareExportData(filteredOpportunities, columns)

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  
  const columnWidths = columns.filter(col => col.enabled).map(() => ({ wch: 20 }))
  worksheet['!cols'] = columnWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Opportunities')

  const summaryData = [
    { Metric: 'Partner Engagements', Value: filteredOpportunities.length },
    { Metric: 'New', Value: filteredOpportunities.filter(o => o.status === 'new').length },
    { Metric: 'In Review', Value: filteredOpportunities.filter(o => o.status === 'review').length },
    { Metric: 'Confirmed', Value: filteredOpportunities.filter(o => o.status === 'confirmed').length },
    { Metric: 'Synced to MSX', Value: filteredOpportunities.filter(o => o.status === 'synced').length },
    { Metric: 'Rejected', Value: filteredOpportunities.filter(o => o.status === 'rejected').length },
    { Metric: 'Export Date', Value: new Date().toLocaleString() },
  ]

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  XLSX.writeFile(workbook, filename)
}

export function getUniquePartners(opportunities: DetectedOpportunity[]): string[] {
  const partners = new Set<string>()
  opportunities.forEach(opp => {
    if (opp.partner) {
      partners.add(opp.partner.name)
    }
  })
  return Array.from(partners).sort()
}

export function getUniqueCustomers(opportunities: DetectedOpportunity[]): string[] {
  const customers = new Set<string>()
  opportunities.forEach(opp => {
    if (opp.customer) {
      customers.add(opp.customer.name)
    }
  })
  return Array.from(customers).sort()
}

export function applyTemplate(template: ExportTemplate): { filters: ExportFilters; columns: ExportColumn[] } {
  const filters: ExportFilters = {
    status: template.filters.status,
    communicationType: template.filters.communicationType,
    minConfidence: template.filters.minConfidence,
  }

  const columns = defaultColumns.map(col => ({
    ...col,
    enabled: template.columns.includes(col.field),
  }))

  return { filters, columns }
}

export function createTemplateFromCurrent(
  name: string,
  description: string,
  filters: ExportFilters,
  columns: ExportColumn[]
): Omit<ExportTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name,
    description,
    filters: {
      status: filters.status,
      communicationType: filters.communicationType,
      minConfidence: filters.minConfidence,
    },
    columns: columns.filter(col => col.enabled).map(col => col.field),
  }
}
