# Navigation UX Execution Checklist

## Source
- FINAL_Navigation_DataShare.md

## Review Summary (Gaps Identified)
- Service user navigation mixed too many primary actions and lacked clear request/consent grouping.
- Data owner navigation exposed extra items in primary nav instead of focused 5-item flow.
- Sidebar had no role-driven badge counts for urgency.
- Mobile navigation lacked hamburger drawer + overlay behavior.
- Service/data-owner dashboards did not show role-specific status snapshots.

## Phase 1 (MVP)
- [x] Role-focused sidebar structure (Service User / Data Owner / Admin)
- [x] Badge counts on primary items (pending and expiring attention)
- [x] Active state highlighting retained
- [x] Mobile hamburger + slide-in sidebar + overlay

## Phase 2 (Polish)
- [x] Expand/collapse grouped nav sections with animations
- [x] Sub-item badges per section (pending/fulfilled/rejected, active/expiring/expired)
- [x] Sidebar quick status details block (beyond single attention count)
- [x] Keyboard-accessible grouped controls (`button`, `aria-expanded`, focusable links)

## Phase 3 (Advanced)
- [~] Real-time badge updates via polling (30s interval). WebSocket not yet added.
- [ ] Navigation personalization/favorites
- [ ] Usage analytics for nav behavior

## Implementation Notes
- Added owner profile list and per-item request access flow on owner page.
- Added query-driven filtering for request and consent pages to match sub-navigation states.
- Kept existing routes functional while prioritizing new role UX in sidebar.
- Build verification passed after changes.
