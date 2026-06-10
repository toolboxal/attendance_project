# Duty Roster Tab — Product & Implementation Plan

## Implementation status (Phase 1)

| Item | Location |
| ---- | -------- |
| Split queries | [`convex/sections.ts`](../convex/sections.ts) — `getRosterLayout`, `getRosterStaff`, `getSectionReport`, `reportSectionStatus` |
| Live roster UI | [`src/routes/live/_dashboard/roster.tsx`](../src/routes/live/_dashboard/roster.tsx) |
| Slot row component | [`src/components/roster/RosterSlotRow.tsx`](../src/components/roster/RosterSlotRow.tsx) |

Phase 2+ items (presence dot, search, section headcount) are not yet implemented.

---

## Purpose

The **Roster** tab is the third pillar of the live helper dashboard (`/live/_dashboard`), alongside **Jobs** and **Alert**.

It answers two related questions (user-controlled via filter):

- **All:** What posts exist on this event, who is assigned, and what's still open?
- **Active only:** Who is checked in and on the floor right now?

---

## Confirmed product decisions

| Decision | Choice |
| -------- | ------ |
| Visibility | All helpers see the full event roster |
| Primary structure | Role-slot centric — every `roleSlot`, grouped by section |
| Vacant slots | Shown in **All** mode |
| Filter | **All** \| **Active only** (client-side) |
| Default filter | **All** |
| Primary actions | Read-only (staffing on admin dashboard) |

---

## Row model

Each row = one `roleSlot` (or orphan active staff under **Unassigned**):

- Post title, supervisor/staff badge, duties (`description`)
- Occupant: Vacant · Not checked in · Active · Checked out (muted)
- **You** highlight when occupant matches viewer

Sort: sections A→Z, Floating last; within section supervisors first, then title A→Z.

### Filter behavior

| Mode | Rows included |
| ---- | ------------- |
| **All** | Every role slot + unassigned active staff |
| **Active only** | Slots with `liveStaff.status === "active"` only |

Summary: `N roles · X filled · Y vacant` (All) or `N on duty · M supervisors` (Active only).

---

## Operational security

- Gated by `getLiveContext` (valid token, live event, not checked out)
- No `inviteToken` in API response
- **All** exposes vacant posts; **Active only** reduces coverage-gap visibility

---

## Phase 2+ (planned)

- Presence from `lastActive`
- `sessionStorage` for filter preference
- Section headcount/status on headers
- Client-side search

See the full plan in Cursor plans or expand this doc as features ship.
