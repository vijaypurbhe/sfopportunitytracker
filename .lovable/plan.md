

# Plan: Generate Salesforce Pipeline Tracker User Guide (DOCX)

## What We Are Building
A professionally formatted Word document (.docx) that serves as a comprehensive user guide for the Salesforce Pipeline Tracker application, covering all features and role-specific workflows.

## Document Structure

### 1. Cover Page
- Title: "Salesforce Pipeline Tracker — User Guide"
- Subtitle: "AI-Powered Sales Pipeline Management"
- Version, date, confidentiality notice

### 2. Table of Contents

### 3. Introduction & Overview
- Purpose of the application
- Key capabilities summary
- Supported user roles: Pre-Sales, Sales, Delivery, Practice Lead, Alliances

### 4. Getting Started
- **Account Registration**: Sign up with email, password, full name, and role selection
- **Email Verification**: Confirm email before first login
- **Signing In**: Login flow, password visibility toggle
- **Navigation**: Sidebar menu items, collapsible sidebar, sign out

### 5. Dashboard
- Pipeline summary cards (Total Opportunities, Total TCV, Win Rate, Weighted Pipeline)
- Pipeline by Stage chart (P1–P5)
- Win Probability Distribution (pie chart)
- Monthly Revenue Trend (area chart)
- AI Sparkle agents on each tile for contextual insights
- Region filter (global, persisted across pages)

### 6. Pipeline Board (Kanban)
- Visual board organized by stage (P1–P5)
- Cards showing account, opportunity name, TCV, win probability, owner
- Sorting options (TCV, win probability, name, close date)
- Stage visibility toggles

### 7. Opportunities List
- Searchable, sortable data table
- Multi-select filters: Stage, Industry, Owner (include/exclude modes)
- "Assigned to Me" toggle for personal pipeline view
- Create new opportunity dialog
- Click-through to opportunity detail

### 8. Opportunity Detail
- **Overview tab**: Key metrics (TCV, Win Probability, EBITDA%, Resources), deal info, dates
- **Financials tab**: ACV breakdown, booking values
- **Account Info tab**: DUNS data, company details, industry, competitors
- **Gates tab**: Approval gate status, request new gates
- **Pre-Sales Assignment**: Dropdown to assign pre-sales resources
- **Partner Portal checkbox**: "Lead logged in partner portal?"

### 9. Accounts
- Account list with search
- Account detail page showing active opportunities only
- Summary metrics per account (active deals, total TCV)

### 10. Approval Gates
- Three gate types: Deal Qualification, Presales Assignment, Proposal Review
- Requesting a gate approval from opportunity detail
- Reviewing and approving/rejecting gates
- Status filters (Pending, Approved, Rejected) and type filters

### 11. AI Insights
- AI-powered pipeline analysis filtered by region
- Win probability predictions, risk alerts, next best actions
- Region-aware analysis

### 12. Notifications
- Real-time in-app notifications with bell icon and unread count
- Notification types: gate approvals, stage changes, AI alerts
- Mark as read functionality

### 13. Settings — Data Sync
- Excel file upload for weekly data sync
- Column auto-mapping from Excel headers to database fields
- Match by CRM ID — updates existing, creates new, preserves unmatched
- Sync preview and results summary

### 14. Floating AI Chat
- Persistent AI assistant accessible from any page
- Context-aware responses based on current page and region filter
- Markdown and table rendering in responses

### 15. Role-Based Workflows
- **Sales**: Create opportunities, manage pipeline, track win rates, request gate approvals
- **Pre-Sales**: View assigned opportunities via "Assigned to Me", support deal qualification
- **Delivery**: Monitor active deals, track resource allocation
- **Practice Lead**: Review pipeline health, approve gates, oversee team deals
- **Alliances**: Track partner portal logging, manage alliance relationships

### 16. Appendix
- Pipeline stage definitions (P0–P5, Won, Lost, Aborted, Hibernate)
- Region filter options
- Keyboard shortcuts and tips

## Technical Approach
- Use the `docx` npm library (pptxgenjs-style) to generate a professional .docx
- Apply consistent styling: Arial font, blue accent color (#3B82F6) matching the app theme
- Include a formatted table of contents, numbered headings, bullet lists, and tables
- Output to `/mnt/documents/Salesforce_Pipeline_Tracker_User_Guide.docx`
- QA by converting to PDF/images and inspecting

