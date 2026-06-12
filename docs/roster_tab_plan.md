# Duty Roster Tab — Product & Implementation Reference

## Purpose

The **Roster** tab is the third pillar of the live helper dashboard (`/live/_dashboard/roster`), alongside **Jobs** and **Alert**.

It answers:

1. **Who is on duty** — assigned helpers per section (`active` and not-yet-checked-in `unclaimed`).
2. **How busy each section is** — activity level, occupancy fill, and reported headcount on accordion headers.
3. **Event-wide crowd total** — sum of section headcounts where `includeInTotal` is enabled, with a proportional breakdown chart.

Staffing changes (assign names, revoke, invite links) remain on the **admin event dashboard**. The live roster is read-only for role assignments.

---

## Implementation status

| Item | Location | Notes |
| ---- | -------- | ----- |
| Split queries | [`convex/sections.ts`](../convex/sections.ts) | `getRosterLayout`, `getRosterStaff`, `getSectionReport`, `reportSectionStatus` |
| Live roster page | [`src/routes/live/_dashboard/roster.tsx`](../src/routes/live/_dashboard/roster.tsx) | Layout, total headcount, accordion, report panel |
| Section accordion | [`src/components/roster/RosterSectionAccordion.tsx`](../src/components/roster/RosterSectionAccordion.tsx) | Expandable sections + staff list |
| Crowd header | [`src/components/roster/SectionCrowdHeader.tsx`](../src/components/roster/SectionCrowdHeader.tsx) | Metrics + include-in-total switch |
| Slot row | [`src/components/roster/RosterSlotRow.tsx`](../src/components/roster/RosterSlotRow.tsx) | Occupant status + post title |
| Headcount breakdown | [`src/components/roster/SectionHeadcountBreakdown.tsx`](../src/components/roster/SectionHeadcountBreakdown.tsx) | CSS bar chart at top |
| Include-in-total switch | [`src/components/roster/SectionIncludeInTotalSwitch.tsx`](../src/components/roster/SectionIncludeInTotalSwitch.tsx) | Supervisor/admin toggle |
| Section report panel | [`src/components/roster/SectionReportPanel.tsx`](../src/components/roster/SectionReportPanel.tsx) | Bottom sheet for assigned section |
| Shared report types/helpers | [`src/lib/sectionReport.ts`](../src/lib/sectionReport.ts) | Activity, occupancy enums, colors |
| Section defaults | [`convex/sectionDefaults.ts`](../convex/sectionDefaults.ts) | New sections start with reporting off |

### Not implemented (deferred)

| Item | Original plan |
| ---- | ------------- |
| **All \| Active only** filter toggle | Superseded by a fixed view: assigned `active` + `unclaimed` only |
| Vacant role slots in list | Vacant posts are omitted from the accordion body |
| Presence dot from `lastActive` | — |
| Client-side search | — |
| `sessionStorage` filter preference | — |

---

## Page layout

```
┌─────────────────────────────────────────┐
│ Total headcount + breakdown chart       │  ← when any includeInTotal section has headcount > 0
│ (or "Event Roster" intro copy)          │  ← otherwise
├─────────────────────────────────────────┤
│ ▼ Section accordion (multiple open)     │
│   · crowd header per section            │
│   · staff rows when expanded            │
├─────────────────────────────────────────┤
│ Section report panel (collapsible)      │  ← only if viewer has a role slot in a named section
└─────────────────────────────────────────┘
```

### Top: event total

- **Total headcount** = sum of `section.headcount` for named sections where `includeInTotal === true`.
- **Breakdown chart** lists those same sections (headcount > 0), sorted highest first.
- Bar width is proportional to the largest headcount in the list; bar color follows `occupancyFill`.
- When no qualifying sections exist, the intro block ("Event Roster" + description) is shown instead.

### Middle: section accordion

Each section row (`RosterSectionAccordion` + `SectionCrowdHeader`) shows:

| Field | When shown |
| ----- | ---------- |
| Section name + shift range | Always |
| Staff count (`N active`) | Always (active only; pending not counted in header) |
| Activity level | Always |
| Occupancy (text label, colored) | Always |
| Headcount | When `section.headcount > 0` |
| Include-in-total switch | When headcount is shown (headcount > 0) |

Expand a section to see staff rows (`RosterSlotRow`).

### Bottom: section report panel

Shown only when the viewer is assigned to a **named** section via a `roleSlot` (`isViewer` on a slot in that section).

Fields: activity, headcount-reporting toggle, occupancy fill, headcount (numeric input). Submit calls `reportSectionStatus`. Panel closes on successful save.

---

## Staff visibility

### Rows shown in accordion body

| Case | `staffStatus` | Shown? | Label |
| ---- | ------------- | ------ | ----- |
| Checked in | `active` | Yes | **Name · Active** |
| Assigned, invite not accepted | `unclaimed` | Yes | **Name · Not checked in** |
| Checked out | `checked_out` | No | — |
| Vacant post (no `assignedStaffId`) | — | No | — |
| Assigned but status missing/undefined | `undefined` | No | Known gap — see below |

Filter in `RosterSectionAccordion`:

```ts
slots.filter((s) => s.staffStatus === "active" || s.staffStatus === "unclaimed")
```

Header **active count** uses only `status === "active"` (pending helpers do not increment it).

### Orphan staff

Active `liveStaff` with no `roleSlot` assignment appear under the synthetic **Unassigned** section (`UNASSIGNED_SECTION_KEY`). Only `status === "active"` orphans are included today.

### Section ordering

From `getRosterLayout`:

1. Named sections (with at least one role slot), A→Z by name.
2. **Floating** — slots with no `sectionId`.
3. **Unassigned** — orphan active staff only.

Within a section: supervisors first, then post title A→Z.

### Row model

Each visible row = one assigned helper on a `roleSlot` (or one orphan under Unassigned):

- Occupant line (status + name)
- Post title, optional duties (`description`)
- Role badge (`supervisor` / `staff`)
- `isViewer` is computed server-side (not yet used for row highlight in UI)

---

## Pending (`unclaimed`) staff — data model

| Signal | Meaning |
| ------ | ------- |
| `liveStaff.status === "unclaimed"` | Admin assigned a name; helper has not checked in |
| `roleSlot.inviteToken` present | Invite link still valid (same as admin "Pending Mode") |
| `claimStaffInvite` | Sets `status: "active"`, clears `inviteToken` |

`getRosterStaff` currently sets `staffStatus` from `liveStaff.status` only. If status is missing but the slot still has an `inviteToken`, the row may be dropped by the UI filter. **Planned fix:** derive pending state from `inviteToken` in `resolveSlotStaffStatus()` (see backlog).

**Event date does not gate the roster.** Live access requires `event.status === "live"` and the event not being archived or past `expiresAt` (24h window from go-live). A future `eventDate` (e.g. go live on June 11 for a June 12 event) is allowed.

---

## Section crowd reporting

Persisted on `eventSections` (defaults in `sectionDefaults.ts`):

| Field | Type | Default |
| ----- | ---- | ------- |
| `activity` | `low` \| `normal` \| `busy` \| `overload` | `normal` |
| `occupancyFill` | `0` \| `25` \| `50` \| `75` \| `90` \| `full` | `0` |
| `headcount` | non-negative integer | `0` |
| `headcountReporting` | boolean | `false` |
| `includeInTotal` | boolean | `false` |
| `lastUpdatedAt` / `lastUpdatedBy` | audit | — |

Legacy `occupancyFill: "overflow"` is normalized to `"50"` in queries.

Disabling `headcountReporting` via `reportSectionStatus` also forces `includeInTotal` to `false`.

---

## Permissions (`reportSectionStatus`)

| Field | Who can update |
| ----- | -------------- |
| `activity`, `headcountReporting`, `occupancyFill`, `headcount` | Viewer assigned to that section (`requireSectionAssignment`) |
| `includeInTotal` | Admin or supervisor on the live floor (`requireSupervisor`) — does **not** require `headcountReporting` |

UI: `canToggleIncludeInTotal` = `profile.isAdmin || profile.isSupervisor` in `roster.tsx`.

---

## API summary

All endpoints take `accessToken` and are gated by `getLiveContext` (valid token, live event, staff not `checked_out`). `inviteToken` is never returned.

| Query / mutation | Returns / does |
| ---------------- | -------------- |
| `getRosterLayout` | Section list with crowd fields; synthetic Floating / Unassigned keys |
| `getRosterStaff` | `staffBySection: Record<sectionKey, SlotRow[]>` |
| `getSectionReport` | Single section report snapshot + last reporter name |
| `reportSectionStatus` | Patch section crowd fields |

Constants: `FLOATING_SECTION_KEY`, `UNASSIGNED_SECTION_KEY` in [`convex/constants.ts`](../convex/constants.ts).

---

## Operational security

- Full event roster visible to all checked-in helpers (and admin floor sessions).
- Vacant posts are **not** listed — reduces empty-post visibility vs the original "All" filter design.
- Checked-out staff are hidden from the accordion list.
- Staffing mutations remain on the authenticated admin dashboard (`createStaffInvitation`, `revokeStaffAccess`, etc.).

---

## Backlog / improvements

1. **`resolveSlotStaffStatus`** — treat `inviteToken` on slot as source of truth for pending; show `N active · M pending` in header.
2. **All \| Active filter** — optional if vacant-post visibility is needed again.
3. **Vacant slots** — show in accordion when filter is "All".
4. **Presence** — `lastActive` indicator on rows.
5. **Search** — client-side filter across sections.
6. **Viewer highlight** — use `isViewer` on `RosterSlotRow`.
