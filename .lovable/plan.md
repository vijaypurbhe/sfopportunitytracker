

# Pipeline CRM — Comprehensive Opportunity Management Platform

## Overview
A full-featured CRM built from your pipeline data with team authentication, AI-powered insights, approval gates, and email notifications. All 170+ columns from your Excel data will be stored in Supabase and accessible throughout the app.

---

## 1. Authentication & User Management
- Email/password login via Lovable Cloud (Supabase Auth)
- User roles: **Admin**, **Sales Owner**, **Presales**, **Bid Manager**, **Reviewer**
- Role-based access control — users see only relevant opportunities based on their role

## 2. Data Import & Database
- Import all columns from the Excel file into a Supabase `opportunities` table
- Supporting tables: `accounts`, `users/profiles`, `notifications`, `gate_approvals`, `comments`
- Full CRUD — create, edit, update, and delete opportunities directly in the app

## 3. Dashboard & Views

### Main Dashboard
- **Pipeline summary cards**: Total opportunities, total TCV, win rate, average deal size
- **Pipeline by stage**: Visual funnel showing P1 through P5 stages with counts and values
- **Revenue heatmap**: Quarterly/monthly ACV breakdown (FY 24-25, 25-26, 26-27)
- **Win probability distribution** chart
- **Deals closing this quarter** with expected close dates

### Pipeline Board (Kanban)
- Drag-and-drop board organized by Sales Stage (P1–P5)
- Cards show Account Name, Opportunity Name, TCV, Win Probability, Owner
- Color-coded by deal size or urgency

### Opportunity List View
- Searchable, filterable, sortable data table with all key columns
- Filters: Stage, Industry, Country, SBU, IBG, Owner, Date range, TCV range
- Bulk actions for stage updates

### Opportunity Detail Page
- All opportunity fields organized in tabs: **Overview**, **Financials**, **Account Info**, **Timeline**, **Activity**
- Financials tab: Monthly/quarterly ACV breakdown with charts, EBITDA%, TCV, booking values
- Account tab: DUNS data, company details, industry, competitors, global ultimate info
- Editable fields with inline editing

## 4. Approval Gates (Workflow)

### Gate 1: Deal Qualification Gate
- Triggered when moving opportunity from P1 → P2
- Checklist: Account validated, industry confirmed, budget range identified, decision-maker identified
- Requires approval from **Sales Manager** before proceeding
- Shows qualification score based on completeness

### Gate 2: Presales Assignment Gate
- Triggered at P2 → P3 transition
- Assign Presales resources, Bid Manager, Pricing SPOC, Pricing Lead
- Requires confirmation of resource availability
- Approval from **Presales Lead**

### Gate 3: Proposal Review Gate
- Triggered before P3 → P4 (before submitting proposal)
- Review checklist: Pricing approved, EBITDA% validated, solution reviewed, competitive analysis done
- Requires sign-off from **Bid Manager** and **Reviewer**
- Blocks progression until all reviewers approve

Each gate shows: status (pending/approved/rejected), approver, timestamp, comments

## 5. AI Insights (Lovable AI)
- **Win probability prediction**: AI analyzes deal attributes and suggests likely outcome
- **Deal risk alerts**: Flag opportunities at risk based on stale dates, low win probability, missing fields
- **Next best action**: AI recommends actions for each opportunity (follow up, escalate, update pricing)
- **Pipeline health summary**: Weekly AI-generated summary of pipeline trends
- Accessible via an "AI Insights" panel on the dashboard and each opportunity detail page

## 6. Notifications System

### In-App Notifications
- Bell icon with unread count in the header
- Notification types: gate approval requests, stage changes, approaching close dates, AI alerts, comments/mentions
- Notification center with mark-as-read and filtering

### Email Notifications
- Email alerts sent to Opportunity Owners, Bid Managers, and gate approvers
- Triggers: new gate approval needed, gate approved/rejected, deal stage change, deal approaching close date
- Branded email templates via Lovable's built-in email system

## 7. Account & Relationship Management
- Account list with grouping by SBU, IBG, Industry
- Account detail page showing all related opportunities
- Account health indicators based on active deals and revenue
- Competitor tracking per opportunity

## 8. Design & UX
- Clean, professional enterprise UI with sidebar navigation
- Light theme with blue primary accent (corporate feel)
- Responsive layout optimized for desktop (primary) with tablet support
- Key sections: Dashboard, Pipeline, Opportunities, Accounts, Notifications, Settings

