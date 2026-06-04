# Product Requirements Document (PRD)

# Design System Component Usage Tracker

## 1. Overview

### 1.1 Product Name

**Design System Component Usage Tracker**

Nama alternatif:

- Component Usage Tracker
- Design System Analytics Tracker
- UI Kit Usage Tracker
- Component Adoption Tracker

---

### 1.2 Background

Design System Designer / Design Ops bertanggung jawab menyediakan UI Kit, component library, dan design system asset agar tim Product Designer dapat membuat desain UI/UX lebih cepat, konsisten, dan scalable.

Namun, setelah component dibuat dan digunakan oleh tim product designer, sering muncul gap visibility:

- Design Ops tidak tahu component tertentu dipakai di file mana saja.
- Sulit mengetahui apakah component library benar-benar diadopsi oleh tim.
- Sulit mengetahui component mana yang aktif, jarang digunakan, atau tidak pernah digunakan.
- Sulit melihat perubahan usage component dari waktu ke waktu.
- Sulit membuat keputusan cleanup, improvement, atau deprecation berdasarkan data.
- Untuk beberapa Figma plan, fitur analytics bawaan seperti Figma Library Analytics tidak tersedia.

Produk ini dibuat sebagai dashboard internal untuk membantu Design Ops melacak penggunaan component dari satu atau lebih UI Kit/design system source file terhadap file-file Figma product/design yang sudah didaftarkan.

---

### 1.3 Problem Statement

Sebagai Design Ops, user membutuhkan cara cepat dan jelas untuk menjawab pertanyaan:

> “Component dari design system ini dipakai di file mana saja, seberapa banyak, dan bagaimana perubahannya dari waktu ke waktu?”

Tanpa tool ini, Design Ops harus membuka file product satu per satu untuk mengecek penggunaan component. Proses ini memakan waktu, rawan tidak akurat, sulit diulang, dan sulit diskalakan ketika jumlah file product semakin banyak.

---

### 1.4 Product Goal

Membuat dashboard internal untuk melacak, menganalisis, dan memonitor penggunaan component dari design system / UI Kit source file pada file-file Figma yang terdaftar.

Produk ini akan membantu user melihat:

- daftar component dari source UI Kit
- total usage setiap component
- file mana saja yang menggunakan component tertentu
- jumlah instance component per file
- status component: active, low usage, unused
- usage change dari scan sebelumnya
- file-level design system adoption
- scan history
- basic governance insights

---

### 1.5 Product Objectives / OKR

#### Objective 1: Meningkatkan visibility penggunaan design system component

Key Results:

- User dapat melihat daftar component dari source UI Kit.
- User dapat melihat total usage setiap component.
- User dapat melihat file mana saja yang menggunakan component tertentu.
- User dapat melihat last scanned timestamp untuk memahami freshness data.

#### Objective 2: Mengurangi effort manual dalam audit component usage

Key Results:

- User tidak perlu membuka file product satu per satu untuk mengecek usage.
- User dapat menjalankan scan pada registered files dari satu dashboard.
- User dapat melihat hasil usage dalam bentuk table, detail page, dan summary.

#### Objective 3: Membantu design system governance berbasis data

Key Results:

- User dapat mengidentifikasi unused components.
- User dapat mengidentifikasi low usage components.
- User dapat melihat component usage increase/decrease antar scan.
- User dapat menggunakan data usage sebagai dasar cleanup, deprecation, atau improvement component.

#### Objective 4: Menyediakan alternatif scoped analytics untuk tim yang belum memiliki full library analytics bawaan

Key Results:

- User dapat membuat analytics berbasis registered files.
- User dapat melihat component usage berdasarkan scan history.
- User dapat memahami scope dan limitation data secara jelas.

---

### 1.6 Target User / Persona

#### Primary Persona: Design Ops / Design System Designer

**Role:**
Design Ops, Design System Designer, UI Kit Maintainer, Design System Owner

**Responsibilities:**

- Membuat dan maintain UI Kit / design system.
- Menyediakan component untuk product designers.
- Memastikan konsistensi penggunaan design system.
- Mengidentifikasi component yang perlu diperbaiki, digabung, atau dideprecate.
- Membantu meningkatkan adoption design system.

**Pain Points:**

- Tidak tahu component dipakai di file mana.
- Harus mengecek file product secara manual.
- Sulit membuat keputusan component lifecycle berdasarkan data.
- Sulit tahu component mana yang tidak digunakan.
- Sulit melihat adoption design system per file.

**Needs:**

- Component usage dashboard
- Search component
- File usage visibility
- Scan history
- Usage change detection
- Basic governance insights

---

#### Secondary Persona: Product Designer

**Role:**
Product Designer, UI/UX Designer

**Responsibilities:**

- Menggunakan design system dalam desain product.
- Membuat eksplorasi UI/UX dengan cepat.
- Menjaga konsistensi desain.

**Needs:**

- Mengetahui apakah file mereka sudah masuk tracking.
- Membantu Design Ops menjaga kualitas penggunaan component.
- Mendapat visibility apakah file mereka menggunakan design system dengan baik.

---

#### Secondary Persona: Design Lead / Design Manager

**Role:**
Design Lead, Head of Design, Product Design Manager

**Responsibilities:**

- Melihat adoption design system di tim.
- Membantu prioritas improvement design system.
- Menilai konsistensi UI/UX antar product area.

**Needs:**

- Overview adoption
- Usage summary
- File-level health
- Insight untuk roadmap design system

---

## 2. Scope

### 2.1 In-Scope

#### Source UI Kit / Design System File Management

- User dapat mendaftarkan satu source UI Kit/design system file.
- User dapat melihat daftar component dari source file.
- User dapat mengganti source file jika diperlukan.
- User dapat refresh component inventory.

#### Registered Consumer Files

- User dapat mendaftarkan file-file Figma yang ingin dilacak.
- User dapat melihat daftar registered files.
- User dapat menghapus atau disable file dari tracking.
- User dapat melihat status scan setiap file.

#### Component Usage Tracking

- Sistem dapat menampilkan total usage setiap component.
- Sistem dapat menampilkan jumlah file yang menggunakan component.
- Sistem dapat menampilkan component status:
  - Active
  - Low Usage
  - Unused
  - Not Scanned

- User dapat mencari, memfilter, dan mengurutkan component.

#### Component Detail

- User dapat membuka detail component.
- User dapat melihat file mana saja yang menggunakan component tersebut.
- User dapat melihat jumlah instance component per file.
- User dapat melihat lokasi instance seperti page/frame jika tersedia.
- User dapat membuka file atau node terkait di Figma jika memungkinkan.

#### File-Level Usage

- User dapat melihat ringkasan usage per registered file.
- User dapat melihat total design system instances dalam file.
- User dapat melihat unique components yang digunakan dalam file.
- User dapat membuka detail file untuk melihat component apa saja yang dipakai.

#### Scan Management

- User dapat menjalankan scan terhadap semua registered files.
- User dapat menjalankan rescan pada satu file tertentu.
- User dapat melihat status scan:
  - Pending
  - Running
  - Success
  - Failed
  - Paused

- User dapat melihat scan history.
- User dapat retry failed scan.

#### Snapshot & Change Detection

- Sistem menyimpan hasil scan sebagai snapshot.
- Sistem dapat membandingkan hasil scan terbaru dengan scan sebelumnya.
- Sistem dapat menampilkan perubahan usage:
  - Newly Used
  - Increased
  - Decreased
  - Removed

- Sistem dapat menampilkan recent changes.

#### Insights

- Sistem dapat menampilkan unused components.
- Sistem dapat menampilkan low usage components.
- Sistem dapat menampilkan most used components.
- Sistem dapat menampilkan stale files.
- Sistem dapat menampilkan failed scans.

#### UI & Experience

- UI mengambil inspirasi dari Figma Library Analytics untuk domain analytics.
- UX mengambil inspirasi dari Linear untuk interaction, clarity, density, dan speed.
- UI dapat dibangun menggunakan shadcn/ui sebagai design library.
- Dashboard harus clean, compact, dan data-first.

---

### 2.2 Out-of-Scope

Fitur yang tidak masuk scope awal:

- Auto-discovery seluruh file dalam company/workspace tanpa registration.
- Full replacement 1:1 dari Figma Library Analytics.
- Real-time tracking saat designer mengedit file.
- Deteksi exact timestamp saat component ditambah/dihapus.
- Analisis usage pada file yang tidak punya akses permission.
- Automatic deprecation action ke Figma.
- Mengubah atau memodifikasi file Figma.
- Membuat component baru di Figma.
- AI agent untuk crawling.
- AI recommendation untuk component improvement.
- Multi-organization enterprise governance.
- Advanced design linting.
- Visual diff desain.
- Full detached component analysis.
- Integrasi Slack/Jira/Linear pada MVP.
- Role-based access control kompleks pada MVP.
- Multi-source UI Kit support pada MVP, kecuali diputuskan sebagai requirement utama.

---

### 2.3 Product Boundary

Produk ini bukan analytics global Figma organization. Produk ini adalah tracker berbasis file yang sudah terdaftar.

Kalimat positioning yang tepat:

> Track design system component usage across registered Figma files based on scan history.

Bukan:

> Automatically track component usage across all company Figma files.

Produk ini harus selalu jelas menyampaikan bahwa:

- data hanya berasal dari registered files
- data berdasarkan latest successful scan
- data bukan real-time
- file yang tidak terdaftar tidak termasuk analytics

---

### 2.4 Timeline & Milestone

#### Milestone 1 — MVP Foundation

Goal: user dapat mendaftarkan source UI Kit dan consumer files, lalu melihat component usage.

Deliverables:

- Setup dashboard
- Add source UI Kit file
- Import component inventory
- Add registered files
- Manual scan
- Component usage list
- Component detail by file
- File usage list
- Basic scan history

---

#### Milestone 2 — Snapshot & Change Detection

Goal: user dapat melihat perubahan usage antar scan.

Deliverables:

- Save scan snapshot
- Compare current scan vs previous scan
- Detect increased/decreased/removed/newly used
- Recent changes page
- Basic component trend

---

#### Milestone 3 — Insights & Governance

Goal: user dapat menggunakan data untuk keputusan design system.

Deliverables:

- Unused components
- Low usage components
- Most used components
- Stale files
- Failed scans
- Usage status thresholds

---

#### Milestone 4 — Experience Polish

Goal: dashboard terasa cepat, rapi, dan nyaman dipakai seperti internal tool modern.

Deliverables:

- Improved table filtering
- Search experience
- Detail drawer
- Empty states
- Error states
- Loading states
- Scan progress feedback
- Optional command menu
- Optional dark mode

---

#### Milestone 5 — Optional Enhancements

Goal: memperkuat workflow Design Ops.

Potential deliverables:

- Scheduled scan
- Export CSV
- Weekly summary
- Plugin helper for registering current file
- Slack notification
- Multi-source UI Kit support
- AI insight summary

---

## 3. User Stories / Use Cases

### 3.1 Register Source UI Kit

As a Design Ops, I want to register a source UI Kit file so that the system can identify the components that should be tracked.

#### Happy Path

1. User opens onboarding or settings.
2. User pastes source UI Kit Figma file link.
3. System validates the link.
4. System displays source file name.
5. System imports component list.
6. User sees confirmation that source UI Kit is connected.

#### Edge Cases

- File link is invalid.
- File cannot be accessed.
- File does not contain components.
- User registers the wrong file.
- Source UI Kit was previously registered.

---

### 3.2 Register Consumer Files

As a Design Ops, I want to register product/design files so that the system can scan them for design system component usage.

#### Happy Path

1. User opens Files page.
2. User clicks “Add files”.
3. User pastes one or multiple Figma file links.
4. System validates each file.
5. System adds valid files to the registered files list.
6. User sees file name, status, and scan state.

#### Edge Cases

- One or more links are invalid.
- File already exists in registered list.
- File cannot be accessed.
- User adds unsupported file type.
- User pastes mixed valid and invalid links.

---

### 3.3 Scan Registered Files

As a Design Ops, I want to scan registered files so that I can see which source components are used in those files.

#### Happy Path

1. User clicks “Scan all”.
2. System creates scan job.
3. System shows scan progress.
4. Each file moves through pending, running, and success state.
5. Usage result is saved.
6. Dashboard updates component and file usage summary.

#### Edge Cases

- One file fails but others succeed.
- Scan is paused due to rate limit.
- User closes dashboard during scan.
- File was deleted or moved.
- User no longer has access to a file.
- Scan returns zero usage for a file.

---

### 3.4 View Component Usage List

As a Design Ops, I want to see all source components and their usage count so that I can identify active, low usage, and unused components.

#### Happy Path

1. User opens Components page.
2. User sees component table.
3. Table shows component name, total instances, files used, status, and last seen.
4. User sorts by total instances.
5. User filters by status.
6. User searches a component name.

#### Edge Cases

- No scan has been run yet.
- Component list is empty.
- Usage data is outdated.
- Search returns no result.
- Some components have duplicate or similar names.

---

### 3.5 View Component Detail

As a Design Ops, I want to open a component detail page so that I can see where that component is being used.

#### Happy Path

1. User clicks Component A.
2. System opens component detail page or drawer.
3. User sees total instances and files used.
4. User sees list of files using Component A.
5. User sees instance count per file.
6. User can open related Figma file or node.

#### Edge Cases

- Component has zero usage.
- Component was deleted or renamed in source UI Kit.
- Component exists but has no scan history.
- Some file data is stale.
- Some instance links cannot be generated.

---

### 3.6 View File Usage Summary

As a Design Ops, I want to see usage summary per file so that I can evaluate design system adoption by file.

#### Happy Path

1. User opens Files page.
2. User sees all registered files.
3. Each file shows total design system instances, unique components used, status, and last scanned.
4. User opens a file detail.
5. User sees which source components are used in that file.

#### Edge Cases

- File has never been scanned.
- File scan failed.
- File has zero design system component usage.
- File has stale scan data.
- File is no longer accessible.

---

### 3.7 Detect Usage Changes

As a Design Ops, I want to see changes between scans so that I can understand whether component usage is increasing, decreasing, newly added, or removed.

#### Happy Path

1. User runs a second scan after previous scan exists.
2. System compares latest scan with previous scan.
3. System detects changes.
4. User opens Recent Changes.
5. User sees component, file, previous count, current count, and change type.

#### Edge Cases

- There is no previous scan.
- A file was skipped.
- Component was renamed.
- Component was removed from source UI Kit.
- File failed during latest scan.
- Usage count changes because instances were detached or deleted.

---

### 3.8 Identify Unused Components

As a Design Ops, I want to see unused components so that I can review candidates for cleanup or deprecation.

#### Happy Path

1. User opens Insights page.
2. User selects “Unused components”.
3. System shows components with zero usage across registered files.
4. User reviews component list.
5. User decides whether component needs follow-up.

#### Edge Cases

- Component is intentionally unused but still needed.
- Component is new and not adopted yet.
- Registered file coverage is incomplete.
- Usage exists in unregistered files but not visible to the system.

---

## 4. Functional Requirements

### 4.1 Onboarding

The product must provide an onboarding flow for first-time setup.

Expected behavior:

- User is guided to connect Figma access.
- User is guided to register source UI Kit.
- User is guided to register consumer files.
- User is informed that analytics are based only on registered files.
- User is informed that scan result is snapshot-based, not real-time.

---

### 4.2 Source UI Kit Registration

The product must allow user to register a source UI Kit file.

Expected behavior:

- User can paste a Figma file link.
- System validates the link format.
- System identifies the file as source UI Kit.
- System displays file name after successful registration.
- System can refresh component list from source UI Kit.
- User can replace the registered source UI Kit file if needed.

---

### 4.3 Component Inventory

The product must display component inventory from source UI Kit.

Expected behavior:

- Components are listed in a table.
- Component name is visible.
- Component set or grouping is visible if available.
- Component status is visible.
- Component usage summary is visible after scan.
- User can search components.
- User can sort components by usage.
- User can filter components by status.

Recommended statuses:

- Active
- Low Usage
- Unused
- Not Scanned
- Deprecated Candidate

---

### 4.4 Registered Files Management

The product must allow user to manage tracked files.

Expected behavior:

- User can add one or multiple Figma file links.
- User can remove files from tracking.
- User can disable files from future scans.
- User can see file name, scan status, and last scanned date.
- User can manually rescan a single file.
- User can open a file in Figma.

Recommended file statuses:

- Not Scanned
- Healthy
- Low Adoption
- Zero Usage
- Failed
- Stale
- Disabled

---

### 4.5 Scan Management

The product must allow user to start and monitor scans.

Expected behavior:

- User can trigger scan all.
- User can trigger scan per file.
- System displays scan progress.
- System displays running, success, failed, and paused states.
- System stores each scan as history.
- System preserves previous scan history.
- System does not erase historical data when latest scan finishes.
- System preserves previous successful data if latest scan fails.

---

### 4.6 Component Usage Dashboard

The product must show component usage across registered files.

Expected behavior:

- User can see total instances per component.
- User can see number of files using each component.
- User can see last seen timestamp.
- User can open component detail.
- User can identify unused components.
- User can identify low usage components.
- User can identify most used components.

---

### 4.7 Component Detail

The product must show detailed usage for a selected component.

Expected behavior:

- Component detail shows total instances.
- Component detail shows total files used.
- Component detail shows usage by file.
- Component detail shows instance list if available.
- Component detail shows last scanned timestamp.
- Component detail provides Figma links where possible.
- Component detail may be displayed as a page or drawer.

Recommended tabs:

- Overview
- Files
- Instances
- Trend
- Metadata

---

### 4.8 File-Level Usage

The product must show usage summary per registered file.

Expected behavior:

- File list shows total design system component instances.
- File list shows unique design system components used.
- File list shows last scan status.
- File detail shows components used in that file.
- File detail allows user to open Figma file.
- File detail can indicate stale or failed scan state.

---

### 4.9 Snapshot History

The product must save each scan result as a snapshot.

Expected behavior:

- Each scan has a timestamp.
- Each snapshot captures usage count per component per file.
- Previous snapshots remain accessible for comparison.
- Latest scan powers the current dashboard.
- Historical scan powers trend and change detection.

---

### 4.10 Change Detection

The product must compare latest scan with previous scan.

Expected behavior:

- System detects newly used component in file.
- System detects removed component from file.
- System detects increased usage count.
- System detects decreased usage count.
- System displays recent changes.
- System clearly communicates that detected time is based on scan time, not exact edit time.

Recommended change types:

- Newly Used
- Increased
- Decreased
- Removed
- No Change

---

### 4.11 Insights

The product must provide basic design system insights.

Expected behavior:

- Show unused components.
- Show low usage components.
- Show most used components.
- Show stale files.
- Show failed scans.
- Show recent usage changes.
- Show candidate components for review.

---

### 4.12 Search, Filter, and Sort

The product must provide efficient navigation for data-heavy views.

Expected behavior:

- User can search by component name.
- User can search by file name.
- User can filter by status.
- User can sort by usage count.
- User can sort by files used.
- User can sort by last scanned or last seen.
- User can reset filters.

---

### 4.13 Empty, Loading, and Error States

The product must provide clear states.

Expected behavior:

- Empty state explains what user should do next.
- Loading state shows progress or skeleton UI.
- Error state explains the issue in simple language.
- Rate limit state explains that scan is paused and will resume or can be retried.
- Permission error explains that the file may not be accessible.
- No usage state explains that component is not found in registered files.

---

## 5. Non-Functional Requirements

### 5.1 Performance

The product should feel fast and responsive for dashboard usage.

Requirements:

- Main dashboard should load quickly using latest saved scan data.
- Tables should support large numbers of components and files.
- Search and filtering should feel instant for common dataset size.
- Scan process should not block user from browsing existing data.
- User should be able to leave and return while scan continues if supported.
- Dashboard should show last available result even when scan is running.

---

### 5.2 Scalability

The product should support gradual growth.

Expected scale for MVP:

- 1 source UI Kit file
- 10–100 registered Figma files
- hundreds to thousands of components
- thousands to tens of thousands of component instances
- multiple scan histories over time

The product should be designed so future versions can support:

- scheduled scans
- multiple source UI Kit files
- multiple teams
- larger scan history
- more advanced insights

---

### 5.3 Security

The product must handle Figma access carefully.

Requirements:

- User access token or credential must not be exposed in frontend UI.
- Sensitive credentials must be stored securely.
- Error messages must not reveal secrets.
- User should be able to disconnect or replace Figma access.
- Only files accessible by the connected Figma account can be scanned.
- Product must not modify Figma files in MVP.

---

### 5.4 Reliability

The product must handle scan failures gracefully.

Requirements:

- Failed scan should not corrupt previous data.
- Partial scan success should still save successful file results.
- User should be able to retry failed scans.
- Latest successful data should remain visible even if new scan fails.
- System should show clear status for failed, stale, or skipped files.

---

### 5.5 Data Freshness

The product must clearly communicate freshness of data.

Requirements:

- Every dashboard view should show last scanned timestamp.
- File-level data should show last scanned timestamp per file.
- Trend and change detection should be based on scan history.
- Product should avoid implying real-time accuracy.
- Labels should use “Latest scan result” or “As of last scan” where appropriate.

---

### 5.6 Browser & Device Support

Primary support:

- Desktop browser
- Chrome
- Edge
- Safari
- Firefox

Secondary support:

- Tablet view for read-only dashboard usage

Not required for MVP:

- Mobile-first experience
- Native mobile app

---

### 5.7 Accessibility

The UI should follow basic accessibility expectations.

Requirements:

- Sufficient color contrast.
- Keyboard navigable core interactions.
- Clear focus state.
- Status should not rely only on color.
- Tables should remain readable.
- Interactive controls should have clear labels.

---

### 5.8 Maintainability

The product should be easy to extend.

Requirements:

- Feature areas should be modular.
- UI components should be reusable.
- Dashboard tables should follow consistent patterns.
- Status naming should be consistent.
- Future SRS/SPEC should define technical implementation separately.

---

## 6. Design & UX

### 6.1 Design Direction

The product UI should feel like a mix of:

- **Figma Library Analytics** for analytics model and domain context.
- **Linear** for interaction, speed, density, and visual clarity.
- **shadcn/ui** for component library implementation.

Design keywords:

- clean
- compact
- calm
- data-first
- fast
- operational
- precise
- modern internal tool

The UI should avoid:

- overly colorful generic SaaS dashboard style
- decorative charts without clear value
- landing page-style visuals
- excessive cards
- unclear status labels

---

### 6.2 Visual Style

Recommended visual direction:

- Neutral background
- Subtle borders
- Minimal shadows
- Compact typography
- Dense but readable tables
- Small status badges
- Clear empty states
- Calm accent color
- Light mode first
- Optional dark mode later

---

### 6.3 Information Architecture

Recommended navigation:

```txt
Overview
Components
Files
Scans
Insights
Settings
```

#### Overview

Purpose: high-level summary.

Content:

- total components
- registered files
- total instances
- unused components
- failed scans
- last scan
- recent changes summary

#### Components

Purpose: main component usage analytics.

Content:

- component table
- search
- filter by status
- sort by usage
- component detail drawer/page

#### Files

Purpose: file-level adoption and scan coverage.

Content:

- registered file list
- file status
- total design system instances
- unique components used
- last scanned
- file detail

#### Scans

Purpose: scan job monitoring.

Content:

- scan history
- status
- duration
- target file
- error message
- retry action

#### Insights

Purpose: design system governance.

Content:

- unused components
- low usage components
- most used components
- stale files
- recent changes

#### Settings

Purpose: configuration.

Content:

- Figma access status
- source UI Kit file
- registered file management
- usage status threshold
- scan configuration

---

### 6.4 Core User Flow

#### First-Time Setup Flow

```txt
Open app
→ Connect Figma access
→ Register source UI Kit
→ Import component list
→ Register product files
→ Run first scan
→ View dashboard
```

#### Component Investigation Flow

```txt
Open Components page
→ Search Component A
→ Open component detail
→ See total instances
→ See files using Component A
→ Open related Figma file/node
```

#### File Adoption Flow

```txt
Open Files page
→ Select File Beta
→ View source components used
→ See total usage
→ Check stale/failed status
→ Rescan file if needed
```

#### Change Detection Flow

```txt
Run new scan
→ System compares with previous scan
→ Open Recent Changes
→ See newly used / removed / increased / decreased usage
→ Investigate component or file detail
```

---

### 6.5 Key Screens

#### Screen 1 — Overview Dashboard

Main purpose:

- give quick visibility of system health and usage state

Key UI elements:

- metric cards
- recent changes list
- scan status card
- top used components
- unused component count
- stale file warning

---

#### Screen 2 — Components Table

Main purpose:

- browse and search source components

Key columns:

- component name
- component set
- total instances
- files used
- status
- last seen
- action

---

#### Screen 3 — Component Detail

Main purpose:

- inspect where a component is used

Key sections:

- component summary
- file usage table
- instance list
- trend tab
- metadata
- open in Figma action

---

#### Screen 4 — Files Table

Main purpose:

- understand tracking coverage and file-level adoption

Key columns:

- file name
- total design system instances
- unique components used
- last scanned
- scan status
- action

---

#### Screen 5 — Scan Jobs

Main purpose:

- monitor crawler activity and failures

Key columns:

- target file
- status
- started at
- finished at
- duration
- result
- error message
- retry action

---

#### Screen 6 — Insights

Main purpose:

- identify component governance opportunities

Key sections:

- unused components
- low usage components
- most used components
- removed from files
- stale files
- failed scans

---

### 6.6 UX Principles

#### Principle 1: Be honest about data scope

The app must clearly say that analytics are based on registered files only.

Recommended copy:

> Usage is calculated from registered Figma files that have been scanned.

#### Principle 2: Be honest about freshness

The app must show when data was last scanned.

Recommended copy:

> Latest scan result from 3 Jun 2026, 10:00.

#### Principle 3: Make investigation fast

User should be able to go from component to affected files quickly.

Desired flow:

```txt
Search component
→ click row
→ see files
→ open in Figma
```

#### Principle 4: Prioritize tables over decorative charts

Charts are useful for trends, but the MVP should focus on searchable tables and clear counts.

#### Principle 5: Handle failure clearly

If scan fails, user should know:

- which file failed
- why it failed
- what can be done next

---

## 7. Dependencies & Assumptions

### 7.1 Dependencies

The product depends on:

#### Figma Access

- User must have access to source UI Kit file.
- User must have access to registered product files.
- If access is removed, scan may fail.

#### Figma File Structure

- Component usage can only be detected if component instances remain linked to the source component.
- Detached components may not be counted as active instances of source UI Kit component.
- Deleted files or inaccessible files cannot be scanned.

#### Registered File List

- Product analytics depends on the list of registered files.
- Files not registered are not included in usage results.
- User must maintain tracking coverage.

#### Scan History

- Trend and change detection depend on multiple scans.
- First scan cannot produce increase/decrease trend.
- Change detection is based on scan interval, not exact edit timestamp.

#### UI Component Library

- UI can use shadcn/ui as base component library.
- Tables, badges, dialogs, drawers, tabs, and forms should follow consistent patterns.

---

### 7.2 Assumptions

- The primary user is Design Ops or Design System Designer.
- The first version is internal-use only.
- The MVP tracks one main source UI Kit file.
- User will manually register product files to track.
- Analytics are expected to be scoped, not organization-wide.
- User understands that the app is not real-time.
- Scans may take time depending on file size and number of registered files.
- The app does not need mobile-first layout for MVP.
- The app does not need to edit Figma files.
- The product value comes from visibility, not automation of design decisions.

---

### 7.3 Risks

#### Risk 1: User expects global analytics

Mitigation:

- Use clear wording: “registered files” and “latest scan result”.
- Add onboarding explanation.

#### Risk 2: Data becomes stale

Mitigation:

- Show last scanned timestamp.
- Add stale status.
- Provide manual rescan.

#### Risk 3: File access changes

Mitigation:

- Show permission/access error.
- Keep previous successful data visible.
- Allow retry.

#### Risk 4: Too many files make scan slow

Mitigation:

- Show scan queue/progress.
- Allow per-file scan.
- Prioritize latest successful data in dashboard.

#### Risk 5: Component rename causes confusion

Mitigation:

- Track component identity beyond display name in technical implementation.
- Show component metadata.
- Preserve history where possible.

#### Risk 6: Detached components are not counted

Mitigation:

- Communicate that usage is based on linked component instances.
- Consider detached detection as future enhancement.

---

## 8. Success Metrics

### 8.1 Product Success Metrics

- User can complete first setup successfully.
- User can register source UI Kit.
- User can register at least one product file.
- User can run first scan successfully.
- User can find a component and see file usage.
- User can identify unused components.
- User can see scan history.

---

### 8.2 Operational Metrics

- Number of registered files
- Number of scanned files
- Scan success rate
- Number of failed scans
- Number of components tracked
- Number of components with usage
- Number of unused components
- Number of low usage components

---

### 8.3 User Value Metrics

- Time saved compared to manual checking.
- Reduced manual file opening.
- Faster component audit.
- More confident deprecation decisions.
- Better visibility of design system adoption.

---

## 9. MVP Definition

### 9.1 MVP Must-Have

The MVP must include:

- Figma access setup
- Source UI Kit registration
- Registered files management
- Manual scan
- Component usage table
- Component detail showing files used
- File usage table
- Scan history
- Snapshot storage
- Basic change detection
- Basic insights: unused and low usage components

---

### 9.2 MVP Nice-to-Have

The MVP may include:

- Detail drawer instead of full page
- Trend chart
- CSV export
- Command menu
- Dark mode
- Scheduled scan
- Threshold settings
- File grouping

---

### 9.3 MVP Not Included

The MVP will not include:

- AI agent
- real-time tracking
- automatic workspace-wide discovery
- Slack notification
- advanced role permissions
- Figma plugin
- direct modification to Figma files
- full detached component analysis

---

## 10. Future Opportunities

Potential future features:

- Scheduled scan
- Weekly usage report
- Slack notification for failed scan or major changes
- Figma plugin to register current file
- Export to CSV
- Design system adoption score
- Deprecated component monitoring
- Suggested cleanup list
- Component replacement recommendation
- AI-generated design system health summary
- Multi-source UI Kit support
- Team/squad grouping
- Integration with Linear/Jira for design system tasks
- Design linting for non-library usage
- Detached component detection
- Variable and style usage tracking

---

## 11. Open Questions

- Will the first version track only one source UI Kit or support multiple UI Kits?
- How many product files are expected in the first rollout?
- Who will maintain the registered file list?
- Should product designers be allowed to register their own files?
- Should scan be manual only or scheduled from MVP?
- What threshold defines low usage?
- Should unused components include newly created components?
- Should disabled files be excluded from historical trend?
- Should the app support file grouping by squad/project?
- Should design leads have a read-only view?
- Should component status be manually editable?
- Should there be a deprecation candidate workflow?
- Should trend be shown daily, weekly, or per scan?
- How should stale file threshold be defined?

---

## 12. Recommended Product Copy

### Data Scope Disclaimer

> Usage is calculated from registered Figma files that have been scanned.

### Freshness Disclaimer

> Data reflects the latest successful scan, not real-time Figma activity.

### Empty Component Usage

> This component was not found in any registered files during the latest scan.

### First Scan Empty State

> Register product files and run your first scan to start tracking design system component usage.

### Failed Scan Message

> This file could not be scanned. Check file access or try again.

### Stale Data Message

> This file has not been scanned recently. Usage data may be outdated.

---

## 13. Product Positioning Statement

Design System Component Usage Tracker is an internal Design Ops dashboard that helps teams understand where design system components are used across registered Figma files. It provides component usage visibility, file-level adoption, scan history, and change detection so Design Ops can maintain the design system with more confidence and less manual checking.

---

## 14. Summary

This product helps solve a core Design Ops problem: lack of visibility into where UI Kit/design system components are used.

The product does not attempt to fully replace Figma Library Analytics or provide organization-wide automatic analytics. Instead, it provides a scoped, practical, and buildable tracker for registered files.

The MVP should focus on:

```txt
Source UI Kit
→ Registered Figma files
→ Manual scan
→ Component usage dashboard
→ File usage dashboard
→ Snapshot history
→ Basic change detection
```

The desired user experience should feel clean, compact, and fast, taking inspiration from Figma Library Analytics for analytics concepts and Linear for interaction quality.
