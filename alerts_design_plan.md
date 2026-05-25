# Alerts Tab — Design Plan

Live staff alert queue for the `/live/alert` tab. UI mirrors the Jobs tab (`jobs.tsx` + `DispatchPanel` + `JobItem`). Backend mirrors the jobs pattern (`convex/jobs.ts` + `jobs` table).

---

## Product summary

- Queue of up to **10 active alerts** per event.
- **Staff (helpers)** and **supervisors** can post alerts (e.g. chair broken, spillage on row 1, lost child).
- Anyone on the floor can tap **Resolve** to remove an alert from the active queue.
- **Supervisors only** can **pin** any active alert to the top (max **3 pins**).
- **Admin** posts **disaster broadcasts** from the admin dashboard — always the topmost item (separate from pins).
- Compose UI matches `DispatchPanel`: tag pills + **textarea** (no person-count stepper) + send button.

---

## UI layout

Clone `src/routes/live/_dashboard/jobs.tsx`:

```
┌─ Header (profile — same as jobs) ────────────────────┐
├─ "Active Alerts ( 3 / 10 Max)" counter ──────────────┤
├─ Scrollable queue ───────────────────────────────────┤
│  [AlertItem] broadcast — disaster styling            │
│  [AlertItem] pinned — pin indicator                  │
│  [AlertItem] normal                                  │
└─ AlertPanel (fixed bottom-16, like DispatchPanel) ──┘
```

### AlertPanel

Based on `src/components/jobs/DispatchPanel.tsx`:

- Horizontal tag pills (same styling as jobs)
- **Textarea** instead of short text `Input`
- No person-count stepper
- Send disabled when queue is full (`activeAlerts.length >= activeAlertLimit`)

### AlertItem

Based on `src/components/jobs/JobItem.tsx`:

- Header: author name, role, role title (yellow pulse if current user is author)
- Body: tag badge + message text
- Footer: **Resolve** button
- Supervisor-only: **Pin** / **Unpin** on any card

Visual tiers:

| Tier        | Styling                               |
| ----------- | ------------------------------------- |
| `broadcast` | Red/amber, pulsing, "BROADCAST" badge |
| `pinned`    | Pin icon, elevated card               |
| `normal`    | Same `bg-zinc-700` card as jobs       |

---

## Predefined tags

Shared constant (mirror jobs' inline tag array):

```typescript
// src/lib/alert-tags.ts
export const ALERT_TAGS = [
  'general',
  'medical',
  'security',
  'lost_child',
  'maintenance', // chair broken, equipment
  'spillage',
  'crowd',
  'other',
] as const
```

---

## Queue sort order

| Rank | Tier        | Rule                                                                                                              |
| ---- | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| 1    | `broadcast` | Admin disaster message — always top. Recommend **max 1 active**; new broadcast replaces or rejects if one exists. |
| 2    | `pinned`    | Supervisor-pinned — max 3, sorted by `pinnedAt` asc (FIFO among pins).                                            |
| 3    | `normal`    | Everything else — FIFO by `createdAt` asc.                                                                        |

Query: filter `eventId` + `status === "active"`, sort in handler, `take(activeAlertLimit)`.

---

## Permissions

| Action                          | Staff (helper) | Supervisor            | Admin                         |
| ------------------------------- | -------------- | --------------------- | ----------------------------- |
| Post alert                      | ✅             | ✅                    | ✅ (admin UI, not live token) |
| Resolve alert                   | ✅             | ✅                    | ✅                            |
| Pin / unpin                     | ❌             | ✅ (any active alert) | ❌                            |
| Broadcast (`tier: "broadcast"`) | ❌             | ❌                    | ✅                            |

Pin mutation checks:

- Caller `liveStaff.role === "supervisor"`
- Count active alerts where `tier === "pinned"` < `maxPinnedAlerts` (default 3)

Post mutation checks:

- Any authenticated `liveStaff`
- Count active alerts < `event.activeAlertLimit ?? 10`

Broadcast mutation checks:

- Admin auth + `events.adminId` match
- Not `asistir_staff_token`

---

## Schema

### New table: `alerts`

Do **not** reuse `messages` — alerts need status, tiers, pins, and a queue cap.

```typescript
alerts: defineTable({
  eventId: v.id("events"),

  // Author (discriminated)
  authorType: v.union(v.literal("staff"), v.literal("admin")),
  authorStaffId: v.optional(v.id("liveStaff")),   // staff + supervisor posts
  authorAdminId: v.optional(v.id("users")),       // disaster broadcast

  // Content
  tag: v.union(
    v.literal("general"),
    v.literal("medical"),
    v.literal("security"),
    v.literal("lost_child"),
    v.literal("maintenance"),
    v.literal("spillage"),
    v.literal("crowd"),
    v.literal("other"),
  ),
  message: v.string(),

  // Priority / ordering
  tier: v.union(
    v.literal("normal"),
    v.literal("pinned"),
    v.literal("broadcast"),
  ),
  pinnedAt: v.optional(v.number()),
  pinnedByStaffId: v.optional(v.id("liveStaff")),

  // Lifecycle — same simplicity as jobs (no resolver metadata)
  status: v.union(v.literal("active"), v.literal("resolved")),
  createdAt: v.number(),
})
  .index("by_event", ["eventId"])
  .index("by_event_status", ["eventId", "status"]),
```

### Event config (on `events` table)

```typescript
activeAlertLimit: v.optional(v.number()),  // default 10
maxPinnedAlerts: v.optional(v.number()), // default 3
```

---

## Schema field decisions

### `sectionId` — omit

**Not stored on the alert document.**

Jobs stores `originSectionId` as a snapshot of where the job was dispatched. For alerts, location is usually in the message itself ("spillage on row 1", "chair broken gate B"). Supervisors triage by reading the message, not by section header.

If you want a jobs-style section label in the card header later, **derive it at query time** from `authorStaffId → liveStaff.sectionId → eventSections.name`. No need to denormalize onto the alert row unless staff frequently change sections mid-shift and you need a frozen "posted from" location — unlikely for short-lived alerts.

### `resolvedAt`, `resolvedByStaffId`, `resolvedByAdminId` — omit

**Not needed for v1.** Jobs resolves the same way: patch `status: "resolved"` and nothing else.

```typescript
// jobs table — no resolver fields
status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("resolved")),
createdAt: v.number(),
```

Resolver metadata only matters if you build an **audit/history tab** ("who cleared the lost-child alert at 14:32?"). That can be added later without breaking the active queue. For now, resolved rows stay in the DB (filter them out of `getActiveAlerts`) or you can delete on resolve — pick one when implementing.

---

## Convex API surface

Mirror `convex/jobs.ts`:

| Function                 | Purpose                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `alerts.getActiveAlerts` | Enriched active list (author name, role title — copy enrichment from `getActiveJobs`) |
| `alerts.postAlert`       | Staff/supervisor create (`tier: "normal"`)                                            |
| `alerts.resolveAlert`    | Patch `status: "resolved"`                                                            |
| `alerts.pinAlert`        | Supervisor only, max 3                                                                |
| `alerts.unpinAlert`      | Supervisor only → `tier: "normal"`, clear pin fields                                  |
| `alerts.postBroadcast`   | Admin-only disaster message                                                           |
| `alerts.clearBroadcast`  | Admin resolves/removes broadcast                                                      |

Reuse `getAuthenticatedStaff()` from `jobs.ts` for live-staff mutations.

---

## Example documents

**Helper posts spillage:**

```json
{
  "eventId": "...",
  "authorType": "staff",
  "authorStaffId": "abc123",
  "tag": "spillage",
  "message": "Spillage on row 1, need mop",
  "tier": "normal",
  "status": "active",
  "createdAt": 1716480000000
}
```

**Supervisor pins a lost-child alert:**

```json
{
  "tier": "pinned",
  "pinnedAt": 1716480060000,
  "pinnedByStaffId": "supervisor_xyz"
}
```

**Admin disaster broadcast:**

```json
{
  "authorType": "admin",
  "authorAdminId": "user_admin",
  "tag": "security",
  "message": "EVACUATE SECTION B — proceed to Gate C immediately",
  "tier": "broadcast",
  "status": "active",
  "createdAt": 1716480100000
}
```

---

## Open decisions (pick at implementation)

1. **Resolve scope** — Any helper resolves any alert (recommended for speed), or only author + supervisors?
2. **Single broadcast** — One active disaster message at a time (recommended), or allow stacking?
3. **Resolved row retention** — Keep in DB for future history query, or delete on resolve?
4. **Section in card header** — Derive live from author's current section at read time, or skip entirely?

---

## Why not extend `jobs`?

Jobs have `personCount`, `claimerId`, and a pending → accepted → resolved workflow. Alerts are post → (optional pin) → resolve. A separate table keeps mutations simple and avoids overloading job semantics.

---

## File checklist (implementation)

| File                                   | Action                            |
| -------------------------------------- | --------------------------------- |
| `convex/schema.ts`                     | Add `alerts` table + event limits |
| `convex/alerts.ts`                     | Queries and mutations             |
| `src/lib/alert-tags.ts`                | Tag constants                     |
| `src/components/alerts/AlertPanel.tsx` | Compose panel (textarea)          |
| `src/components/alerts/AlertItem.tsx`  | Queue card                        |
| `src/routes/live/_dashboard/alert.tsx` | Wire up like `jobs.tsx`           |
| Admin event UI                         | Broadcast post/clear (later)      |
