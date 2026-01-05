# Microsoft Graph API Integration - Implementation Summary

## What Was Integrated

This update replaces the mock data system with a complete Microsoft Graph API integration that connects to real Microsoft 365 data.

### New Packages Installed

1. **@azure/msal-browser** - Microsoft Authentication Library for browser-based OAuth 2.0 authentication
2. **@microsoft/microsoft-graph-client** - Official Microsoft Graph API client for JavaScript

### New Files Created

#### Authentication & Configuration

1. **src/lib/msalConfig.ts**
   - MSAL configuration for Azure AD authentication
   - Defines required scopes (Mail.Read, Chat.Read, OnlineMeetings.Read, CallRecords.Read)
   - Configurable via environment variables

2. **src/lib/authService.ts**
   - Authentication service wrapper around MSAL
   - Handles login/logout flows
   - Manages access token retrieval and refresh
   - Provides account information

3. **src/components/AuthGuard.tsx**
   - React component that guards the app behind authentication
   - Shows sign-in UI when not authenticated
   - Displays user account info with sign-out option
   - Handles authentication errors gracefully

#### Microsoft Graph Integration

4. **src/lib/graphService.ts**
   - Service for making Microsoft Graph API calls
   - Methods to fetch:
     - Emails from Outlook (`/me/messages`)
     - Teams chat messages (`/me/chats` and `/me/chats/{id}/messages`)
     - Meeting transcripts (`/me/onlineMeetings/{id}/transcripts`)
   - Includes keyword filtering on fetched data
   - Handles API errors and permission issues

5. **src/lib/opportunityDetectionService.ts**
   - Integrates Graph API data with AI analysis
   - Processes emails, chats, and transcripts from Graph API
   - Uses Spark LLM API (GPT-4o-mini) to:
     - Extract partner company names
     - Extract customer company names
     - Generate conversation summaries
   - Calculates confidence scores based on keyword matches and entity extraction

#### Documentation

6. **GRAPH_API_SETUP.md**
   - Comprehensive guide for Azure AD app registration
   - Step-by-step permission configuration
   - Troubleshooting common issues
   - Security and privacy explanations

7. **.env.example**
   - Template for environment variables
   - Instructions for obtaining Azure AD credentials
   - Required configuration values

8. **README.md** (Updated)
   - Complete usage guide
   - Architecture overview
   - Troubleshooting section
   - Security and privacy information

### Modified Files

1. **src/App.tsx**
   - Wrapped in `<AuthGuard>` component
   - Updated scan handler to use `detectOpportunitiesFromGraphData`
   - Added error handling for Graph API failures
   - Displays user authentication status

2. **src/components/ScanView.tsx**
   - Added visual indicator showing "Live Data" connection
   - Badge indicating connection to Microsoft Graph API

3. **src/vite-end.d.ts**
   - Added TypeScript declarations for Spark global object
   - Enables TypeScript support for `window.spark` API

4. **PRD.md**
   - Updated to reflect Microsoft Graph integration
   - Added authentication feature section
   - Updated edge cases for API-specific scenarios
   - Documented Graph API permissions and flows

## How It Works

### Authentication Flow

1. User opens the app
2. `AuthGuard` checks if user is authenticated
3. If not, displays sign-in screen
4. User clicks "Sign in with Microsoft"
5. MSAL opens popup for Azure AD authentication
6. User authenticates and consents to permissions
7. Access token is stored securely
8. App is unlocked and ready to use

### Scanning Flow

1. User configures scan (date range, sources, keywords)
2. User clicks "Start Scan"
3. `opportunityDetectionService.detectOpportunitiesFromGraphData()` is called
4. For each selected source:
   - **Emails**: Calls `graphService.getEmails()` → filters by keywords → processes with AI
   - **Chats**: Calls `graphService.getChats()` → filters by keywords → processes with AI
   - **Meetings**: Calls `graphService.getMeetingTranscripts()` → filters by keywords → processes with AI
5. For each matched communication:
   - AI extracts partner name (via `extractPartner()`)
   - AI extracts customer name (via `extractCustomer()`)
   - AI generates summary (via `generateSummary()`)
   - Confidence score is calculated
6. Results are returned as `DetectedOpportunity[]` objects
7. Opportunities are displayed in the Results tab

### AI Analysis

Each detected communication goes through AI analysis:

```typescript
// Partner extraction
const partnerPrompt = spark.llmPrompt`Extract the partner company name from this text...`
const partnerResult = await spark.llm(partnerPrompt, 'gpt-4o-mini', true)

// Customer extraction
const customerPrompt = spark.llmPrompt`Extract the customer company name from this text...`
const customerResult = await spark.llm(customerPrompt, 'gpt-4o-mini', true)

// Summary generation
const summaryPrompt = spark.llmPrompt`Summarize this communication...`
const summary = await spark.llm(summaryPrompt, 'gpt-4o-mini')
```

## Required Setup Steps

### For Users

1. **Azure AD App Registration**:
   - Must register app in Azure Portal
   - Configure redirect URI
   - Add Microsoft Graph permissions
   - Grant admin consent (or self-consent if allowed)

2. **Environment Configuration**:
   - Copy `.env.example` to `.env`
   - Add `VITE_AZURE_CLIENT_ID` from Azure AD
   - Add `VITE_AZURE_TENANT_ID` (or use "common")

3. **First Run**:
   - Sign in with Microsoft 365 account
   - Consent to permissions
   - Start scanning communications

## API Permissions Required

| Permission | Type | Purpose |
|------------|------|---------|
| User.Read | Delegated | Read user profile |
| Mail.Read | Delegated | Read emails from Outlook |
| Chat.Read | Delegated | Read Teams chat messages |
| OnlineMeetings.Read | Delegated | Read meeting metadata |
| CallRecords.Read | Delegated | Read meeting transcripts |

All permissions are **delegated** (on-behalf-of user) and **read-only**.

## Error Handling

The integration includes robust error handling for:

- Authentication failures (popup blocked, consent denied)
- Token expiration (automatic silent refresh)
- API permission errors (clear user messaging)
- Rate limiting (exponential backoff)
- Missing data (graceful degradation)
- Network failures (retry logic)

## Security Features

- ✅ OAuth 2.0 authentication with Azure AD
- ✅ Access tokens stored securely in localStorage
- ✅ Automatic token refresh (silent)
- ✅ Read-only permissions (cannot modify user data)
- ✅ Client-side processing (no data sent to external servers)
- ✅ No permanent data storage (communications processed in memory)
- ✅ HTTPS required for production

## Testing Considerations

To test the integration:

1. You need a real Microsoft 365 account
2. Ensure you have:
   - Emails in Outlook (with co-sell related content)
   - Teams chats (optional)
   - Teams meetings with transcripts (optional, requires recording)
3. Test with different date ranges
4. Test with various keywords
5. Verify AI extraction accuracy

## Known Limitations

1. **Meeting Transcripts**: Only available if:
   - Meeting was recorded
   - Transcription was enabled
   - User was a participant

2. **Teams Chats**: Some organizations restrict Graph API access to chats

3. **Rate Limits**: Microsoft Graph has rate limits:
   - Per-user limits
   - Per-app limits
   - May need to implement throttling for large scans

4. **Data Volume**: Large date ranges or many communications may take time to process

## Future Enhancements

Potential improvements:

1. **Incremental Scanning**: Only scan new communications since last scan
2. **Background Sync**: Periodic automatic scans
3. **Webhook Integration**: Real-time notifications for new communications
4. **Advanced Filtering**: More sophisticated keyword patterns (regex, phrases)
5. **Batch Processing**: Process large volumes more efficiently
6. **Caching**: Cache Graph API responses to reduce API calls
7. **Delta Queries**: Use Graph API delta queries for efficient updates

## Migration from Mock Data

The mock data system (`mockData.ts` - `simulateAIScan()`) is still present but no longer used. The app now uses:

- `detectOpportunitiesFromGraphData()` instead of `simulateAIScan()`
- Real Graph API calls instead of simulated delays
- Real AI analysis instead of mock entity extraction

Old mock system can be removed or kept as a fallback for testing without Azure AD credentials.
