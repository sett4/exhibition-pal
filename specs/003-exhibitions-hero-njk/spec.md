# Feature Specification: Google Drive Image URL Transformation

**Feature Branch**: `003-exhibitions-hero-njk`
**Created**: 2025-10-10
**Status**: Draft
**Input**: User description: "現在 exhibitions-hero.njk に含まれている画像は表示されていません。なぜならURLはGoogle Driveの共有リンクであり、直接画像を表示するためのリンクではないからです。Google Driveの共有リンクは、画像を表示するための適切な形式に変換する必要があります。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exhibition Hero Image Display (Priority: P1)

Visitors viewing the exhibitions page or an individual exhibition detail page see the hero image rendered correctly when the image is hosted on Google Drive.

**Why this priority**: This is the core visual element that attracts users and provides context for each exhibition. Without properly displayed images, the user experience is severely degraded and the site appears broken.

**Independent Test**: Can be fully tested by visiting the exhibitions index page or any exhibition detail page with a Google Drive-hosted image URL and confirming the hero image renders correctly in the browser.

**Acceptance Scenarios**:

1. **Given** an exhibition has a Google Drive sharing link in the imageUrl field, **When** a visitor loads the exhibitions index page, **Then** the hero image for that exhibition displays correctly without broken image indicators
2. **Given** an exhibition has a Google Drive sharing link in the imageUrl field, **When** a visitor navigates to that exhibition's detail page, **Then** the hero image displays correctly at the top of the page
3. **Given** an exhibition has a valid direct image URL (not Google Drive), **When** the visitor loads any page featuring that exhibition, **Then** the image continues to display correctly without regression

---

### User Story 2 - Consistent Image Loading Performance (Priority: P2)

Visitors experience consistent and reliable image loading times when viewing exhibition images sourced from Google Drive.

**Why this priority**: Image loading performance impacts user perception and engagement. While not blocking basic functionality, poor performance creates a suboptimal experience.

**Independent Test**: Can be tested by measuring image load times using browser developer tools on pages with Google Drive images and confirming they meet acceptable thresholds.

**Acceptance Scenarios**:

1. **Given** exhibition images are sourced from Google Drive, **When** a visitor loads a page with these images, **Then** images begin rendering within 2 seconds on a standard broadband connection
2. **Given** multiple exhibitions with Google Drive images are displayed on the same page, **When** the page loads, **Then** all images load successfully without timeout errors

---

### User Story 3 - Graceful Fallback for Invalid URLs (Priority: P3)

When an image URL cannot be transformed or the image fails to load, visitors see a meaningful placeholder instead of a broken image icon.

**Why this priority**: Error handling improves user experience but doesn't impact core functionality. Users can still access exhibition information even if images fail.

**Independent Test**: Can be tested by intentionally providing an invalid Google Drive URL or malformed sharing link and confirming the placeholder displays correctly.

**Acceptance Scenarios**:

1. **Given** an exhibition has an invalid or malformed Google Drive URL, **When** the page attempts to load the image, **Then** a styled placeholder with the exhibition's initials displays instead of a broken image
2. **Given** an exhibition has no imageUrl value provided, **When** the page loads, **Then** the existing placeholder behavior continues to work as expected

---

### Edge Cases

- What happens when a Google Drive link has restricted access permissions (not public)?
- How does the system handle Google Drive URLs in different formats (e.g., `/file/d/`, `/open?id=`, legacy formats)?
- What happens when Google Drive is temporarily unavailable or rate-limits requests?
- How does the system handle non-image files shared via Google Drive links?
- What happens when the Google Drive file ID is valid but the file has been deleted?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect when an imageUrl contains a Google Drive sharing link pattern
- **FR-002**: System MUST transform Google Drive sharing links into direct image URLs that can be embedded in HTML img tags
- **FR-003**: System MUST support common Google Drive URL formats including `/file/d/FILE_ID/view` and `/open?id=FILE_ID`
- **FR-004**: System MUST preserve non-Google-Drive image URLs without modification
- **FR-005**: System MUST extract the file ID from various Google Drive URL formats
- **FR-006**: System MUST construct a direct image URL using the extracted file ID in the format that Google Drive supports for embedding
- **FR-007**: System MUST apply the URL transformation during the data transformation phase before templates receive the data
- **FR-008**: System MUST handle cases where Google Drive URLs cannot be parsed by logging a warning and returning the original URL

### Key Entities *(include if feature involves data)*

- **Exhibition**: Represents an art exhibition with metadata including title, dates, venue, and an imageUrl field that may contain either a direct image URL or a Google Drive sharing link
- **Image URL**: A string value that can be either a direct-access image URL (http/https pointing to an image file) or a Google Drive sharing link that requires transformation
- **Google Drive File ID**: A unique identifier extracted from Google Drive URLs, typically a 33-character alphanumeric string with hyphens and underscores

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Exhibition pages display hero images correctly for 100% of exhibitions with valid Google Drive URLs
- **SC-002**: Image transformation adds no more than 50 milliseconds to the overall data transformation process
- **SC-003**: Visitors report zero instances of broken images for exhibitions with properly configured Google Drive links
- **SC-004**: The system processes all common Google Drive URL formats without requiring manual URL updates in the spreadsheet
- **SC-005**: 100% of existing exhibitions with Google Drive URLs render images successfully after the transformation is implemented

## Out of Scope

- Caching or downloading Google Drive images to local storage
- Supporting Google Drive links that require authentication or are not publicly accessible
- Automatic validation of whether Google Drive links point to valid image files
- Migration or updating of existing Google Drive URLs in the source spreadsheet
- Supporting other cloud storage providers (Dropbox, OneDrive, etc.)

## Assumptions

- Google Drive URLs in the spreadsheet follow Google's standard sharing link formats
- Images shared via Google Drive have public access permissions set (anyone with the link can view)
- The Google Drive API public embedding format (`https://drive.google.com/uc?export=view&id=FILE_ID`) will remain stable and supported
- Network connectivity to Google Drive services is reliable during page builds
- All images in Google Drive are in web-compatible formats (JPEG, PNG, WebP, GIF)
- The spreadsheet maintainer understands they should use Google Drive sharing links, not other link types

## Dependencies

- Google Sheets data loader (`src/_data/exhibitions.ts`) must be functioning correctly
- Data transformation pipeline (`src/_data/transformers.ts`) must process exhibition data before template rendering
- Exhibition templates (`exhibitions-hero.njk`) must receive transformed data with corrected image URLs
