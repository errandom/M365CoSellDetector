# Planning Guide

A Microsoft 365 Co-Sell Intelligence Dashboard that scans communications (emails, chats, meetings) to automatically detect partner co-sell opportunities and streamline CRM integration.

**Experience Qualities**: 
1. **Intelligent** - The app should feel smart and proactive, surfacing relevant co-sell opportunities without manual searching through communications
2. **Trustworthy** - Users must feel confident in the AI-detected opportunities with clear visibility into why something was flagged and full control to review before action
3. **Efficient** - Reducing manual CRM data entry from hours to minutes by automating partner and opportunity detection

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a multi-faceted enterprise application that involves scanning multiple communication channels, applying intelligent filtering, entity extraction, CRM integration workflows, and providing comprehensive review and confirmation interfaces across different views.

## Essential Features

### 1. Microsoft 365 Authentication
- **Functionality**: Secure authentication with Microsoft 365 using MSAL (Microsoft Authentication Library) with popup-based OAuth 2.0 flow
- **Purpose**: Establish secure, delegated access to user's M365 communications (emails, chats, meeting transcripts)
- **Trigger**: User opens app without existing authentication
- **Progression**: Display sign-in screen → User clicks "Sign in with Microsoft" → Azure AD popup authentication → User consents to permissions (Mail.Read, Chat.Read, OnlineMeetings.Read, CallRecords.Read) → Token stored securely → Access granted
- **Success criteria**: Users can successfully authenticate, tokens are securely stored and automatically refreshed, clear permission explanations provided

### 2. Communication Scanner
- **Functionality**: Integrates with Microsoft Graph API to retrieve real emails, Teams chats, and meeting transcripts from user's M365 environment with customizable keyword filters and date range presets
- **Purpose**: Automatically surface partner collaboration opportunities from actual communications that would otherwise be buried in communication noise
- **Trigger**: User clicks "Scan Communications" after authentication or sets up automatic periodic scanning
- **Progression**: Select data sources → Choose date preset or custom range → Customize keyword filters → Apply filters → Graph API fetches communications → AI processes communications → Results displayed with confidence scores
- **Success criteria**: Successfully retrieves real M365 data, identifies 90%+ of genuine co-sell discussions with <10% false positive rate; users can easily add/remove keywords and select common date ranges

### 2. Entity Extraction Engine
- **Functionality**: Uses AI (GPT-4o-mini via Spark LLM API) and pattern recognition to extract partner names, customer accounts, and opportunity details from real communication content retrieved from Microsoft Graph
- **Purpose**: Automatically populate CRM fields without manual data entry by analyzing actual email, chat, and meeting transcript content
- **Trigger**: Runs automatically on filtered communications retrieved from Graph API
- **Progression**: Receive communications from Graph API → AI analyzes message content → Identify entities (partners, customers) → Extract key details (deal size, timeline) → Map to CRM schema → Generate confidence scores
- **Success criteria**: Correctly extracts partner and customer names with 85%+ accuracy from real M365 communications

### 3. CRM Opportunity Matching
- **Functionality**: Cross-references detected communications with existing Dynamics 365 opportunities
- **Purpose**: Prevent duplicate entries and intelligently link new partner engagements to existing opportunities
- **Trigger**: After entity extraction completes
- **Progression**: Query CRM for customer → Check existing opportunities → Verify partner associations → Flag new vs. update scenarios
- **Success criteria**: 100% accurate matching against existing CRM records, zero duplicate opportunity creation

### 4. Review & Confirmation Interface
- **Functionality**: Presents detected co-sell interactions in an organized, reviewable format with edit capabilities
- **Purpose**: Give users full control and transparency before committing data to CRM
- **Trigger**: After CRM matching completes
- **Progression**: Display detected interactions → Show extracted entities → Highlight CRM action (create/update) → User reviews/edits → Batch confirm or individual approve → Sync to CRM
- **Success criteria**: Users can review, edit, and confirm/reject all detected opportunities within 2 minutes

### 4. AI Conversation Summarization
- **Functionality**: Uses GPT-4o-mini to generate natural language summaries of email threads, chat conversations, and meeting transcripts retrieved from Microsoft Graph
- **Purpose**: Help users quickly understand context without reading full message history from their actual M365 communications
- **Trigger**: Automatically generated for each detected co-sell interaction from Graph API data
- **Progression**: Collect message thread from Graph API → AI summarizes key points → Extract action items → Display concise summary
- **Success criteria**: Summaries capture essential context in <50 words, users can understand opportunity without reading original communications

### 6. Partner Intelligence Dashboard
- **Functionality**: Visualizes co-sell activity trends, top partners, and opportunity pipeline
- **Purpose**: Provide strategic insights into partner ecosystem health
- **Trigger**: User navigates to Dashboard view
- **Progression**: Load historical data → Calculate metrics → Render visualizations → Enable drill-down
- **Success criteria**: Displays key metrics (active partners, pipeline value, conversion rate) with interactive charts

### 7. Excel Export with Customizable Templates
- **Functionality**: Export scan results to Excel with pre-built templates for different reporting needs and the ability to save custom templates
- **Purpose**: Enable rapid, consistent reporting for different stakeholders (executives, partners, auditors) and support recurring reporting workflows
- **Trigger**: User clicks "Export to Excel" button in Results view
- **Progression**: Open export dialog → Select from 6+ built-in templates or create custom → Templates tab shows Executive Summary, Detailed Audit, Partner Performance, Review Queue, Email-Based, Meeting Insights → Configure additional filters (status, source type, date range, confidence, partners, customers) → Select columns to include → Preview filtered count → Save current configuration as new template → Export to Excel file with Summary sheet
- **Success criteria**: Successfully exports filtered data to Excel with template presets, allows saving custom templates that persist between sessions, includes summary statistics sheet, and preserves original data formatting

### 8. Scheduled Automatic Exports
- **Functionality**: Set up recurring exports that automatically generate and deliver reports via email on a schedule (daily, weekly, monthly)
- **Purpose**: Automate routine reporting workflows and ensure stakeholders receive updates without manual intervention
- **Trigger**: User clicks "Schedule Exports" button and configures a new schedule
- **Progression**: Open scheduled exports dialog → View existing schedules with status indicators → Click "New Schedule" → Enter schedule name → Select export template → Choose frequency (daily/weekly/monthly) → Set day and time → Add email recipients (one or more) → Enable/disable schedule → System runs exports automatically at scheduled times → Generates Excel file → Simulates email delivery to recipients → Updates last run and next run times → Users can edit, pause, or delete schedules
- **Success criteria**: Successfully creates and persists schedules, executes exports at correct times (with 1-minute precision), generates proper Excel files using selected template, displays accurate next run calculations, allows enabling/disabling without deletion, validates all inputs before saving

## Edge Case Handling

- **No Communications Found**: Display helpful empty state with suggestions to adjust filters or date range, or check Microsoft Graph API permissions
- **Graph API Permission Denied**: Show clear error message with link to GRAPH_API_SETUP.md documentation and admin consent instructions
- **Graph API Rate Limiting**: Implement exponential backoff and display progress when API calls are throttled
- **Authentication Token Expired**: Automatically attempt silent token refresh; if fails, prompt re-authentication without losing scan progress
- **No Keywords Selected**: Disable scan button and show message prompting user to add at least one keyword
- **Invalid Date Range**: Prevent scanning if "to" date is before "from" date, show validation message
- **Ambiguous Partner Names**: Flag for manual review with suggested matches from partner database
- **Multiple Customers in Thread**: Extract all and create separate opportunity cards for user to review
- **Expired Auth Token**: Gracefully prompt re-authentication without losing scan progress
- **Missing Graph API Credentials**: Show setup instructions and link to Azure AD app registration documentation
- **Teams Transcript Unavailable**: Gracefully handle when meetings don't have transcripts (not recorded or transcription disabled)
- **CRM Connection Failure**: Queue changes locally and retry with visible status indicator
- **Duplicate Detection Conflicts**: Show side-by-side comparison and let user choose merge or create new
- **Insufficient Permissions**: Clear messaging about required permissions with guided setup flow
- **Custom Keywords Persistence**: Save user's custom keywords between sessions for quick reuse
- **No Opportunities in Export**: Disable export button and show helpful message about adjusting filters
- **Excel Export with Zero Filters**: Export all opportunities with full dataset
- **Template Name Conflicts**: Allow duplicate template names but append timestamp for uniqueness
- **Deleted Template While Selected**: Clear selection and reset to default template state
- **Template with Invalid Filters**: Validate filter compatibility before applying (e.g., no data matches template criteria)
- **No Active Schedules**: Display helpful empty state encouraging users to create their first schedule
- **Invalid Email Address**: Validate email format and show error before allowing addition to recipients list
- **Schedule Time Already Passed Today**: Calculate next run for the following occurrence (tomorrow for daily, next week for weekly, etc.)
- **Missing Template for Schedule**: Handle gracefully if a scheduled export references a deleted template, show warning in schedule list
- **Multiple Schedules at Same Time**: Execute all scheduled exports that are due without conflicts
- **Schedule Running During Export Dialog**: Allow simultaneous scheduled and manual exports without interference

## Design Direction

The design should evoke enterprise confidence and intelligent automation - professional yet approachable, data-rich yet scannable, powerful yet not overwhelming. The interface should feel like a trusted AI assistant that augments (not replaces) human judgment, with Microsoft 365 visual language familiarity while maintaining its own distinct identity as an intelligence tool.

## Color Selection

A professional enterprise palette inspired by Microsoft 365 with intelligence-focused accents.

- **Primary Color**: Deep Azure Blue (oklch(0.45 0.15 250)) - Conveys trust, enterprise credibility, and Microsoft ecosystem alignment
- **Secondary Colors**: 
  - Slate Gray (oklch(0.35 0.01 250)) for secondary actions and structural elements
  - Cool Gray (oklch(0.92 0.005 250)) for backgrounds and subtle containers
- **Accent Color**: Vibrant Teal (oklch(0.65 0.14 195)) - Intelligence and AI-powered features, draws attention to key insights
- **Status Colors**:
  - Success Green (oklch(0.65 0.17 145)) for confirmed/synced items
  - Warning Amber (oklch(0.75 0.15 75)) for items needing review
  - Error Red (oklch(0.60 0.22 25)) for failed actions
- **Foreground/Background Pairings**:
  - Primary Blue (oklch(0.45 0.15 250)): White text (oklch(1 0 0)) - Ratio 7.8:1 ✓
  - Accent Teal (oklch(0.65 0.14 195)): White text (oklch(1 0 0)) - Ratio 4.6:1 ✓
  - Background Gray (oklch(0.98 0.002 250)): Dark text (oklch(0.25 0.01 250)) - Ratio 12.5:1 ✓
  - Card White (oklch(1 0 0)): Foreground (oklch(0.25 0.01 250)) - Ratio 14.2:1 ✓

## Font Selection

Typography should convey modern enterprise professionalism with excellent readability for data-heavy interfaces and long-form communication content.

- **Primary**: Inter - Clean, highly legible, excellent for UI and data displays
- **Secondary**: IBM Plex Sans - Warmer alternative for communication previews and summaries

- **Typographic Hierarchy**:
  - H1 (Dashboard Title): Inter Bold / 32px / -0.02em letter spacing / 1.2 line height
  - H2 (Section Headers): Inter Semibold / 24px / -0.01em letter spacing / 1.3 line height
  - H3 (Card Titles): Inter Semibold / 18px / normal letter spacing / 1.4 line height
  - Body (UI Text): Inter Regular / 14px / normal letter spacing / 1.5 line height
  - Body Large (Communication Content): IBM Plex Sans Regular / 15px / normal letter spacing / 1.6 line height
  - Caption (Metadata): Inter Regular / 12px / normal letter spacing / 1.4 line height
  - Button Text: Inter Medium / 14px / normal letter spacing

## Animations

Animations should reinforce the intelligent, responsive nature of the AI-powered system while maintaining enterprise professionalism. Use subtle motion to guide attention to newly detected opportunities, smooth transitions between review states, and satisfying confirmation feedback. Avoid flashy effects - every animation serves to reduce cognitive load or provide meaningful feedback. Scan progress should feel organic and purposeful with smooth loading states. Card reveals should feel discovered rather than abruptly appearing.

## Component Selection

- **Components**:
  - **Card**: Primary container for detected co-sell opportunities with hover states and expandable details; also used for displaying scheduled export entries
  - **Tabs**: Switch between Dashboard, Scan Results, History, and Settings views; also used for Filters/Columns in export dialog
  - **Badge**: Status indicators (New, Review Needed, Confirmed, Synced) with color coding; also used for keyword chips, filter selection, and schedule status (Active/Paused)
  - **Button**: Primary actions (Scan, Confirm, Edit, Sync, Export, Schedule Exports) with loading states; also preset buttons for date ranges
  - **Input**: Text input for adding custom keywords with enter-to-add functionality; also range slider for confidence filtering, email address input for schedule recipients, time picker for schedule configuration, number input for day of month
  - **Dialog**: Full-screen review mode for individual opportunities with edit capabilities; export configuration dialog; scheduled exports management dialog with split-pane layout
  - **Table**: Display communication source data and CRM matching results
  - **Progress**: Visual feedback during scanning and AI processing
  - **Select/Dropdown**: Filter controls for date range, source type, partner selection; template selection in export and schedule dialogs; frequency, day of week selection in schedules
  - **Calendar**: Date picker for custom date range selection in popovers; used for export date filtering
  - **Checkbox**: Batch selection for multi-confirm actions; column and filter selection in export dialog
  - **Textarea**: Edit extracted summaries and opportunity details
  - **Separator**: Visual hierarchy between sections; divider between schedule list and edit form
  - **Scroll Area**: Handle long lists of communications and opportunities; export dialog filter lists; schedule list with many entries
  - **Accordion**: Expandable sections for email threads and chat histories
  - **Popover**: Date picker containers for export date range selection
  - **Switch**: Enable/disable scheduled exports without deletion, providing quick toggle functionality

- **Customizations**:
  - Custom OpportunityCard component combining Card + Badge + actions with Microsoft-inspired layout
  - Custom ScanProgress component with animated stage indicators
  - Custom EntityChip component for extracted partner/customer names with confidence indicators
  - Custom TimelineView for communication thread visualization
  - Custom MetricCard for dashboard KPIs with trend indicators

- **States**:
  - Buttons: Distinct hover with slight lift, pressed with scale feedback, disabled with opacity + no interaction, loading with spinner
  - Cards: Subtle shadow on hover, border highlight on selection, expanded state with smooth height transition
  - Inputs: Focused with accent border and subtle glow, error with red border and message, success with green check

- **Icon Selection**:
  - Scan/Search: MagnifyingGlass
  - Email: Envelope
  - Chat: ChatCircle
  - Meeting: Video
  - Confirm/Success: CheckCircle
  - Warning: WarningCircle
  - Partner: Handshake
  - Customer: Buildings
  - Opportunity: TrendUp
  - Dashboard: ChartBar
  - Settings: Gear
  - Edit: PencilSimple
  - Delete: Trash
  - Filter: Funnel
  - AI/Intelligence: Sparkle or Brain
  - Calendar: CalendarBlank (for date pickers)
  - Keywords/Tags: Tag
  - Add: Plus
  - Remove: X
  - Export: Download
  - Schedule: CalendarCheck
  - Edit Schedule: PencilSimple
  - Delete Schedule: Trash
  - Email Recipients: Envelope
  - Next Run Time: CalendarBlank
  - Toggle Schedule: Switch (component, not icon)

- **Spacing**:
  - Section padding: 6 (1.5rem / 24px)
  - Card padding: 5 (1.25rem / 20px)
  - Card gap: 4 (1rem / 16px)
  - Component gap: 3 (0.75rem / 12px)
  - Tight spacing: 2 (0.5rem / 8px)
  - Dense spacing: 1.5 (0.375rem / 6px)

- **Mobile**:
  - Stack cards vertically with full width on <768px
  - Collapse tabs into bottom navigation on mobile
  - Reduce padding and font sizes by one step
  - Dialog becomes full-screen sheet on mobile
  - Hide secondary metadata, show on expand
  - Single column layout for all views
  - Fixed action buttons at bottom of viewport
  - Horizontal scroll for table data with sticky first column
