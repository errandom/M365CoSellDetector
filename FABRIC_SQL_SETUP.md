# Fabric SQL Database Integration

This document describes how to connect the M365 Co-Sell Detector application to your Microsoft Fabric SQL database.

## Overview

The application connects to a Microsoft Fabric SQL database for two purposes:

### Reading MSX Data (Existing Tables)
- `dbo._Opportunities` - All opportunities with partner referrals
- `dbo._PartnerReferralData` - Partner referral/engagement data

### Storing Scan Results (New Tables - Must Be Created)
- `dbo.ScanSessions` - Metadata about each scan run
- `dbo.DetectedOpportunities` - Opportunities detected during scans
- `dbo.OpportunityActions` - Audit log of actions taken
- `dbo.ScanSchedules` - Scheduled scan configurations

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────┐
│   React App     │ ───► │  Express API    │ ───► │  Fabric SQL         │
│   (Frontend)    │      │  (Backend)      │      │  (Database)         │
│   Port 5000     │      │  Port 3001      │      │  .fabric.microsoft  │
└─────────────────┘      └─────────────────┘      └─────────────────────┘
```

The backend API server handles:
- Azure AD authentication to the SQL database
- Query construction and execution
- Data transformation and API responses

## Setup Instructions

### 1. Install Server Dependencies

```bash
# From the project root
npm run setup:server

# Or manually
cd server && npm install
```

### 2. Configure Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your database configuration:

```env
# Server port
SERVER_PORT=3001

# Fabric SQL Connection (pre-configured from your connection string)
FABRIC_SQL_SERVER=x6eps4xrq2xudenlfv6naeo3i4-vdopzxbexzxedf5c3idkis2zau.msit-database.fabric.microsoft.com
FABRIC_SQL_PORT=1433
FABRIC_SQL_DATABASE=FAST Co-Sell-332b2a2a-bb11-4538-b8cd-8939e0731d4e

# Frontend API URL
VITE_API_URL=http://localhost:3001/api
```

### 3. Azure AD Authentication

The server uses Azure Identity's `DefaultAzureCredential` for authentication, which supports multiple methods:

#### Option A: Azure CLI (Development)

```bash
# Log in to Azure CLI with a user that has access to the database
az login
```

#### Option B: Service Principal (Production)

Set these environment variables:

```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

#### Option C: Managed Identity (Azure Hosting)

When deployed to Azure App Service or other Azure compute with managed identity enabled, authentication is automatic.

### 4. Database Permissions

Ensure your Azure AD identity has the following permissions on the Fabric SQL database:

```sql
-- Grant read access to existing MSX tables
GRANT SELECT ON dbo._Opportunities TO [your-identity];
GRANT SELECT ON dbo._PartnerReferralData TO [your-identity];

-- Grant full access to scan results tables (after creating them)
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.ScanSessions TO [your-identity];
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.DetectedOpportunities TO [your-identity];
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.OpportunityActions TO [your-identity];
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.ScanSchedules TO [your-identity];
GRANT SELECT ON dbo.vw_ScanResultsSummary TO [your-identity];
GRANT SELECT ON dbo.vw_PartnerOpportunitySummary TO [your-identity];
```

### 5. Create Scan Results Tables

Before using the scan results feature, run the SQL migration script to create the required tables:

```bash
# The script is located at:
# server/sql/scan_results_schema.sql

# Run it in your Fabric SQL database using Azure Data Studio, SSMS, or the Fabric portal
```

This creates:
- **ScanSessions** - Stores scan metadata (when, who, what was scanned)
- **DetectedOpportunities** - Stores each detected opportunity with AI analysis
- **OpportunityActions** - Audit log of all user actions
- **ScanSchedules** - For future scheduled scan configurations
- **Views** - Summary views for dashboard and reporting

### 6. Start the Server

```bash
# Development mode with hot reload
npm run dev:server

# Or start both frontend and backend together
npm run dev:full
```

## API Endpoints

The backend server exposes the following REST endpoints:

### Health Check
- `GET /api/health` - Check server status

### Opportunities
- `GET /api/opportunities` - List all opportunities (with filtering)
- `GET /api/opportunities/:id` - Get single opportunity by ID
- `GET /api/opportunities/:id/referrals` - Get referrals for an opportunity
- `GET /api/opportunities-with-referrals` - Get opportunities with their referrals

### Partner Referrals
- `GET /api/referrals` - List all partner referrals (with filtering)
- `GET /api/referrals/:id` - Get single referral by ID

### Dashboard
- `GET /api/dashboard/metrics` - Get aggregated dashboard metrics

### Search
- `GET /api/search?q=query` - Search across opportunities and referrals

### Scan Results (Write Operations)

#### Scan Sessions
- `POST /api/scans` - Create a new scan session
- `GET /api/scans` - List all scan sessions
- `GET /api/scans/summary` - Get scan results summary
- `GET /api/scans/:id` - Get a specific scan session
- `GET /api/scans/:id/complete` - Get scan with all opportunities
- `PUT /api/scans/:id/complete` - Mark scan as completed
- `DELETE /api/scans/:id` - Delete a scan session

#### Detected Opportunities
- `POST /api/scans/:id/opportunities` - Add opportunity to scan
- `POST /api/scans/:id/opportunities/batch` - Bulk add opportunities
- `GET /api/scans/:id/opportunities` - Get scan's opportunities
- `GET /api/detected-opportunities` - List with filtering
- `GET /api/detected-opportunities/:id` - Get specific opportunity
- `PUT /api/detected-opportunities/:id/review` - Update review status
- `PUT /api/detected-opportunities/:id/sync` - Update sync status
- `PUT /api/detected-opportunities/bulk-review` - Bulk update status
- `GET /api/detected-opportunities/:id/actions` - Get action history

#### Complete Workflow
- `POST /api/scans/complete` - Save full scan result in one call

### Query Parameters

Most list endpoints support these query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `partnerId` | string | Filter by partner ID |
| `customerId` | string | Filter by customer ID |
| `status` | string | Filter by opportunity status |
| `fromDate` | ISO date | Filter from date |
| `toDate` | ISO date | Filter to date |
| `searchText` | string | Full-text search |
| `limit` | number | Max results to return |

## Frontend Integration

### Using the Fabric Data Hook

```tsx
import { useFabricData } from '@/lib/useFabricData'

function MyComponent() {
  const { 
    isAvailable, 
    dataSource, 
    opportunities, 
    fetchOpportunities,
    dashboardMetrics,
    fetchDashboardMetrics 
  } = useFabricData()

  useEffect(() => {
    if (isAvailable) {
      fetchOpportunities({ limit: 50 })
    }
  }, [isAvailable])

  // Render opportunities...
}
```

### Direct Service Usage

```tsx
import { fabricDatabaseService } from '@/lib/fabricDatabaseService'

// Get opportunities
const opportunities = await fabricDatabaseService.getOpportunities({
  fromDate: new Date('2024-01-01'),
  status: 'active'
})

// Get dashboard metrics
const metrics = await fabricDatabaseService.getDashboardMetrics()

// Search
const results = await fabricDatabaseService.search('Contoso')
```

### Saving Scan Results

```tsx
import { scanResultsService } from '@/lib/scanResultsService'
import { 
  createScanSessionInput, 
  detectedOpportunitiesToDbInputs 
} from '@/lib/scanResultsAdapter'

// After performing a scan with detected opportunities...
const detectedOpportunities: DetectedOpportunity[] = [...] // from scan

// Convert and save to database
const sessionInput = createScanSessionInput({
  name: 'Daily Partner Scan',
  scanType: 'manual',
  dateRange: { from: new Date('2026-01-01'), to: new Date() },
  sources: ['email', 'chat', 'meeting'],
  keywords: ['co-sell', 'partner', 'referral'],
  user: {
    id: 'user-azure-ad-id',
    email: 'user@microsoft.com',
    name: 'John Doe'
  }
})

const opportunityInputs = detectedOpportunitiesToDbInputs(detectedOpportunities)

// Save everything in one call
const result = await scanResultsService.saveCompleteScanResult(
  sessionInput,
  opportunityInputs,
  totalCommunicationsScanned
)

console.log(`Saved ${result.opportunities.length} opportunities`)
```

### Updating Opportunity Status

```tsx
import { scanResultsService } from '@/lib/scanResultsService'

// Confirm an opportunity
await scanResultsService.updateOpportunityReview(
  'opportunity-id',
  'confirmed',
  'user-id',
  'user@example.com',
  'Verified with partner'
)

// Mark as synced to CRM
await scanResultsService.updateOpportunitySync(
  'opportunity-id',
  'synced',
  'MSX-OPP-12345'
)

// Bulk update multiple opportunities
await scanResultsService.bulkUpdateReviewStatus(
  ['opp-1', 'opp-2', 'opp-3'],
  'confirmed',
  'user-id',
  'user@example.com'
)
```

### Retrieving Scan History

```tsx
import { scanResultsService } from '@/lib/scanResultsService'

// Get recent scans
const scans = await scanResultsService.getScanSessions({ limit: 10 })

// Get scan summary with statistics
const summaries = await scanResultsService.getScanResultsSummary(20)

// Get complete scan with all opportunities
const fullResult = await scanResultsService.getCompleteScanResult('scan-id')

// Get pending opportunities
const pending = await scanResultsService.getDetectedOpportunities({
  reviewStatus: 'pending',
  minConfidence: 0.7
})
```

## Database Schema Mapping

The types in `server/types/fabricTypes.ts` define the expected schema. If your actual column names differ, update the following files:

1. `server/types/fabricTypes.ts` - Type definitions
2. `server/services/databaseService.ts` - Query column references
3. `src/lib/fabricDataAdapter.ts` - Frontend field mappings

### Expected Table Schemas

#### dbo._Opportunities

| Column | Type | Description |
|--------|------|-------------|
| OpportunityId | varchar | Primary key |
| OpportunityName | varchar | Opportunity name |
| CustomerId | varchar | Customer identifier |
| CustomerName | varchar | Customer company name |
| PartnerId | varchar | Partner identifier |
| PartnerName | varchar | Partner company name |
| EstimatedRevenue | decimal | Deal value |
| Status | varchar | Current status |
| CreatedDate | datetime | Creation timestamp |
| ... | ... | See fabricTypes.ts for full schema |

#### dbo._PartnerReferralData

| Column | Type | Description |
|--------|------|-------------|
| ReferralId | varchar | Primary key |
| OpportunityId | varchar | FK to Opportunities |
| PartnerId | varchar | Partner identifier |
| ReferralStatus | varchar | Referral status |
| EstimatedDealValue | decimal | Expected deal value |
| CreatedDate | datetime | Creation timestamp |
| ... | ... | See fabricTypes.ts for full schema |

### Scan Results Tables (Created by Migration)

#### dbo.ScanSessions

| Column | Type | Description |
|--------|------|-------------|
| ScanId | uniqueidentifier | Primary key |
| ScanType | nvarchar(50) | 'manual', 'scheduled', 'incremental' |
| ScanDateRangeStart | datetime2 | Start of scanned date range |
| ScanDateRangeEnd | datetime2 | End of scanned date range |
| SourcesScanned | nvarchar(100) | Comma-separated: 'email,chat,meeting' |
| OpportunitiesDetected | int | Count of detected opportunities |
| ScannedByUserEmail | nvarchar(255) | User who ran the scan |
| ScanStatus | nvarchar(50) | 'in_progress', 'completed', 'failed' |
| ScanStartedAt | datetime2 | When scan started |
| ScanCompletedAt | datetime2 | When scan completed |

#### dbo.DetectedOpportunities

| Column | Type | Description |
|--------|------|-------------|
| DetectedOpportunityId | uniqueidentifier | Primary key |
| ScanId | uniqueidentifier | FK to ScanSessions |
| CommunicationId | nvarchar(255) | Source communication ID |
| CommunicationType | nvarchar(50) | 'email', 'chat', 'meeting' |
| PartnerName | nvarchar(255) | Detected partner name |
| CustomerName | nvarchar(255) | Detected customer name |
| OverallConfidence | decimal(5,4) | AI confidence score (0-1) |
| ReviewStatus | nvarchar(50) | 'pending', 'confirmed', 'rejected', 'synced' |
| SyncStatus | nvarchar(50) | 'not_synced', 'synced', 'failed' |
| SyncedToOpportunityId | nvarchar(255) | MSX Opportunity ID after sync |

#### dbo.OpportunityActions

| Column | Type | Description |
|--------|------|-------------|
| ActionId | uniqueidentifier | Primary key |
| DetectedOpportunityId | uniqueidentifier | FK to DetectedOpportunities |
| ActionType | nvarchar(50) | 'created', 'confirmed', 'rejected', 'synced', etc. |
| ActionByUserEmail | nvarchar(255) | User who performed action |
| ActionAt | datetime2 | When action occurred |

## Troubleshooting

### Connection Issues

1. **Authentication errors**: Ensure Azure CLI login is fresh (`az login`)
2. **Firewall issues**: Add your IP to the Fabric SQL firewall rules
3. **Permission denied**: Verify your identity has SELECT access to the tables

### Schema Mismatch

If you see errors about missing columns:

1. Query your actual table schema:
   ```sql
   SELECT COLUMN_NAME, DATA_TYPE 
   FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_NAME = '_Opportunities'
   ```

2. Update the type definitions in `server/types/fabricTypes.ts`

3. Update queries in `server/services/databaseService.ts`

### CORS Errors

The server is configured to accept requests from these origins:
- `http://localhost:5000`
- `http://localhost:5173`
- `http://localhost:3000`

Add additional origins in `server/index.ts` if needed.

## Production Deployment

For production deployment:

1. Build the server:
   ```bash
   npm run build:all
   ```

2. Set environment variables in your hosting environment

3. Use a Service Principal or Managed Identity for authentication

4. Configure CORS for your production domain

5. Start the server:
   ```bash
   npm run server
   ```

## Security Considerations

- Never commit `.env` files with secrets to version control
- Use Service Principal or Managed Identity in production
- Implement rate limiting for public deployments
- Consider adding API authentication for the backend endpoints
- Review and restrict database permissions to minimum required
