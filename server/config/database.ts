import type { config as SqlConfig } from 'mssql'

// Parse the ADO.NET connection string into mssql config
// Connection string: Data Source=x6eps4xrq2xudenlfv6naeo3i4-vdopzxbexzxedf5c3idkis2zau.msit-database.fabric.microsoft.com,1433;Initial Catalog="FAST Co-Sell-332b2a2a-bb11-4538-b8cd-8939e0731d4e";Multiple Active Result Sets=False;Connect Timeout=30;Encrypt=True;Trust Server Certificate=False;Authentication=Active Directory Interactive

export interface DatabaseConfig {
  server: string
  port: number
  database: string
  options: {
    encrypt: boolean
    trustServerCertificate: boolean
  }
  connectionTimeout: number
  authentication: {
    type: 'azure-active-directory-default' | 'azure-active-directory-msi-app-service' | 'azure-active-directory-service-principal-secret' | 'azure-active-directory-access-token'
  }
}

// Configuration for Fabric SQL connection
export const databaseConfig: DatabaseConfig = {
  server: process.env.FABRIC_SQL_SERVER || 'x6eps4xrq2xudenlfv6naeo3i4-vdopzxbexzxedf5c3idkis2zau.msit-database.fabric.microsoft.com',
  port: parseInt(process.env.FABRIC_SQL_PORT || '1433'),
  database: process.env.FABRIC_SQL_DATABASE || 'FAST Co-Sell-332b2a2a-bb11-4538-b8cd-8939e0731d4e',
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  connectionTimeout: 30000,
  authentication: {
    // Use DefaultAzureCredential for Azure AD authentication
    // This supports multiple auth methods: environment variables, managed identity, Azure CLI, etc.
    type: 'azure-active-directory-default'
  }
}

// Table names for the Fabric SQL database
export const tables = {
  // MSX data tables (read-only)
  opportunities: 'dbo._Opportunities',
  partnerReferrals: 'dbo._PartnerReferralData',
  
  // Scan results tables (read-write)
  scanSessions: 'dbo.ScanSessions',
  detectedOpportunities: 'dbo.DetectedOpportunities',
  opportunityActions: 'dbo.OpportunityActions',
  scanSchedules: 'dbo.ScanSchedules',
  
  // Views
  scanResultsSummary: 'dbo.vw_ScanResultsSummary',
  partnerOpportunitySummary: 'dbo.vw_PartnerOpportunitySummary'
}
