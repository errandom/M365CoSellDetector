# Microsoft Graph API Integration Setup

This application integrates with Microsoft Graph API to access real M365 data from Outlook emails, Teams chats, and meeting transcripts.

## Prerequisites

- Azure AD tenant (Microsoft 365 subscription)
- Admin consent or ability to consent to application permissions
- Azure portal access

## Setup Instructions

### 1. Register the Application in Azure AD

1. Navigate to [Azure Portal](https://portal.azure.com)
2. Go to **Azure Active Directory** → **App Registrations** → **New Registration**
3. Configure the registration:
   - **Name**: M365 Co-Sell Intelligence
   - **Supported account types**: 
     - Choose "Accounts in any organizational directory" for multi-tenant
     - Or "Accounts in this organizational directory only" for single tenant
   - **Redirect URI**: 
     - Type: Web
     - URL: `http://localhost:5173` (for local development)
     - URL: `https://yourdomain.com` (for production)

### 2. Configure API Permissions

1. In your app registration, go to **API Permissions**
2. Click **Add a permission** → **Microsoft Graph** → **Delegated permissions**
3. Add the following permissions:
   - `User.Read` - Read user profile
   - `Mail.Read` - Read user's emails
   - `Chat.Read` - Read user's Teams chats
   - `OnlineMeetings.Read` - Read online meetings
   - `CallRecords.Read` - Read call records and transcripts

4. Click **Grant admin consent** (requires admin privileges)
   - If you're not an admin, send the consent request to your IT admin

### 3. Configure the Application

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your Azure AD details:
   ```
   VITE_AZURE_CLIENT_ID=<your-application-client-id>
   VITE_AZURE_TENANT_ID=<your-tenant-id-or-common>
   ```

3. Find these values in Azure Portal:
   - **Client ID**: App Registration → Overview → Application (client) ID
   - **Tenant ID**: App Registration → Overview → Directory (tenant) ID
   - Use `common` for multi-tenant apps

### 4. Authentication Flow

The application uses MSAL (Microsoft Authentication Library) with popup-based authentication:

1. User clicks "Sign in with Microsoft"
2. Popup window opens for Azure AD authentication
3. User consents to the requested permissions
4. Access token is stored securely in browser localStorage
5. Token is used for all Microsoft Graph API calls

### 5. Data Access

Once authenticated, the application can:

- **Scan Emails**: Retrieves emails from Outlook within specified date range
- **Scan Teams Chats**: Retrieves chat messages from Teams conversations
- **Scan Meeting Transcripts**: Retrieves transcripts from recorded Teams meetings (if available)

All data is processed locally in the browser. No data is stored on external servers.

## Graph API Endpoints Used

- `/me/messages` - Retrieve user's emails
- `/me/chats` - Retrieve user's chat conversations
- `/me/chats/{id}/messages` - Retrieve messages from a specific chat
- `/me/onlineMeetings` - Retrieve user's online meetings
- `/me/onlineMeetings/{id}/transcripts` - Retrieve meeting transcripts

## Troubleshooting

### "Failed to fetch emails" Error
- Verify the `Mail.Read` permission is granted
- Check if admin consent was provided
- Ensure the access token is valid

### "Failed to fetch chats" Error
- Verify the `Chat.Read` permission is granted
- Some organizations disable Graph API access to Teams chats
- Contact your IT admin if chat access is restricted

### "No meeting transcripts found"
- Meeting transcripts are only available if:
  - Recording was enabled during the meeting
  - Transcription was enabled
  - You were a participant in the meeting
- Not all meetings will have transcripts available

### Authentication Popup Blocked
- Ensure browser popup blocker allows popups from your domain
- Try using a different browser
- Check if third-party cookies are enabled

### Token Expiration
- Access tokens expire after 1 hour
- The app automatically refreshes tokens silently
- If refresh fails, you'll be prompted to sign in again

## Security Considerations

- Client credentials are never exposed in the code
- All API calls use delegated permissions (on behalf of the user)
- Tokens are stored securely in browser localStorage
- No data is transmitted to third-party servers
- All processing happens client-side

## Permissions Explained

| Permission | Purpose | User Impact |
|------------|---------|-------------|
| `User.Read` | Read basic user profile | Displays user name and email |
| `Mail.Read` | Read emails | Scans emails for co-sell keywords |
| `Chat.Read` | Read Teams chats | Scans chats for partner discussions |
| `OnlineMeetings.Read` | Read meeting details | Accesses meeting metadata |
| `CallRecords.Read` | Read meeting transcripts | Analyzes transcript content |

All permissions are **read-only**. The application cannot send emails, post chats, or modify any data.

## Production Deployment

For production deployment:

1. Update redirect URI in Azure AD to match your production URL
2. Update `.env` with production values
3. Ensure HTTPS is enabled (required for MSAL)
4. Consider using Azure Key Vault for credential management
5. Implement proper error logging and monitoring

## Additional Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
