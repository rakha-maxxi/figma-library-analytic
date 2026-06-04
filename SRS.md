# Software Requirements Specification (SRS)

# Design System Component Usage Tracker

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines the system-level requirements for **Design System Component Usage Tracker**.

The system is an internal Design Ops dashboard that tracks usage of components from a source UI Kit / design system file across registered Figma design files. It helps Design Ops understand where components are used, how many instances exist, how usage changes over time, and which components may be unused or low usage.

This SRS expands the PRD into detailed software requirements. More technical implementation details such as database schema, API contracts, crawler logic, queue design, deployment, and code architecture should be documented separately in the Technical Specification.

---

### 1.2 Scope

The system will allow users to:

- Connect Figma access.
- Register a source UI Kit / design system file.
- Import component inventory from the source file.
- Register consumer Figma files to be tracked.
- Scan registered files.
- Detect component instances from the source UI Kit.
- Store scan results.
- Store scan snapshots.
- Show component usage analytics.
- Show file-level adoption.
- Detect usage changes between scans.
- Show unused, low usage, and most used components.
- Monitor scan jobs and scan errors.

The system is not intended to provide real-time tracking or automatic discovery of all company Figma files.

---

### 1.3 Definitions

| Term                | Definition                                                                     |
| ------------------- | ------------------------------------------------------------------------------ |
| Source UI Kit       | Main Figma file that contains design system components to be tracked.          |
| Source Component    | Component defined in the source UI Kit.                                        |
| Consumer File       | Product/design Figma file that may use components from the source UI Kit.      |
| Registered File     | Consumer file manually added to the tracker.                                   |
| Instance            | A usage of a source component inside a consumer file.                          |
| Scan                | Process of reading a registered file and detecting source component instances. |
| Scan Job            | A record of a scan process for one or multiple files.                          |
| Snapshot            | Saved result of a scan at a specific time.                                     |
| Current Usage       | Latest successful scan result used by the dashboard.                           |
| Usage Change        | Difference between previous scan and latest scan.                              |
| Stale File          | File that has not been scanned within a defined threshold.                     |
| Low Usage Component | Component with usage below a configurable threshold.                           |
| Unused Component    | Component with zero detected usage across registered files.                    |
| Data Scope          | The set of registered files included in the analytics.                         |

---

### 1.4 Product Positioning

The system should be positioned as:

> A scoped design system component usage tracker for registered Figma files.

The system should not be positioned as:

> A full organization-wide replacement for Figma Library Analytics.

The product must consistently communicate that usage data is based on registered files and latest successful scan results.

---

### 1.5 Intended Users

Primary users:

- Design Ops
- Design System Designer
- UI Kit Maintainer
- Design System Owner

Secondary users:

- Product Designer
- Design Lead
- Product Design Manager

---

## 2. Overall Description

### 2.1 Product Perspective

Design System Component Usage Tracker is a web-based internal tool. It sits outside Figma and uses Figma access to read a source UI Kit file and registered consumer files.

The system consists of:

- Dashboard UI
- Figma access setup
- Source UI Kit registration
- Component inventory import
- Registered file management
- Scan job management
- Component usage analytics
- File-level usage analytics
- Snapshot history
- Change detection
- Insights page
- Settings page

---

### 2.2 Product Functions

At a high level, the system must support:

1. Figma access setup.
2. Source UI Kit registration.
3. Component inventory import.
4. Consumer file registration.
5. Manual scan.
6. Per-file rescan.
7. Component instance detection.
8. Component usage calculation.
9. Component detail view.
10. File usage summary.
11. Scan history.
12. Snapshot history.
13. Change detection.
14. Insight generation.
15. Error handling.
16. Stale data handling.

---

### 2.3 User Classes

#### Design Ops / Design System Designer

Main user who configures and operates the system.

Capabilities:

- Connect Figma access.
- Register source UI Kit.
- Register consumer files.
- Run scans.
- Review component usage.
- Review file adoption.
- Review insights.
- Monitor scan jobs.

#### Product Designer

Potential user who may check whether their file is tracked.

Capabilities:

- View registered files.
- View file scan status.
- View file-level usage.
- Optionally request or trigger scan depending on permission model.

#### Design Lead / Manager

Read-oriented user who reviews adoption and governance insights.

Capabilities:

- View overview.
- View component usage.
- View file-level adoption.
- View insights.
- Review changes over time.

---

### 2.4 Operating Environment

The system is expected to run as a web application.

Primary environment:

- Desktop browser
- Internal company usage
- Online access required

Supported browsers:

- Chrome
- Edge
- Safari
- Firefox

Mobile-first support is not required for MVP.

---

### 2.5 Design and Implementation Constraints

The system must follow these constraints:

- Analytics are limited to registered files.
- System must clearly communicate data scope.
- System must clearly communicate latest scan timestamp.
- System must not imply real-time accuracy.
- System must not modify Figma files in MVP.
- System must not expose sensitive credentials in the frontend.
- System must preserve previous successful scan data if a new scan fails.
- System must support partial scan success.
- UI should be clean, compact, and data-first.
- UX should take inspiration from Figma Library Analytics and Linear.
- UI may use shadcn/ui as the component library.

---

### 2.6 Assumptions

- User has access to the source UI Kit file.
- User has access to registered consumer files.
- Source UI Kit contains components that can be detected in consumer files.
- Consumer files must be manually registered.
- Scan results are snapshot-based.
- Trend and change detection require at least two scans.
- Detached components may not be counted as linked source component instances.
- First release is for internal usage.
- MVP supports one primary source UI Kit file.
- Multi-source UI Kit support may be added later.

---

### 2.7 Dependencies

External dependencies:

- Figma files
- Figma access credentials
- Figma file permissions
- Figma file structure
- Hosting platform
- Database
- Backend runtime
- UI component library

Internal dependencies:

- Scan worker or scan process
- Data storage
- Dashboard frontend
- Authentication/access control if added
- Error handling and logging

---

## 3. System Context

### 3.1 System Boundary

The system can:

- Read source UI Kit file.
- Read registered consumer files.
- Detect source component instances.
- Store and display analytics.
- Store scan history.
- Compare scan snapshots.
- Display usage trends and changes.

The system cannot:

- Automatically know all company files.
- Read files that the connected account cannot access.
- Track real-time changes while designers edit.
- Know the exact edit timestamp when a component was added or removed.
- Guarantee usage visibility outside registered files.
- Modify Figma files in MVP.

---

### 3.2 High-Level Flow

```txt
User connects Figma access
→ User registers source UI Kit
→ System imports component inventory
→ User registers consumer files
→ User runs scan
→ System detects component instances
→ System saves current usage and snapshot
→ System compares with previous snapshot
→ Dashboard displays usage, changes, and insights
```

---

### 3.3 Data Freshness Model

The system must use a snapshot-based data model.

Meaning:

- Data is valid as of the latest successful scan.
- Data is not real-time.
- Trend is generated by comparing saved snapshots.
- Change detection is based on differences between scan results.
- Removed usage means the usage existed in a previous scan and was not found in a later scan.

Required UI copy pattern:

```txt
Usage is calculated from registered files based on the latest successful scan.
```

---

## 4. Functional Requirements

## 4.1 Figma Access Setup

### FR-001 — Add Figma Access

The system shall allow user to add Figma access credentials.

Priority: Must Have

Requirements:

- User can input Figma access credential.
- System can validate credential.
- System shows connection status.
- System shows clear error if credential is invalid.
- System must not expose credential in client-side UI after saving.

Acceptance Criteria:

```txt
Given user inputs a valid Figma access credential
When user clicks "Connect"
Then system validates the credential
And displays "Connected"
```

```txt
Given user inputs an invalid credential
When user clicks "Connect"
Then system displays a clear error message
And does not proceed to source UI Kit registration
```

---

### FR-002 — Replace Figma Access

The system shall allow user to replace existing Figma access.

Priority: Should Have

Requirements:

- User can update credential.
- System validates new credential.
- Existing registered files remain stored.
- Existing scan history remains stored.
- Future scans use the new credential.

Acceptance Criteria:

```txt
Given an existing connected credential
When user replaces it with a valid credential
Then future scans use the new credential
And previous scan data remains available
```

---

### FR-003 — Disconnect Figma Access

The system shall allow user to disconnect Figma access.

Priority: Should Have

Requirements:

- User can remove stored credential.
- System prevents new scan after disconnect.
- Existing historical data remains visible.
- System clearly shows disconnected state.

Acceptance Criteria:

```txt
Given user disconnects Figma access
When user opens dashboard
Then historical data remains visible
And scan actions are disabled
```

---

## 4.2 Source UI Kit Registration

### FR-004 — Register Source UI Kit File

The system shall allow user to register one source UI Kit file.

Priority: Must Have

Requirements:

- User can paste a Figma file URL.
- System extracts file key from URL.
- System validates file access.
- System displays detected file name.
- System saves file as source UI Kit.
- System supports replacing source UI Kit.

Acceptance Criteria:

```txt
Given user pastes a valid source UI Kit Figma URL
When user submits the file
Then system saves it as the source UI Kit
And displays the file name
```

---

### FR-005 — Handle Invalid Source UI Kit URL

The system shall show clear error for invalid source UI Kit file URL.

Priority: Must Have

Requirements:

- System detects invalid URL format.
- System prevents saving invalid file.
- System explains required input format.

Acceptance Criteria:

```txt
Given user pastes an invalid URL
When user submits it
Then system displays "Invalid Figma file URL"
And does not save the file
```

---

### FR-006 — Handle Inaccessible Source UI Kit File

The system shall show permission error when source UI Kit cannot be accessed.

Priority: Must Have

Requirements:

- System checks file access.
- If file cannot be accessed, system shows permission error.
- System suggests checking access permission or credential.

Acceptance Criteria:

```txt
Given user submits a valid URL for an inaccessible file
When system tries to validate it
Then system displays an access error
And does not register it as source UI Kit
```

---

## 4.3 Component Inventory

### FR-007 — Import Component Inventory

The system shall import components from source UI Kit.

Priority: Must Have

Requirements:

- System reads component list from source UI Kit.
- System stores component identity.
- System stores component display name.
- System stores source file reference.
- System stores grouping metadata when available.
- System updates component inventory when user refreshes source UI Kit.

Acceptance Criteria:

```txt
Given source UI Kit is registered
When user imports components
Then system stores all detectable source components
And displays them in Components page
```

---

### FR-008 — Refresh Component Inventory

The system shall allow user to refresh component inventory.

Priority: Should Have

Requirements:

- User can trigger refresh.
- System updates component list.
- Existing usage history remains preserved.
- Renamed components should retain continuity where possible.
- Removed components should be marked or handled without deleting historical usage.

Acceptance Criteria:

```txt
Given source UI Kit has changed
When user refreshes component inventory
Then system updates the component list
And preserves historical usage records
```

---

### FR-009 — Display Component Inventory

The system shall display components in a searchable table.

Priority: Must Have

Table columns:

- Component name
- Component set or group
- Total instances
- Files used
- Status
- Last seen
- Last scanned
- Action

Acceptance Criteria:

```txt
Given components have been imported
When user opens Components page
Then user sees all source components in a table
```

---

## 4.4 Registered Files Management

### FR-010 — Add Registered Files

The system shall allow user to register one or multiple consumer Figma files.

Priority: Must Have

Requirements:

- User can paste one or multiple Figma URLs.
- System extracts file keys.
- System validates each URL.
- System saves valid files.
- System ignores duplicate files or shows duplicate warning.
- System shows status for each added file.

Acceptance Criteria:

```txt
Given user pastes multiple valid Figma file URLs
When user submits them
Then system adds each file to registered files
And displays them in Files page
```

---

### FR-011 — Handle Duplicate Registered Files

The system shall prevent duplicate registered files.

Priority: Must Have

Requirements:

- File key must be unique.
- If duplicate file is submitted, system does not create duplicate record.
- System informs user that file is already registered.

Acceptance Criteria:

```txt
Given File Beta is already registered
When user submits File Beta URL again
Then system does not create a duplicate
And displays "File already registered"
```

---

### FR-012 — Remove Registered File

The system shall allow user to remove a registered file from tracking.

Priority: Must Have

Requirements:

- User can remove file from active tracking.
- Removed file is excluded from future scans.
- Historical data may remain available depending on retention policy.
- UI should indicate whether removal is permanent or archival.

Acceptance Criteria:

```txt
Given a file is registered
When user removes it
Then file no longer appears in active registered files
And is excluded from future scans
```

---

### FR-013 — Disable Registered File

The system shall allow user to disable a file without deleting history.

Priority: Should Have

Requirements:

- Disabled file remains visible or filterable.
- Disabled file is excluded from future scans.
- Historical usage remains accessible.
- User can re-enable disabled file.

Acceptance Criteria:

```txt
Given a file is disabled
When user runs Scan All
Then disabled file is skipped
And previous data remains visible
```

---

### FR-014 — Display Registered Files

The system shall display registered files in a table.

Priority: Must Have

Table columns:

- File name
- File key or short reference
- Total source component instances
- Unique source components used
- Status
- Last scanned
- Last scan result
- Action

Acceptance Criteria:

```txt
Given files have been registered
When user opens Files page
Then system displays all active registered files
```

---

## 4.5 Scan Management

### FR-015 — Run Scan All

The system shall allow user to scan all active registered files.

Priority: Must Have

Requirements:

- User can click "Scan all".
- System creates scan jobs.
- System scans active registered files.
- System skips disabled files.
- System displays progress.
- System saves result per file.
- System supports partial success.

Acceptance Criteria:

```txt
Given multiple active registered files exist
When user clicks "Scan all"
Then system creates scan jobs
And scans each active file
And updates scan status per file
```

---

### FR-016 — Run Single File Scan

The system shall allow user to scan one selected file.

Priority: Must Have

Requirements:

- User can click "Rescan" on a file.
- System creates scan job for selected file.
- System updates current usage for that file.
- System saves new snapshot for that file.

Acceptance Criteria:

```txt
Given File Beta is registered
When user clicks "Rescan"
Then system scans only File Beta
And updates its usage result
```

---

### FR-017 — Scan Status Tracking

The system shall track scan job status.

Priority: Must Have

Required statuses:

- Pending
- Running
- Success
- Failed
- Paused
- Cancelled, optional

Acceptance Criteria:

```txt
Given a scan is running
When user opens Scans page
Then user sees current scan status
```

---

### FR-018 — Partial Scan Success

The system shall support partial success when some files fail.

Priority: Must Have

Requirements:

- Successful file scans are saved.
- Failed file scans show error.
- Overall scan all may complete with warning.
- Failed files can be retried.

Acceptance Criteria:

```txt
Given scan all includes 10 files
And 8 files succeed
And 2 files fail
Then system saves the 8 successful results
And marks the 2 files as failed
```

---

### FR-019 — Rate Limit Handling

The system shall gracefully handle Figma API rate limit.

Priority: Must Have

Requirements:

- If rate limit occurs, scan job enters paused or delayed state.
- System shows user-friendly message.
- System resumes or allows retry depending on implementation.
- Existing successful scan data must not be lost.

Acceptance Criteria:

```txt
Given Figma API rate limit is reached
When scan is running
Then system pauses or delays the affected job
And displays a rate limit status
```

---

### FR-020 — Scan History

The system shall display scan history.

Priority: Must Have

Required scan history fields:

- Scan job ID or reference
- Target file
- Status
- Started at
- Finished at
- Duration
- Result summary
- Error message if failed

Acceptance Criteria:

```txt
Given scans have been run
When user opens Scans page
Then user sees previous scan jobs and their statuses
```

---

### FR-021 — Retry Failed Scan

The system shall allow user to retry failed scan.

Priority: Should Have

Requirements:

- User can retry failed job.
- Retry creates a new scan job.
- Original failed job remains in history.
- New result updates current usage if successful.

Acceptance Criteria:

```txt
Given a file scan failed
When user clicks "Retry"
Then system creates a new scan job for the same file
```

---

## 4.6 Component Instance Detection

### FR-022 — Detect Source Component Instances

The system shall detect instances of source UI Kit components inside registered files.

Priority: Must Have

Requirements:

- System scans file content.
- System identifies component instances.
- System matches instances to source UI Kit components.
- System counts instances per component.
- System counts instances per component per file.
- System stores instance-level information when available.

Acceptance Criteria:

```txt
Given File Beta contains 5 instances of Component A from the source UI Kit
When system scans File Beta
Then system records Component A usage count as 5 for File Beta
```

---

### FR-023 — Store Instance Location

The system shall store instance location metadata when available.

Priority: Should Have

Metadata:

- Instance node ID
- Instance name
- Page name
- Parent frame name
- Figma node URL if available
- Consumer file reference
- Source component reference

Acceptance Criteria:

```txt
Given system detects an instance
When location metadata is available
Then system stores page, frame, and node reference
```

---

### FR-024 — Count Component Usage Per File

The system shall calculate component usage per file.

Priority: Must Have

Requirements:

- For each component and file pair, system calculates instance count.
- Count is based on detected linked instances.
- Count is saved in current usage and snapshot.

Acceptance Criteria:

```txt
Given Component A appears 3 times in File Beta
When scan completes
Then Component A usage in File Beta equals 3
```

---

### FR-025 — Handle Zero Usage

The system shall handle files with zero source component usage.

Priority: Must Have

Requirements:

- File scan succeeds even if zero usage is found.
- File status may show low adoption or zero usage.
- Component counts remain unchanged or zero.
- Dashboard should not treat zero usage as error.

Acceptance Criteria:

```txt
Given File Beta contains no source UI Kit components
When scan completes
Then file scan status is success
And total source component instances equals 0
```

---

## 4.7 Snapshot and Current Usage

### FR-026 — Save Scan Snapshot

The system shall save each successful scan result as a snapshot.

Priority: Must Have

Requirements:

- Snapshot must include scan timestamp.
- Snapshot must include file reference.
- Snapshot must include component usage count.
- Snapshot must not overwrite historical snapshots.
- Snapshot must be queryable for trend and change detection.

Acceptance Criteria:

```txt
Given File Beta scan succeeds
When result is saved
Then a new snapshot is created with scanned_at timestamp
```

---

### FR-027 — Update Current Usage

The system shall maintain latest current usage.

Priority: Must Have

Requirements:

- Latest successful scan updates current usage for scanned file.
- Current usage powers dashboard summary.
- Failed scan must not overwrite current usage.
- Current usage must show last successful scan timestamp.

Acceptance Criteria:

```txt
Given previous successful scan exists
When latest scan fails
Then current usage remains based on previous successful scan
```

---

### FR-028 — Preserve Historical Usage

The system shall preserve historical scan data.

Priority: Must Have

Requirements:

- Previous snapshots remain stored.
- Change detection can compare latest and previous snapshot.
- User can see historical usage where supported.

Acceptance Criteria:

```txt
Given multiple scans exist
When user views trend
Then system uses historical snapshots
```

---

## 4.8 Change Detection

### FR-029 — Compare Latest and Previous Snapshot

The system shall compare scan results with previous successful snapshot.

Priority: Must Have

Requirements:

- Comparison happens per component per file.
- System calculates previous count.
- System calculates current count.
- System determines change type.
- System stores or displays detected changes.

Acceptance Criteria:

```txt
Given Component A count was 10 in previous scan
And Component A count is 7 in latest scan
When comparison runs
Then system marks change as decreased
```

---

### FR-030 — Detect Newly Used Component

The system shall detect when a component appears in a file for the first time or after zero usage.

Priority: Must Have

Condition:

```txt
previous_count = 0
current_count > 0
```

Result:

```txt
change_type = newly_used
```

Acceptance Criteria:

```txt
Given Component A had 0 usage in File Beta
And latest scan finds 4 instances
Then system marks Component A as newly used in File Beta
```

---

### FR-031 — Detect Removed Component

The system shall detect when a component is no longer found in a file.

Priority: Must Have

Condition:

```txt
previous_count > 0
current_count = 0
```

Result:

```txt
change_type = removed
```

Acceptance Criteria:

```txt
Given Component A had 5 instances in File Beta
And latest scan finds 0 instances
Then system marks Component A as removed from File Beta
```

---

### FR-032 — Detect Increased Usage

The system shall detect usage increase.

Priority: Must Have

Condition:

```txt
current_count > previous_count
```

Result:

```txt
change_type = increased
```

Acceptance Criteria:

```txt
Given Component A had 5 instances
And latest scan finds 8 instances
Then system marks usage as increased by 3
```

---

### FR-033 — Detect Decreased Usage

The system shall detect usage decrease.

Priority: Must Have

Condition:

```txt
current_count < previous_count
current_count > 0
```

Result:

```txt
change_type = decreased
```

Acceptance Criteria:

```txt
Given Component A had 8 instances
And latest scan finds 5 instances
Then system marks usage as decreased by 3
```

---

### FR-034 — Display Recent Changes

The system shall display recent component usage changes.

Priority: Should Have

Required fields:

- Component name
- File name
- Change type
- Previous count
- Current count
- Difference
- Detected at
- Link to component detail
- Link to file detail

Acceptance Criteria:

```txt
Given changes were detected in latest scan
When user opens Recent Changes
Then user sees change records grouped or sorted by detected time
```

---

## 4.9 Component Usage Dashboard

### FR-035 — Display Overview Metrics

The system shall display high-level dashboard metrics.

Priority: Must Have

Metrics:

- Total components tracked
- Registered files
- Total detected instances
- Unused components
- Low usage components
- Failed scans
- Last successful scan

Acceptance Criteria:

```txt
Given scan data exists
When user opens Overview
Then user sees summary metrics
```

---

### FR-036 — Display Component Usage Table

The system shall display component usage table.

Priority: Must Have

Columns:

- Component name
- Component set or group
- Total instances
- Files used
- Status
- Last seen
- Action

Acceptance Criteria:

```txt
Given usage data exists
When user opens Components
Then system displays component usage table
```

---

### FR-037 — Search Components

The system shall allow component search.

Priority: Must Have

Requirements:

- User can search by component name.
- Search updates visible table rows.
- Empty search state is displayed if no result.

Acceptance Criteria:

```txt
Given user searches "Button"
When components matching Button exist
Then table shows matching components only
```

---

### FR-038 — Filter Components by Status

The system shall allow filtering components by status.

Priority: Should Have

Statuses:

- Active
- Low Usage
- Unused
- Not Scanned
- Deprecated Candidate

Acceptance Criteria:

```txt
Given user selects "Unused"
When filter is applied
Then table shows only unused components
```

---

### FR-039 — Sort Component Table

The system shall allow sorting component table.

Priority: Should Have

Sortable fields:

- Component name
- Total instances
- Files used
- Last seen
- Status

Acceptance Criteria:

```txt
Given user sorts by total instances descending
Then most used components appear first
```

---

## 4.10 Component Detail

### FR-040 — Open Component Detail

The system shall allow user to open component detail from component list.

Priority: Must Have

Requirements:

- User can click component row or action.
- System opens detail page or drawer.
- Detail must show component name and usage summary.

Acceptance Criteria:

```txt
Given user clicks Component A
Then system opens Component A detail view
```

---

### FR-041 — Show Component Usage by File

The system shall show files using selected component.

Priority: Must Have

Fields:

- File name
- Instance count
- Last scanned
- File status
- Open in Figma action

Acceptance Criteria:

```txt
Given Component A is used in File Beta
When user opens Component A detail
Then File Beta appears in usage by file list
```

---

### FR-042 — Show Component Instance List

The system shall show instance list when instance-level data exists.

Priority: Should Have

Fields:

- Instance name
- Instance node ID
- Page name
- Frame name
- File name
- Last seen
- Open node action

Acceptance Criteria:

```txt
Given Component A has instance records
When user opens Instances tab
Then system displays instance-level rows
```

---

### FR-043 — Show Component Trend

The system shall show basic trend for selected component.

Priority: Should Have

Requirements:

- Trend is based on snapshots.
- Trend shows usage over scan dates.
- Trend may show total usage or usage per file.
- If only one snapshot exists, system shows insufficient history state.

Acceptance Criteria:

```txt
Given Component A has multiple snapshots
When user opens Trend tab
Then system displays usage trend over time
```

---

## 4.11 File-Level Usage

### FR-044 — Display File Usage Table

The system shall display file-level usage.

Priority: Must Have

Columns:

- File name
- Total source component instances
- Unique source components used
- Status
- Last scanned
- Action

Acceptance Criteria:

```txt
Given registered files exist
When user opens Files page
Then system displays usage summary per file
```

---

### FR-045 — Open File Detail

The system shall allow user to open file detail.

Priority: Must Have

Requirements:

- Detail shows file metadata.
- Detail shows total source component instances.
- Detail shows unique source components used.
- Detail shows components used in that file.
- Detail shows scan status.
- Detail shows last scanned timestamp.

Acceptance Criteria:

```txt
Given File Beta has scan result
When user opens File Beta detail
Then system displays components used in File Beta
```

---

### FR-046 — Show File Components

The system shall display components used in selected file.

Priority: Must Have

Fields:

- Component name
- Component set
- Instance count
- Last seen
- Component status
- Open component detail action

Acceptance Criteria:

```txt
Given File Beta uses Component A
When user opens File Beta detail
Then Component A appears with its instance count
```

---

### FR-047 — Identify Stale Files

The system shall identify stale files.

Priority: Should Have

Requirements:

- Stale threshold is configurable or defaulted.
- File becomes stale if not scanned within threshold.
- UI shows stale status.
- Stale state does not mean scan failure.

Acceptance Criteria:

```txt
Given File Beta has not been scanned for longer than threshold
When user opens Files page
Then File Beta status shows Stale
```

---

## 4.12 Insights

### FR-048 — Show Unused Components

The system shall show components with zero usage across registered files.

Priority: Must Have

Requirements:

- Component must exist in source inventory.
- Total current usage equals zero.
- Component appears in unused insight.
- System shows latest scan context.

Acceptance Criteria:

```txt
Given Component X has zero usage
When user opens Unused Components insight
Then Component X appears in the list
```

---

### FR-049 — Show Low Usage Components

The system shall show components below usage threshold.

Priority: Should Have

Requirements:

- Low usage threshold can be defaulted.
- Component below threshold appears as low usage.
- User can understand threshold used.

Acceptance Criteria:

```txt
Given low usage threshold is 5
And Component A has 3 instances
Then Component A status is Low Usage
```

---

### FR-050 — Show Most Used Components

The system shall show most used components.

Priority: Should Have

Requirements:

- Sort components by total instance count descending.
- Show top N list.
- Link each item to component detail.

Acceptance Criteria:

```txt
Given usage data exists
When user opens Insights
Then system shows most used components
```

---

### FR-051 — Show Failed Scans Insight

The system shall show failed scan summary.

Priority: Should Have

Requirements:

- Show count of failed scans.
- Show affected files.
- Provide retry action where available.

Acceptance Criteria:

```txt
Given File Beta scan failed
When user opens Insights
Then File Beta appears in failed scans section
```

---

## 4.13 Settings

### FR-052 — Configure Usage Threshold

The system shall allow user to configure low usage threshold.

Priority: Should Have

Requirements:

- User can set threshold by instance count.
- User can set threshold by files used if supported.
- Threshold impacts status labels.
- Threshold change does not alter raw usage data.

Acceptance Criteria:

```txt
Given user changes low usage threshold from 5 to 10
When user saves setting
Then component status recalculates based on new threshold
```

---

### FR-053 — Configure Stale File Threshold

The system shall allow user to configure stale file threshold.

Priority: Could Have

Requirements:

- User can set number of days before file is stale.
- Default threshold is provided.
- File status updates based on threshold.

Acceptance Criteria:

```txt
Given stale threshold is 14 days
And File Beta was last scanned 20 days ago
Then File Beta status is Stale
```

---

### FR-054 — View Data Scope Disclaimer

The system shall display data scope disclaimer.

Priority: Must Have

Requirements:

- Disclaimer appears in onboarding.
- Disclaimer appears in dashboard or settings.
- Copy must state that data is based on registered files only.

Acceptance Criteria:

```txt
Given user opens Overview
Then user can see or access message explaining registered-file data scope
```

---

## 5. Data Requirements

### 5.1 Core Data Entities

The system must conceptually manage the following entities.

---

### Entity: Figma Access

Represents the user’s configured Figma access.

Fields conceptually include:

- Access status
- Connected account metadata if available
- Created at
- Updated at

Sensitive credentials must be stored securely and not exposed in UI.

---

### Entity: Source UI Kit File

Represents the source design system file.

Fields conceptually include:

- File key
- File name
- File URL
- Registered at
- Last component refresh
- Status

---

### Entity: Source Component

Represents a component from the source UI Kit.

Fields conceptually include:

- Component identity
- Component name
- Component set or group
- Source file reference
- Page name if available
- Created at
- Updated at
- Status

---

### Entity: Registered File

Represents a consumer Figma file being tracked.

Fields conceptually include:

- File key
- File name
- File URL
- Tracking status
- Last scanned at
- Last scan status
- Created at
- Updated at

---

### Entity: Scan Job

Represents a scan process.

Fields conceptually include:

- Target file
- Status
- Started at
- Finished at
- Duration
- Error message
- Result summary

---

### Entity: Usage Snapshot

Represents scan result at a point in time.

Fields conceptually include:

- Scan job reference
- Scanned at
- Component reference
- Consumer file reference
- Instance count
- Page count if available
- Frame count if available

---

### Entity: Usage Instance

Represents a specific detected instance.

Fields conceptually include:

- Component reference
- Consumer file reference
- Instance node ID
- Instance name
- Page name
- Frame name
- Figma node URL
- First seen at
- Last seen at
- Status

---

### Entity: Usage Change

Represents detected difference between scans.

Fields conceptually include:

- Component reference
- Consumer file reference
- Previous count
- Current count
- Difference
- Change type
- Detected at
- Scan job reference

---

## 5.2 Data Retention

Requirements:

- Historical snapshots should be preserved for trend and change detection.
- Failed scan records should be preserved for debugging.
- Removed files may retain historical data depending on retention policy.
- Sensitive access credentials should be removable.
- User should not lose previous successful usage result when new scan fails.

---

## 5.3 Data Accuracy Rules

The system must follow these accuracy rules:

- Usage count means linked instances detected during scan.
- Usage is scoped to registered files.
- Usage excludes unregistered files.
- Usage reflects latest successful scan.
- Removed means not detected in a later scan.
- Change detected time means scan time, not actual edit time.
- First scan cannot produce historical trend.
- Detached components may not be counted as source component usage.

---

## 6. External Interface Requirements

### 6.1 User Interface Requirements

The UI must provide these pages:

- Overview
- Components
- Component Detail
- Files
- File Detail
- Scans
- Insights
- Settings
- Onboarding

---

### 6.2 UI Style Requirements

The UI should follow this design direction:

- Inspired by Figma Library Analytics for analytics concepts.
- Inspired by Linear for interaction and visual quality.
- Built with shadcn/ui or equivalent component primitives.
- Clean and compact.
- Table-first.
- Neutral visual system.
- Clear status badges.
- Drawer or detail page for drill-down.

---

### 6.3 Navigation Requirements

Primary navigation should include:

```txt
Overview
Components
Files
Scans
Insights
Settings
```

---

### 6.4 Component Table Requirements

The component table must support:

- Search
- Sort
- Filter
- Row click
- Status badges
- Empty states
- Loading states

---

### 6.5 Files Table Requirements

The files table must support:

- Search
- Filter by status
- Row click
- Rescan action
- Open in Figma action
- Empty states
- Loading states

---

### 6.6 Scan UI Requirements

The scan UI must show:

- Running state
- Progress state
- Success state
- Failed state
- Paused/rate limit state
- Retry action
- Latest successful scan
- Last attempted scan

---

## 7. Non-Functional Requirements

### 7.1 Performance Requirements

NFR-001: Dashboard pages should load from saved data without requiring immediate Figma scan.

NFR-002: Main tables should remain usable with hundreds of components and up to hundreds of files.

NFR-003: Search and filter should respond quickly for normal MVP dataset size.

NFR-004: Running scan should not block the user from browsing existing scan results.

NFR-005: Large scan jobs should provide feedback instead of appearing frozen.

---

### 7.2 Security Requirements

NFR-006: Figma credentials must not be exposed in frontend logs, UI, or browser storage.

NFR-007: Credential value must be masked after saving.

NFR-008: Error messages must not include sensitive credential value.

NFR-009: Only authorized users should access dashboard if authentication is implemented.

NFR-010: The system must not modify Figma files in MVP.

---

### 7.3 Reliability Requirements

NFR-011: Failed scan must not delete previous successful scan result.

NFR-012: Partial scan success must be supported.

NFR-013: The system must show failed files clearly.

NFR-014: Retry action should be available for failed scans.

NFR-015: System should preserve scan history for debugging and trend.

---

### 7.4 Scalability Requirements

NFR-016: The system should support incremental growth from small internal use to broader team use.

MVP target:

- 1 source UI Kit
- 10–100 registered files
- hundreds to thousands of source components
- thousands to tens of thousands of instances
- recurring scan history

---

### 7.5 Usability Requirements

NFR-017: First-time setup should be guided and understandable.

NFR-018: User should understand that data is based on registered files.

NFR-019: User should understand that data is based on latest scan, not real-time.

NFR-020: Important actions should use clear labels:

- Add Source UI Kit
- Add files
- Scan all
- Rescan
- Open in Figma
- Retry

NFR-021: Empty states should guide next action.

---

### 7.6 Accessibility Requirements

NFR-022: Core UI must be keyboard accessible.

NFR-023: Status should not rely only on color.

NFR-024: Text contrast must be readable.

NFR-025: Interactive controls must have visible focus states.

NFR-026: Tables should remain readable and scannable.

---

### 7.7 Compatibility Requirements

NFR-027: The system must support latest stable versions of:

- Chrome
- Edge
- Safari
- Firefox

NFR-028: Desktop layout is required.

NFR-029: Mobile layout is not required for MVP.

---

### 7.8 Observability Requirements

NFR-030: The system should log scan failures.

NFR-031: The system should expose scan job status.

NFR-032: The system should provide user-readable error messages.

NFR-033: The system should allow debugging of failed file scans without exposing secrets.

---

## 8. Error Handling Requirements

### 8.1 Invalid Figma URL

System behavior:

- Reject input.
- Show clear validation error.
- Do not save file.

Suggested message:

```txt
Invalid Figma file URL. Please paste a valid Figma design file link.
```

---

### 8.2 Inaccessible File

System behavior:

- Mark file as access failed.
- Do not crash scan all process.
- Preserve old data if available.

Suggested message:

```txt
This file could not be accessed. Check file permission or connected Figma access.
```

---

### 8.3 Rate Limit

System behavior:

- Pause or delay scan job.
- Show rate limit status.
- Continue if possible or allow retry.

Suggested message:

```txt
Scan paused due to Figma rate limit. The system will retry when allowed.
```

---

### 8.4 Empty Component Inventory

System behavior:

- Show empty state.
- Suggest checking source UI Kit file.

Suggested message:

```txt
No components were found in this source UI Kit file.
```

---

### 8.5 Zero Usage Found

System behavior:

- Treat scan as success.
- Show zero usage state.

Suggested message:

```txt
No source UI Kit components were found in this file during the latest scan.
```

---

### 8.6 Failed Scan

System behavior:

- Mark scan job as failed.
- Show target file.
- Show error summary.
- Preserve latest successful data.
- Allow retry.

Suggested message:

```txt
Scan failed. Previous successful usage data is still available.
```

---

### 8.7 Stale Data

System behavior:

- Show stale badge.
- Show last scanned date.
- Offer rescan.

Suggested message:

```txt
This data may be outdated. Last successful scan was more than the stale threshold ago.
```

---

## 9. Status and Rules

### 9.1 Component Status Rules

#### Not Scanned

Condition:

```txt
Component inventory exists but no scan has been completed.
```

#### Active

Condition:

```txt
Total instances >= low usage threshold
```

#### Low Usage

Condition:

```txt
Total instances > 0 and total instances < low usage threshold
```

#### Unused

Condition:

```txt
Total instances = 0 after at least one successful scan exists
```

#### Deprecated Candidate

Condition:

```txt
Manually assigned or future insight-based rule
```

---

### 9.2 File Status Rules

#### Not Scanned

Condition:

```txt
File is registered but has no successful scan.
```

#### Healthy

Condition:

```txt
File has successful scan and non-zero source component usage.
```

#### Low Adoption

Condition:

```txt
File has successful scan and usage is below configured threshold.
```

#### Zero Usage

Condition:

```txt
File scan succeeds but no source component instance is detected.
```

#### Failed

Condition:

```txt
Latest scan attempt failed.
```

#### Stale

Condition:

```txt
Last successful scan is older than stale threshold.
```

#### Disabled

Condition:

```txt
File is excluded from future scans by user.
```

---

### 9.3 Change Type Rules

#### Newly Used

Condition:

```txt
previous_count = 0
current_count > 0
```

#### Removed

Condition:

```txt
previous_count > 0
current_count = 0
```

#### Increased

Condition:

```txt
current_count > previous_count
```

#### Decreased

Condition:

```txt
current_count < previous_count
current_count > 0
```

#### No Change

Condition:

```txt
current_count = previous_count
```

---

## 10. User Flows

### 10.1 First-Time Setup

```txt
User opens app
→ User sees onboarding
→ User connects Figma access
→ User registers source UI Kit
→ System imports components
→ User registers consumer files
→ User runs first scan
→ User lands on Overview
```

---

### 10.2 Component Investigation

```txt
User opens Components page
→ User searches Component A
→ User clicks Component A
→ System opens component detail
→ User sees files using Component A
→ User opens File Beta or Figma node
```

---

### 10.3 File Investigation

```txt
User opens Files page
→ User searches File Beta
→ User opens File Beta detail
→ User sees source components used in file
→ User rescans file if data is stale
```

---

### 10.4 Scan Monitoring

```txt
User clicks Scan all
→ System creates scan jobs
→ User opens Scans page
→ User watches pending/running/success/failed statuses
→ User retries failed scan if needed
```

---

### 10.5 Change Review

```txt
User runs second scan
→ System compares latest scan with previous scan
→ User opens Insights or Recent Changes
→ User sees increased/decreased/newly used/removed changes
→ User investigates affected component or file
```

---

## 11. Acceptance Criteria Summary

The MVP is accepted when:

```txt
1. User can connect Figma access.
2. User can register source UI Kit.
3. System can import source components.
4. User can register consumer files.
5. User can run scan all.
6. User can scan one file.
7. System can detect source component instances.
8. System can count usage per component.
9. System can count usage per file.
10. System can save scan snapshot.
11. System can preserve previous successful data.
12. System can display component usage table.
13. System can display component detail with files using it.
14. System can display file usage table.
15. System can display scan history.
16. System can detect increased/decreased/newly used/removed usage.
17. System can show unused components.
18. System can show low usage components.
19. System can handle failed scan.
20. System can communicate registered-file scope and scan freshness.
```

---

## 12. MVP Requirements Prioritization

### Must Have

- Figma access setup
- Source UI Kit registration
- Component inventory import
- Registered files management
- Manual scan all
- Manual single file scan
- Component instance detection
- Usage count per component
- Usage count per file
- Current usage result
- Snapshot storage
- Component usage table
- Component detail
- File usage table
- Scan history
- Basic error handling
- Data scope disclaimer
- Last scanned timestamp

---

### Should Have

- Change detection
- Recent changes
- Low usage threshold
- Unused components insight
- Stale file status
- Retry failed scan
- Instance-level location
- Component trend
- Search/filter/sort enhancements

---

### Could Have

- Scheduled scan
- Export CSV
- Command menu
- Dark mode
- File grouping
- Weekly summary
- Plugin helper
- Slack notification
- Multiple source UI Kits

---

### Won’t Have in MVP

- Real-time tracking
- Automatic organization-wide discovery
- Direct Figma file modification
- AI agent crawler
- Advanced role-based access control
- Full detached component analysis
- Visual diff
- Full Figma Library Analytics replacement

---

## 13. Open Issues

Questions to resolve before technical specification:

1. Will MVP use personal access token only or support OAuth?
2. Will the app require login/authentication?
3. Who can add or remove registered files?
4. Should removed files keep historical data visible?
5. What is the default low usage threshold?
6. What is the default stale file threshold?
7. Should scan all run sequentially or in queue batches?
8. Should snapshot be saved per file scan or per scan all session?
9. Should component detail be a page or drawer?
10. Should trend be shown in MVP or phase 2?
11. Should disabled files be included in historical charts?
12. Should user be able to manually mark component as deprecated candidate?
13. Should file groups or squads be part of MVP?
14. Should user be able to export usage data?
15. How long should scan history be retained?
16. Should multiple source UI Kits be supported in the first version?
17. Should source UI Kit switching preserve historical data separately?

---

## 14. Future Enhancements

Potential future requirements:

- Scheduled daily/weekly scans
- Multiple source UI Kit support
- Figma plugin for registering current file
- Slack notification for failed scan
- Slack weekly design system report
- Export CSV
- Export PDF report
- Advanced component lifecycle status
- Deprecation workflow
- Replacement recommendation
- Detached instance detection
- Style usage tracking
- Variable/token usage tracking
- Team/squad adoption dashboard
- Linear/Jira ticket creation
- AI-generated design system health summary
- AI-assisted duplicate component detection
- Design system adoption score
- File health scoring
- Historical trend analytics
- Custom dashboard views

---

## 15. Summary

Design System Component Usage Tracker must provide a scoped and reliable way to track source UI Kit component usage across registered Figma files.

The system must be honest about its limitations:

- It only tracks registered files.
- It is based on scans, not real-time updates.
- It cannot detect files it cannot access.
- It cannot guarantee usage outside its scan scope.

The MVP should focus on the core value:

```txt
Register source UI Kit
→ Register consumer files
→ Scan files
→ Detect component instances
→ Show component usage
→ Show files using each component
→ Save snapshots
→ Detect changes over time
```

The expected experience should be clean, compact, fast, and operational, taking inspiration from Figma Library Analytics for analytics content and Linear for interaction quality.
