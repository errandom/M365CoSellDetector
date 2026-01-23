# Azure AD Setup Guide for M365 Co-Sell Intelligence

This guide walks you through setting up Microsoft Graph API access for the M365 Co-Sell Intelligence application.

## Prerequisites

- Microsoft 365 subscription (Business, Enterprise, or Developer)
- Azure AD tenant access
- Admin privileges (or ability to request admin consent)
- Access to Azure Portal (https://portal.azure.com)

## Step 1: Register Application in Azure AD

### 1.1 Navigate to App Registrations

1. Sign in to [Azure Portal](https://portal.azure.com)
2. Search for **Azure Active Directory** or select it from the left menu
3. Click **App registrations** in the left sidebar
4. Click **+ New registration** at the top

### 1.2 Configure Basic Settings

Fill in the registration form:

- **Name**: `M365 Co-Sell Intelligence` (or your preferred name)
- **Supported account types**: Select one of:
  - `Accounts in this organizational directory only` - For single tenant (most common)
  - `Accounts in any organizational directory` - For multi-tenant
- **Redirect URI**: 
  - Platform: **Single-page application (SPA)**
  - URI: `http://localhost:5173`

Click **Register**

### 1.3 Note Your Application Details

After registration, you'll see the **Overview** page. Copy these values:

- **Application (client) ID** - You'll need this for `.env`
- **Directory (tenant) ID** - You'll need this for `.env`

## Step 2: Configure API Permissions

### 2.1 Add Microsoft Graph Permissions

1. In your app registration, click **API permissions** in the left sidebar
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Search for and add each of these permissions:

   ✅ **User.Read** - Read user profile
   - Expand "User" category
   - Check "User.Read"

   ✅ **Mail.Read** - Read user's emails
   - Expand "Mail" category
   - Check "Mail.Read"

   ✅ **Chat.Read** - Read user's Teams chats
   - Expand "Chat" category
   - Check "Chat.Read"

   ✅ **OnlineMeetings.Read** - Read online meetings
   - Expand "OnlineMeetings" category
   - Check "OnlineMeetings.Read"

   ✅ **CallRecords.Read** - Read call records (for transcripts)
   - Expand "CallRecords" category
   - Check "CallRecords.Read"

6. Click **Add permissions**

### 2.2 Grant Admin Consent

**Important**: These permissions require admin consent.

If you're an admin:
1. Click **✓ Grant admin consent for [Your Organization]**
2. Click **Yes** to confirm
3. Verify all permissions show "Granted for [Your Organization]" with a green checkmark

If you're not an admin:
1. The permissions will show "Not granted for [Your Organization]"
2. Send the consent request to your IT admin
3. Provide them with this documentation
4. Wait for admin to grant consent before proceeding

## Step 3: Configure Authentication Settings

### 3.1 Enable Public Client Flow

1. In your app registration, click **Authentication** in the left sidebar
2. Scroll down to **Advanced settings**
3. Under **Allow public client flows**, toggle **Yes**
4. Click **Save** at the top

### 3.2 Add Additional Redirect URIs (Optional)

For production deployment, add your production URL:

1. Click **+ Add a platform** (if needed)
2. Select **Single-page application**
3. Enter your production URL (e.g., `https://yourdomain.com`)
4. Click **Configure**

## Step 4: Configure Application

### 4.1 Create Environment File

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```env
   VITE_AZURE_CLIENT_ID=your-application-client-id-here
   VITE_AZURE_TENANT_ID=your-directory-tenant-id-here
   ```

   Replace:
   - `your-application-client-id-here` with the **Application (client) ID** from Step 1.3
   - `your-directory-tenant-id-here` with the **Directory (tenant) ID** from Step 1.3
   
   For multi-tenant apps, you can use `common` instead of a specific tenant ID.

### 4.2 Verify Configuration

Your `.env` file should look like:
```env
VITE_AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
VITE_AZURE_TENANT_ID=87654321-4321-4321-4321-cba987654321
```

## Step 5: Test Authentication

### 5.1 Start the Application

```bash
npm install
npm run dev
```

### 5.2 Sign In

1. Open http://localhost:5173 in your browser
2. You'll see the sign-in screen
3. Click **Sign in with Microsoft**
4. A popup will appear with Microsoft login
5. Sign in with your M365 credentials
6. Review and accept the requested permissions
7. You should be redirected back to the application

### 5.3 Verify Access

After signing in:
- Your profile should appear in the header
- You can navigate to the **Scan** tab
- Configure scan settings and click **Start Scan**
- The app will retrieve real data from your M365 environment

## Troubleshooting

### "AADSTS700016: Application not found in the directory"

**Problem**: The Client ID is incorrect or the app isn't registered.

**Solution**: 
- Verify the `VITE_AZURE_CLIENT_ID` in your `.env` file matches the Application (client) ID from Azure Portal
- Ensure you're signed in to the correct Azure AD tenant

### "AADSTS65001: The user or administrator has not consented"

**Problem**: Admin consent hasn't been granted for the required permissions.

**Solution**:
- Go back to Step 2.2 and grant admin consent
- Or contact your IT admin to grant consent

### "Failed to fetch emails: Insufficient permissions"

**Problem**: The Mail.Read permission isn't properly configured or consented.

**Solution**:
- Verify Mail.Read is listed in API permissions
- Ensure it shows "Granted for [Your Organization]"
- Sign out and sign back in to refresh the token

### "Failed to fetch chats: Access denied"

**Problem**: Your organization may have policies restricting Graph API access to Teams data.

**Solution**:
- Contact your IT admin to verify Graph API access is enabled
- Some organizations restrict programmatic access to Teams
- Admin may need to enable "Allow applications to access online meetings on behalf of a user" in Teams admin center

### Popup Blocked

**Problem**: Browser blocks the authentication popup.

**Solution**:
- Allow popups from localhost:5173 or your domain
- Check browser popup blocker settings
- Try a different browser (Chrome, Edge, Firefox)

### "Token expired" or "InvalidAuthenticationToken"

**Problem**: Your access token has expired (tokens expire after 1 hour).

**Solution**:
- The app should automatically refresh tokens
- If refresh fails, sign out and sign back in
- Check that token caching is enabled (it should be by default)

## Security Best Practices

### For Development
- ✅ Never commit `.env` files to version control
- ✅ Use localhost redirect URIs only for local development
- ✅ Keep your Client ID secure but remember it's not secret (it's client-side)
- ✅ Tokens are stored in localStorage - clear browser data when done testing

### For Production
- ✅ Use HTTPS for all redirect URIs
- ✅ Update redirect URIs in Azure AD to match your production domain
- ✅ Consider using Azure Key Vault for sensitive configuration
- ✅ Implement proper session timeout and token refresh logic
- ✅ Enable monitoring and audit logs in Azure AD
- ✅ Review Azure AD Conditional Access policies

## Understanding Permissions

| Permission | Purpose | Data Accessed | Risk Level |
|------------|---------|---------------|------------|
| **User.Read** | Get user profile | Name, email, photo | Low |
| **Mail.Read** | Read emails | All emails in mailbox | Medium |
| **Chat.Read** | Read chats | All Teams chat messages | Medium |
| **OnlineMeetings.Read** | Read meetings | Meeting metadata | Low |
| **CallRecords.Read** | Read transcripts | Meeting transcripts (if available) | Medium |

All permissions are **delegated** (act on behalf of signed-in user) and **read-only** (cannot modify data).

## What Happens During Authentication

1. **User clicks "Sign in with Microsoft"**
   - App calls MSAL (Microsoft Authentication Library)
   - Popup opens with Azure AD login page

2. **User authenticates**
   - Enters M365 credentials
   - May need MFA if enabled

3. **User consents to permissions**
   - Reviews requested permissions
   - Clicks "Accept"

4. **Token is issued**
   - Azure AD issues an access token
   - Token is valid for 1 hour
   - Refresh token allows silent renewal

5. **App accesses Graph API**
   - Token is sent with each API request
   - Graph API verifies token and permissions
   - Requested data is returned

## Next Steps

After successful authentication:

1. **Test Email Scanning**: Navigate to Scan tab and scan emails
2. **Test Chat Scanning**: Enable Teams chats in scan settings
3. **Review Results**: Check the Results tab for detected opportunities
4. **Configure Keywords**: Customize keywords for your co-sell scenarios
5. **Export Data**: Try exporting results to Excel

## Additional Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Graph Permissions Reference](https://docs.microsoft.com/en-us/graph/permissions-reference)
- [Microsoft Graph Explorer](https://developer.microsoft.com/graph/graph-explorer) - Test Graph API calls

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all setup steps were completed
3. Review the Troubleshooting section above
4. Contact your IT admin if permissions can't be granted
5. Consult the GRAPH_API_SETUP.md file for API-specific details

## Frequently Asked Questions

**Q: Do I need to pay for Azure AD or M365?**
A: You need an existing M365 subscription. Azure AD basic features are included with M365.

**Q: Can I test without admin consent?**
A: User.Read and Mail.Read may work without admin consent. Chat.Read and meeting permissions typically require admin consent.

**Q: Will this access everyone's emails?**
A: No. Delegated permissions only access the signed-in user's data, not other users.

**Q: Is my data sent to external servers?**
A: No. All processing happens in your browser. Data is only sent to Microsoft Graph API to retrieve it.

**Q: Can I use a personal Microsoft account?**
A: No. This requires a Microsoft 365 work/school account with access to Teams and Outlook.

**Q: How long does setup take?**
A: 10-15 minutes if you have admin access. Longer if you need to request admin consent.
