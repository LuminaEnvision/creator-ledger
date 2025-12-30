# Feature Specification: Core Ledger System

**Feature Branch**: `001-core-ledger-system`
**Created**: 2025-12-25
**Status**: Draft
**Input**: User description: "Core Ledger System" (Updated with detailed requirements)

## Overview

**Definition**: Creator Ledger is a simple tool that turns published internet content into verifiable, exportable records for creators and organizations.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Wallet Authentication (Priority: P1)

As a Creator, I want to sign in using my crypto wallet so that my identity is securely established without needing a username or password.

**Why this priority**: Wallet identity is the primary user identifier and is required for all other actions.

**Independent Test**: Can be tested by connecting a wallet (e.g., MetaMask) and verifying the user is logged in with their address visible.

**Acceptance Scenarios**:
1. **Given** a visitor on the landing page, **When** they click "Connect Wallet", **Then** their wallet extension prompts for connection.
2. **Given** a connected wallet, **When** the connection is successful, **Then** the UI updates to show the wallet address as the user ID.
3. **Given** a user, **When** they are authenticated, **Then** no username or password was required.

---

### User Story 2 - Create Ledger Entry (Priority: P1)

As a Creator, I want to submit a link to my published content so that it is permanently recorded in my ledger with a timestamp.

**Why this priority**: This is the core function of the system.

**Independent Test**: Can be tested by submitting a valid URL and verifying a new entry appears in the system.

**Acceptance Scenarios**:
1. **Given** an authenticated user, **When** they enter a content URL and click "Submit", **Then** the system records the URL, wallet address, timestamp, and platform.
2. **Given** a submission, **When** the platform is known (e.g., YouTube, X), **Then** the system auto-detects the platform.
3. **Given** a submission, **When** the platform cannot be detected, **Then** the user can manually select the platform from a list (X, TikTok, Instagram, YouTube, Other).
4. **Given** a submission, **When** it is finalized, **Then** the entry becomes immutable (read-only).
5. **Given** a submission, **When** created, **Then** a deterministic hash is generated for the entry.

---

### User Story 3 - View Ledger (Priority: P1)

As a Creator, I want to view a list of my submitted entries so that I can verify what I have tracked.

**Why this priority**: Users need to see their data to trust the system.

**Independent Test**: Can be tested by viewing the dashboard after making submissions.

**Acceptance Scenarios**:
1. **Given** an authenticated user with existing entries, **When** they view their dashboard, **Then** they see a list of entries sorted by newest first.
2. **Given** a ledger entry, **When** viewed, **Then** it displays the Date, Platform, Status (default "unverified"), and a link to the content.

---

### User Story 4 - Export Ledger (Priority: P2)

As a Creator, I want to export my ledger to CSV or PDF so that I can share it with sponsors or use it for accounting.

**Why this priority**: Essential for the "prove" and "report" aspect of the system.

**Independent Test**: Can be tested by clicking the export button and verifying the downloaded file.

**Acceptance Scenarios**:
1. **Given** a user with ledger entries, **When** they select "Export CSV", **Then** a CSV file is downloaded containing Wallet Address, Timestamps, Platforms, URLs, Verification Status, and Tags.
2. **Given** a user with ledger entries, **When** they select "Export PDF", **Then** a PDF report is generated with the same data.

---

### User Story 5 - Admin Verification (Priority: P2)

As an Admin, I want to mark entries as "verified" so that organizations can trust the data.

**Why this priority**: Supports the "Organization" role and verification aspect.

**Independent Test**: Can be tested by an admin user updating the status of an entry.

**Acceptance Scenarios**:
1. **Given** an admin user, **When** they view a ledger entry, **Then** they can change the status from "unverified" to "verified".
2. **Given** a verified entry, **When** exported by the creator, **Then** the export file reflects the "Verified" status.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to authenticate using a Web3 wallet (address = primary key).
- **FR-002**: System MUST allow creation of Ledger Entries with a valid URL.
- **FR-003**: System MUST automatically generate a timestamp for every new entry.
- **FR-004**: System MUST generate a deterministic hash for every new entry.
- **FR-005**: System MUST enforce that entries are read-only (immutable) after creation.
- **FR-006**: System MUST default all new entries to "unverified" status.
- **FR-007**: System MUST allow Admin users to mark entries as "verified".
- **FR-008**: System MUST attempt to infer the Platform from the URL (X, TikTok, Instagram, YouTube).
- **FR-009**: System MUST allow manual Platform selection if auto-detection fails or is incorrect.
- **FR-010**: System MUST include Verification Status in all exports.

### MVP Scope (Strict)

**Included**:
- Wallet auth
- Submit link
- View list
- Export CSV
- Basic admin verification

**Excluded**:
- Payments
- Subscriptions
- Notifications
- Automation
- Onchain writes (hashing only in MVP)

### API Requirements (Conceptual)

**Public**:
- `POST /entries`: Create ledger entry
- `GET /entries?wallet={address}`: List entries for wallet
- `GET /export?wallet={address}&format={csv|pdf}`: Export entries

**Admin**:
- `GET /admin/entries`: List all entries
- `PATCH /admin/entries/{id}/verify`: Verify entry
- `GET /admin/reports/{org_id}`: Export organization report

### Non-Functional Requirements (Constitution)

- **NFR-001**: The UI MUST be simple and functional, avoiding complex or custom designs.
- **NFR-002**: The application MUST be usable as a Single-Page Web App (SPA).
- **NFR-003**: The system MUST NOT require any token for usage.
- **NFR-004**: The system MUST NOT implement content discovery, feeds, or recommendation algorithms.
- **NFR-005**: The system MUST NOT implement social graph features.
- **NFR-006**: All records must be timestamped and immutable once finalized.
- **NFR-007**: Exports must be usable for accounting, sponsorships, and reporting.

### Data Model (Logical)

- **User**:
    - `wallet_address` (Primary Key)
    - `created_at`

- **LedgerEntry**:
    - `id`
    - `wallet_address` (Foreign Key)
    - `url`
    - `platform` (Enum: X, TikTok, Instagram, YouTube, Other)
    - `description` (Optional)
    - `campaign_tag` (Optional)
    - `timestamp`
    - `payload_hash`
    - `verification_status` (Enum: Unverified, Verified)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A creator can submit 10 links in under 2 minutes.
- **SC-002**: Ledger exports are usable by a sponsor without explanation (qualitative validation).
- **SC-003**: The app is usable with default browser styles (no custom design required).
- **SC-004**: No designer input is required to ship the MVP.

## Future Extensions (Out of Scope for MVP)

- Automated content validation
- Onchain anchoring
- Campaign management
- Revenue sharing
- White-labeling
- Multi-wallet profiles
