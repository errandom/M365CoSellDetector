-- ============================================
-- M365 Co-Sell Detector - Scan Results Schema
-- ============================================
-- These tables store the results of communication scans performed by the application.
-- Run this script in your Fabric SQL database to create the required tables.

-- ============================================
-- Table: dbo.ScanSessions
-- ============================================
-- Stores metadata about each scan run
CREATE TABLE dbo.ScanSessions (
    -- Primary Key
    ScanId                  UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWID(),
    
    -- Scan Configuration
    ScanName                NVARCHAR(255)       NULL,           -- Optional name for the scan
    ScanType                NVARCHAR(50)        NOT NULL,       -- 'manual', 'scheduled', 'incremental'
    
    -- Date Range Scanned
    ScanDateRangeStart      DATETIME2           NOT NULL,       -- Start of the date range scanned
    ScanDateRangeEnd        DATETIME2           NOT NULL,       -- End of the date range scanned
    
    -- Sources Scanned (comma-separated: 'email,chat,meeting')
    SourcesScanned          NVARCHAR(100)       NOT NULL,
    
    -- Keywords Used (JSON array)
    KeywordsUsed            NVARCHAR(MAX)       NULL,
    
    -- Results Summary
    TotalCommunicationsScanned  INT             NOT NULL    DEFAULT 0,
    OpportunitiesDetected       INT             NOT NULL    DEFAULT 0,
    HighConfidenceCount         INT             NOT NULL    DEFAULT 0,  -- Confidence >= 0.8
    MediumConfidenceCount       INT             NOT NULL    DEFAULT 0,  -- Confidence 0.5-0.79
    LowConfidenceCount          INT             NOT NULL    DEFAULT 0,  -- Confidence < 0.5
    
    -- User Information
    ScannedByUserId         NVARCHAR(255)       NULL,           -- Azure AD Object ID
    ScannedByUserEmail      NVARCHAR(255)       NULL,           -- User email
    ScannedByUserName       NVARCHAR(255)       NULL,           -- Display name
    
    -- Timing
    ScanStartedAt           DATETIME2           NOT NULL    DEFAULT GETUTCDATE(),
    ScanCompletedAt         DATETIME2           NULL,
    ScanDurationSeconds     INT                 NULL,
    
    -- Status
    ScanStatus              NVARCHAR(50)        NOT NULL    DEFAULT 'in_progress',  -- 'in_progress', 'completed', 'failed', 'cancelled'
    ErrorMessage            NVARCHAR(MAX)       NULL,
    
    -- Metadata
    CreatedAt               DATETIME2           NOT NULL    DEFAULT GETUTCDATE(),
    ModifiedAt              DATETIME2           NOT NULL    DEFAULT GETUTCDATE(),
    
    CONSTRAINT PK_ScanSessions PRIMARY KEY (ScanId)
);

-- Index for querying scans by user
CREATE INDEX IX_ScanSessions_User ON dbo.ScanSessions (ScannedByUserId, ScanStartedAt DESC);

-- Index for querying recent scans
CREATE INDEX IX_ScanSessions_StartedAt ON dbo.ScanSessions (ScanStartedAt DESC);


-- ============================================
-- Table: dbo.DetectedOpportunities
-- ============================================
-- Stores each detected opportunity from scans
CREATE TABLE dbo.DetectedOpportunities (
    -- Primary Key
    DetectedOpportunityId   UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWID(),
    
    -- Link to Scan Session
    ScanId                  UNIQUEIDENTIFIER    NOT NULL,
    
    -- Source Communication
    CommunicationId         NVARCHAR(255)       NOT NULL,       -- ID from Graph API or generated
    CommunicationType       NVARCHAR(50)        NOT NULL,       -- 'email', 'chat', 'meeting'
    CommunicationSubject    NVARCHAR(500)       NULL,
    CommunicationFrom       NVARCHAR(255)       NULL,
    CommunicationDate       DATETIME2           NULL,
    CommunicationPreview    NVARCHAR(500)       NULL,
    CommunicationContent    NVARCHAR(MAX)       NULL,           -- Full content (consider encryption)
    
    -- Detected Partner
    PartnerName             NVARCHAR(255)       NULL,
    PartnerConfidence       DECIMAL(5,4)        NULL,           -- 0.0000 to 1.0000
    
    -- Detected Customer
    CustomerName            NVARCHAR(255)       NULL,
    CustomerConfidence      DECIMAL(5,4)        NULL,
    
    -- AI Analysis Results
    Summary                 NVARCHAR(MAX)       NULL,           -- AI-generated summary
    DetectedKeywords        NVARCHAR(MAX)       NULL,           -- JSON array of matched keywords
    OverallConfidence       DECIMAL(5,4)        NOT NULL,       -- Combined confidence score
    
    -- Suggested Actions
    SuggestedCRMAction      NVARCHAR(50)        NULL,           -- 'create', 'update', 'link'
    LinkedOpportunityId     NVARCHAR(255)       NULL,           -- If matched to existing MSX opportunity
    
    -- Deal Information (if detected)
    EstimatedDealSize       NVARCHAR(100)       NULL,           -- e.g., "$2.5M"
    EstimatedTimeline       NVARCHAR(100)       NULL,           -- e.g., "Q2 2026"
    
    -- User Review Status
    ReviewStatus            NVARCHAR(50)        NOT NULL    DEFAULT 'pending',  -- 'pending', 'confirmed', 'rejected', 'synced'
    ReviewedByUserId        NVARCHAR(255)       NULL,
    ReviewedByUserEmail     NVARCHAR(255)       NULL,
    ReviewedAt              DATETIME2           NULL,
    ReviewNotes             NVARCHAR(MAX)       NULL,
    
    -- CRM Sync Status
    SyncStatus              NVARCHAR(50)        NOT NULL    DEFAULT 'not_synced',  -- 'not_synced', 'pending', 'synced', 'failed'
    SyncedToOpportunityId   NVARCHAR(255)       NULL,           -- MSX Opportunity ID after sync
    SyncedAt                DATETIME2           NULL,
    SyncErrorMessage        NVARCHAR(MAX)       NULL,
    
    -- Metadata
    CreatedAt               DATETIME2           NOT NULL    DEFAULT GETUTCDATE(),
    ModifiedAt              DATETIME2           NOT NULL    DEFAULT GETUTCDATE(),
    
    CONSTRAINT PK_DetectedOpportunities PRIMARY KEY (DetectedOpportunityId),
    CONSTRAINT FK_DetectedOpportunities_ScanSession FOREIGN KEY (ScanId) 
        REFERENCES dbo.ScanSessions(ScanId) ON DELETE CASCADE
);

-- Index for querying by scan
CREATE INDEX IX_DetectedOpportunities_ScanId ON dbo.DetectedOpportunities (ScanId);

-- Index for querying by review status
CREATE INDEX IX_DetectedOpportunities_ReviewStatus ON dbo.DetectedOpportunities (ReviewStatus, CreatedAt DESC);

-- Index for querying by partner
CREATE INDEX IX_DetectedOpportunities_Partner ON dbo.DetectedOpportunities (PartnerName, CreatedAt DESC);

-- Index for querying by customer
CREATE INDEX IX_DetectedOpportunities_Customer ON dbo.DetectedOpportunities (CustomerName, CreatedAt DESC);

-- Index for communication deduplication
CREATE INDEX IX_DetectedOpportunities_Communication ON dbo.DetectedOpportunities (CommunicationId, CommunicationType);


-- ============================================
-- Table: dbo.OpportunityActions
-- ============================================
-- Audit log of all actions taken on detected opportunities
CREATE TABLE dbo.OpportunityActions (
    -- Primary Key
    ActionId                UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWID(),
    
    -- Link to Detected Opportunity
    DetectedOpportunityId   UNIQUEIDENTIFIER    NOT NULL,
    
    -- Action Details
    ActionType              NVARCHAR(50)        NOT NULL,       -- 'created', 'reviewed', 'confirmed', 'rejected', 'synced', 'updated', 'exported'
    ActionDescription       NVARCHAR(500)       NULL,
    
    -- Previous and New Values (for updates)
    PreviousValue           NVARCHAR(MAX)       NULL,           -- JSON of previous state
    NewValue                NVARCHAR(MAX)       NULL,           -- JSON of new state
    
    -- User Information
    ActionByUserId          NVARCHAR(255)       NULL,
    ActionByUserEmail       NVARCHAR(255)       NULL,
    ActionByUserName        NVARCHAR(255)       NULL,
    
    -- Timing
    ActionAt                DATETIME2           NOT NULL    DEFAULT GETUTCDATE(),
    
    CONSTRAINT PK_OpportunityActions PRIMARY KEY (ActionId),
    CONSTRAINT FK_OpportunityActions_DetectedOpportunity FOREIGN KEY (DetectedOpportunityId) 
        REFERENCES dbo.DetectedOpportunities(DetectedOpportunityId) ON DELETE CASCADE
);

-- Index for querying actions by opportunity
CREATE INDEX IX_OpportunityActions_OpportunityId ON dbo.OpportunityActions (DetectedOpportunityId, ActionAt DESC);

-- Index for querying actions by user
CREATE INDEX IX_OpportunityActions_User ON dbo.OpportunityActions (ActionByUserId, ActionAt DESC);


-- ============================================
-- Table: dbo.ScanSchedules
-- ============================================
-- Stores scheduled scan configurations
CREATE TABLE dbo.ScanSchedules (
    -- Primary Key
    ScheduleId              UNIQUEIDENTIFIER    NOT NULL    DEFAULT NEWID(),
    
    -- Schedule Configuration
    ScheduleName            NVARCHAR(255)       NOT NULL,
    IsEnabled               BIT                 NOT NULL    DEFAULT 1,
    
    -- Frequency Settings
    Frequency               NVARCHAR(50)        NOT NULL,       -- 'daily', 'weekly', 'monthly'
    DayOfWeek               NVARCHAR(20)        NULL,           -- For weekly: 'monday', 'tuesday', etc.
    DayOfMonth              INT                 NULL,           -- For monthly: 1-28
    TimeOfDay               TIME                NOT NULL,       -- Time to run (UTC)
    
    -- Scan Configuration
    SourcesIncluded         NVARCHAR(100)       NOT NULL,       -- 'email,chat,meeting'
    Keywords                NVARCHAR(MAX)       NULL,           -- JSON array
    LookbackDays            INT                 NOT NULL    DEFAULT 7,  -- How many days back to scan
    
    -- Owner
    CreatedByUserId         NVARCHAR(255)       NOT NULL,
    CreatedByUserEmail      NVARCHAR(255)       NULL,
    
    -- Execution History
    LastRunAt               DATETIME2           NULL,
    LastRunStatus           NVARCHAR(50)        NULL,           -- 'success', 'failed'
    LastRunScanId           UNIQUEIDENTIFIER    NULL,
    NextRunAt               DATETIME2           NULL,
    
    -- Metadata
    CreatedAt               DATETIME2           NOT NULL    DEFAULT GETUTCDATE(),
    ModifiedAt              DATETIME2           NOT NULL    DEFAULT GETUTCDATE(),
    
    CONSTRAINT PK_ScanSchedules PRIMARY KEY (ScheduleId)
);

-- Index for querying enabled schedules
CREATE INDEX IX_ScanSchedules_Enabled ON dbo.ScanSchedules (IsEnabled, NextRunAt);


-- ============================================
-- View: dbo.vw_ScanResultsSummary
-- ============================================
-- Summary view combining scans with their detected opportunities
CREATE VIEW dbo.vw_ScanResultsSummary AS
SELECT 
    s.ScanId,
    s.ScanName,
    s.ScanType,
    s.ScanDateRangeStart,
    s.ScanDateRangeEnd,
    s.SourcesScanned,
    s.OpportunitiesDetected,
    s.ScanStartedAt,
    s.ScanCompletedAt,
    s.ScanStatus,
    s.ScannedByUserName,
    s.ScannedByUserEmail,
    COUNT(CASE WHEN d.ReviewStatus = 'pending' THEN 1 END) AS PendingReviewCount,
    COUNT(CASE WHEN d.ReviewStatus = 'confirmed' THEN 1 END) AS ConfirmedCount,
    COUNT(CASE WHEN d.ReviewStatus = 'rejected' THEN 1 END) AS RejectedCount,
    COUNT(CASE WHEN d.ReviewStatus = 'synced' THEN 1 END) AS SyncedCount,
    AVG(d.OverallConfidence) AS AvgConfidence
FROM dbo.ScanSessions s
LEFT JOIN dbo.DetectedOpportunities d ON s.ScanId = d.ScanId
GROUP BY 
    s.ScanId, s.ScanName, s.ScanType, s.ScanDateRangeStart, s.ScanDateRangeEnd,
    s.SourcesScanned, s.OpportunitiesDetected, s.ScanStartedAt, s.ScanCompletedAt,
    s.ScanStatus, s.ScannedByUserName, s.ScannedByUserEmail;


-- ============================================
-- View: dbo.vw_PartnerOpportunitySummary
-- ============================================
-- Summary of detected opportunities by partner
CREATE VIEW dbo.vw_PartnerOpportunitySummary AS
SELECT 
    d.PartnerName,
    COUNT(*) AS TotalOpportunities,
    COUNT(CASE WHEN d.ReviewStatus = 'confirmed' THEN 1 END) AS ConfirmedOpportunities,
    COUNT(CASE WHEN d.ReviewStatus = 'synced' THEN 1 END) AS SyncedOpportunities,
    AVG(d.OverallConfidence) AS AvgConfidence,
    MAX(d.CreatedAt) AS MostRecentDetection
FROM dbo.DetectedOpportunities d
WHERE d.PartnerName IS NOT NULL
GROUP BY d.PartnerName;


-- ============================================
-- Stored Procedure: dbo.sp_CleanupOldScans
-- ============================================
-- Cleanup procedure to remove old scan data (retention policy)
CREATE PROCEDURE dbo.sp_CleanupOldScans
    @RetentionDays INT = 90
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CutoffDate DATETIME2 = DATEADD(DAY, -@RetentionDays, GETUTCDATE());
    
    -- Delete old scans (cascades to DetectedOpportunities and OpportunityActions)
    DELETE FROM dbo.ScanSessions
    WHERE ScanStartedAt < @CutoffDate
    AND ScanStatus IN ('completed', 'failed', 'cancelled');
    
    SELECT @@ROWCOUNT AS DeletedScans;
END;
GO
