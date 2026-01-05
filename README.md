# M365 Co-Sell Intelligence

An AI-powered Microsoft 365 integration that automatically detects co-sell opportunities by scanning your Outlook emails, Teams chats, and meeting transcripts.

## 🚀 Features

- **Microsoft 365 Authentication**: Secure OAuth 2.0 authentication with Azure AD using MSAL
- **Real-time Communication Scanning**: Integrates with Microsoft Graph API to access:
  - Outlook emails
  - Teams chat messages
  - Teams meeting transcripts
- **AI-Powered Analysis**: Uses GPT-4o-mini to:
  - Extract partner and customer entities
  - Generate conversation summaries
  - Calculate confidence scores
- **Smart Filtering**: Customizable keywords and date ranges
- **CRM Integration Ready**: Designed to sync with Dynamics 365
- **Export Capabilities**: Excel exports with customizable templates
- **Scheduled Exports**: Automated reporting with email delivery

## 📋 Prerequisites

- Microsoft 365 account with:
  - Outlook access
  - Teams access
  - Admin consent for API permissions (or ability to self-consent)
- Azure AD tenant
- Node.js 18+ (for local development)

## 🔧 Setup Instructions

### 1. Azure AD App Registration

Before running the application, you must register it in Azure AD and configure the necessary permissions.

**📖 See detailed setup instructions in [GRAPH_API_SETUP.md](./GRAPH_API_SETUP.md)**

Quick steps:
1. Go to [Azure Portal](https://portal.azure.com) → Azure AD → App Registrations
2. Create new registration with redirect URI: `http://localhost:5173`
3. Add Microsoft Graph **delegated permissions**:
   - `User.Read`
   - `Mail.Read`
   - `Chat.Read`
   - `OnlineMeetings.Read`
   - `CallRecords.Read`
4. Grant admin consent

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Azure AD credentials:
   ```
   VITE_AZURE_CLIENT_ID=your_client_id_here
   VITE_AZURE_TENANT_ID=common
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

The application will start at `http://localhost:5173`

## 🎯 How to Use

### First Time Setup

1. **Sign In**: Click "Sign in with Microsoft" and authenticate with your M365 account
2. **Grant Permissions**: Consent to the requested permissions (read-only access to your communications)
3. **You're Ready**: Start scanning for co-sell opportunities!

### Scanning for Opportunities

1. Navigate to the **Scan** tab
2. Configure your scan:
   - **Date Range**: Choose a preset (Last 7 days, Last 30 days) or custom range
   - **Sources**: Select Email, Chat, and/or Meeting transcripts
   - **Keywords**: Use defaults or add custom keywords (e.g., "partner", "co-sell", "joint opportunity")
3. Click **Start Scan**
4. The app will:
   - Connect to Microsoft Graph API
   - Fetch your communications
   - Use AI to analyze and extract opportunities
   - Display results with confidence scores

### Reviewing Opportunities

1. Go to the **Results** tab
2. Review detected opportunities:
   - See extracted partner and customer names
   - Read AI-generated summaries
   - View original communication context
3. Take action:
   - **Confirm**: Mark as valid opportunity (ready for CRM sync)
   - **Reject**: Mark as false positive
   - **Edit**: Modify extracted details before confirming

### Exporting Data

1. Click **Export to Excel** in the Results tab
2. Choose a template:
   - Executive Summary
   - Detailed Audit Trail
   - Partner Performance
   - Review Queue
3. Apply filters (status, source type, confidence level)
4. Export to Excel with formatted sheets

### Scheduling Automated Exports

1. Click **Schedule Exports** in the Results tab
2. Create a new schedule:
   - Choose export template
   - Set frequency (daily, weekly, monthly)
   - Add email recipients
   - Set time for automatic execution
3. Enable the schedule
4. Reports are generated and delivered automatically

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI Components**: shadcn/ui v4 + Tailwind CSS v4
- **Authentication**: @azure/msal-browser
- **Graph API**: @microsoft/microsoft-graph-client
- **AI**: GitHub Spark LLM API (GPT-4o-mini)
- **State Management**: React Hooks + useKV (persistent storage)
- **Icons**: Phosphor Icons

### Key Components

- **AuthGuard**: Handles Microsoft authentication flow
- **graphService**: Microsoft Graph API integration
- **opportunityDetectionService**: AI-powered entity extraction and summarization
- **authService**: MSAL authentication wrapper

### Data Flow

```
User Authentication → Graph API → Communications Data → AI Analysis → Opportunity Detection → User Review → CRM Sync
```

## 🔐 Security & Privacy

- **Read-Only Access**: All permissions are read-only, app cannot modify your data
- **Client-Side Processing**: All AI analysis happens in your browser
- **No Data Storage**: Communications are not stored on external servers
- **Secure Tokens**: Access tokens stored securely in browser localStorage
- **Automatic Token Refresh**: Tokens refreshed silently when expired

## 🐛 Troubleshooting

### Authentication Issues

**Problem**: "Failed to sign in" error  
**Solution**: 
- Check if popup blocker is disabled
- Verify Azure AD app registration redirect URI matches your domain
- Ensure third-party cookies are enabled

### Permission Issues

**Problem**: "Failed to fetch emails/chats" error  
**Solution**:
- Verify all Graph API permissions are added in Azure AD
- Ensure admin consent has been granted
- Check if your organization restricts Graph API access

### No Data Found

**Problem**: Scan completes but finds no opportunities  
**Solution**:
- Verify you have communications in the selected date range
- Check if keywords match your communication content
- Ensure you have permissions to access the selected sources
- Meeting transcripts require recording and transcription to be enabled

### Graph API Rate Limits

**Problem**: Slow scanning or API errors  
**Solution**:
- Graph API has rate limits (per-user and per-app)
- Reduce date range for scans
- Avoid multiple simultaneous scans
- Wait a few minutes before retrying

## 📚 Documentation

- [Graph API Setup Guide](./GRAPH_API_SETUP.md) - Detailed Azure AD configuration
- [PRD.md](./PRD.md) - Product Requirements Document
- [Microsoft Graph API Docs](https://docs.microsoft.com/en-us/graph/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)

## 🤝 Contributing

This is a GitHub Spark project. To contribute:

1. Make changes in your Spark environment
2. Test thoroughly with your M365 account
3. Document any new features or API integrations

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
