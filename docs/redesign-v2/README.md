# Clausentis redesign v2 — implementation spec

Approved design for the whole app. Canvas (live, same content):
https://claude.ai/artifact/VyPKNWN7LLauH2Rq48cnhL

- `screens/*.dc.html` — one file per screen. Open any of them in a browser to see the layout
  (they reference `../theme.css`). Markup inside `<x-dc>` is the design; `{{holes}}`, `<sc-for>` and
  `<sc-if>` are template loops/branches whose sample data is in the `renderVals()` script at the
  bottom of each file. **That sample data is illustration only — the app must render real data**
  from the sources listed below.
- `theme.css` — the design tokens and primitives (colours, type, pills, category chips, tiles, nav,
  chart chrome). Port these into Tailwind v4 tokens / small components.
- `canvas.json` — screen titles and sizes.

## Visual system

| Token | Value | Use |
|---|---|---|
| Page background | `#F8FAFC` (slate-50) | app screens; cards sit on it |
| Card | `#FFFFFF`, border `#E2E8F0`, radius 12px, shadow `0 1px 2px rgba(15,23,42,.04)` | |
| Text | `#0F172A` primary, `#475569` secondary, `#64748B` muted (min — passes 4.5:1) | never lighter |
| Accent (interactive only) | `#1D4ED8` buttons/links/active tab/focus ring; hover `#1E40AF` | |
| Data marks | `#2563EB` | single-series bars/columns/dots |
| Navy | `#0F172A` officer sidebar; `#1E3A8A` summary bands + sign-in side panel | |
| Status (reserved) | pass `#047857`, review `#F59E0B`, fail `#B91C1C`, missing = hatched `#94A3B8` | charts; pills use tinted bg + dark text (see theme.css) |
| Category chips | Financial blue, Experience orange, Statutory violet, Technical cyan, Legal pink, Quality indigo | always with text label; never colour-only series |
| Fonts | Lexend (headings, big numbers, wordmark) + Source Sans 3 (body) via `next/font/google`; `ui-monospace` for IDs/refs | |

Rules: status colours only mean pass/review/fail; every status also has a text label or hatch;
charts are inline SVG/HTML (no chart library needed), with `<title>` tooltips, direct labels and a
legend when there are 2+ series; visible `:focus-visible` ring; hover transitions 150–300ms;
`prefers-reduced-motion` respected; no emoji icons (use `lucide-react`, already installed).

## Route map (new flow)

Officer (`/authority/*`, navy sidebar = `screens/OfficerNav.dc.html`):

| Screen | Route | Data source |
|---|---|---|
| A1 Overview | `/authority/dashboard` | `getAllBidderDossiers()` + `getTenderSource('imported')` — clause outcome stacked bars, score bars, decision queue, closing-date timeline |
| A2 Tenders | `/authority/tenders` | tender source + dossier counts per tender |
| A3 Publish tender | `/authority/tenders/new` | existing `createAuthorityTenderAction` / analyze flow; clause table + clauses-by-category chart |
| A4 Tender workspace | `/authority/tenders/[id]` (move `compare-bids` here; redirect old path) | dossiers for tender; bid cards + clause×bidder heatmap |
| A5 Bid review | `/authority/bids/[id]` | `getBidderDossier(id)`; bullet charts from requirement results; portal checks from `statutoryVerifications`; keep `OfficerDecisionSection` logic |
| A6 Sign decision | modal on A5 | `signProcurementDecision` (server action — keep its validation) |
| A7 Portal verification | `/authority/government-verification` | `POST /api/government/verify` (auth required) |
| A8 Audit trail | `/authority/audit` | dossier `auditEvents` + `audit_events` table; actor/bid bar charts |
| A9 Reports | `/authority/reports` | `getAllStructuredReports()` + existing PDF download route |
| A10 Assistant | `/authority/assistant` | `askClausentisAssistant(message, history, context)` |
| A11 Data sources | `/authority/integrations` (replaces `/authority/sih-coverage`; redirect) | static list; mark every connector "Sandbox" unless a live adapter exists (`LIVE_ADAPTERS` in `src/lib/verification/engine.ts`) |
| A12 Settings | `/authority/settings` | `getUserProfile()`; role is read-only |

Bidder (`/bidder/*`, top bar = `screens/BidderNav.dc.html`):

| Screen | Route | Data source |
|---|---|---|
| B1 Home | `/bidder/dashboard` | `getMyBidSubmissionsAction()`, `getBidderProfileAction()`, tender source |
| B2 Find tenders | `/bidder/tenders` | `searchActiveTendersAction()`; eligibility mini-bullets vs profile turnover/experience |
| B3 Tender & eligibility | `/bidder/tenders/[id]` | `getDiscoveredTenderAction(id)` + profile |
| B4 Prepare & check bid | `/bidder/tenders/[id]/prepare` | reuse `BidDocumentUploader`, `runBidVerificationAction`, `submitBidPackageAction(tenderId, profile, documents, version, options)` |
| B5 Submitted receipt | `/bidder/bids/[id]/receipt` | `getBidSubmissionReceiptAction(id)` + `getLatestProcurementDecision` |
| B6 My bids | `/bidder/bids` | `getMyBidSubmissionsAction()` |
| B7 Document vault | `/bidder/documents` | `getBidderDocuments()` etc. |
| B8 Assistant | `/bidder/assistant` | `askClausentisAssistant` |
| B9 Company profile | `/bidder/settings` | `getBidderProfileAction()` |

Public: Landing `/`, Sign in `/login`, Register `/signup` (bidder only — no role picker), Reset `/forgot-password`.

Retire/redirect: `/dashboard`, `/tenders*`, `/documents`, `/reports*`, `/settings` → role portal;
`/authority/compliance`, `/authority/matched-requirements` → A4; `/authority/documents` → A5;
`/bidder/compliance`, `/bidder/government-verification`, `/bidder/eligibility`, `/bidder/reports`,
`/bidder/tenders/[id]/compare`, `/bidder/tenders/[id]/eligibility`, `/tenders/discover` → nearest new screen.
3D/landing-effect components and dashboard motion backgrounds are no longer used.
