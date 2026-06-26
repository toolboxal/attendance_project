
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
  // Your main application user table
  users: defineTable({
    authUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("member"))),
    
    // MONETIZATION FIELDS
    billingPlan: v.optional(v.union(v.literal("free"), v.literal("pro_monthly"))),
    subscriptionExpiresAt: v.optional(v.number()), // Polar current_period_end (cached from webhooks)
    subscriptionCancelAtPeriodEnd: v.optional(v.boolean()), // true after subscription.canceled until revoked
    
    // Separated Credit Pools (Model A)
    freeTrialCredits: v.optional(v.number()), // Signup gift only (5 staff events, never pro)
    oneTimeCredits: v.optional(v.number()), // Lifetime credits (Single Pass & Bundle)
    monthlyCredits: v.optional(v.number()), // Subscription credits (reset on order.paid renewal)
    
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    createdAt: v.number(),
  })
  .index("by_authUserId", ["authUserId"])
  .index("by_email", ["email"]),

  // Event Sessions (Created by Admins)
  events: defineTable({
    adminId: v.id("users"),
    title: v.string(),
    joinCode: v.string(), 
    maxStaff: v.number(), 
    
    // THE LIFECYCLE
    // draft: Setup mode (Pro features configured but not active)
    // live: Active mode (Pro features running, timer is ticking)
    // archived: Read-only mode (Timer expired)
    status: v.union(v.literal("draft"), v.literal("live"), v.literal("archived")),
    
    // TIERING
    tier: v.union(v.literal("free"), v.literal("pro")),
    
    // NEW EVENT PARAMETERS
    location: v.string(),         // Physical venue/address
    eventDate: v.number(),        // Epoch timestamp for event day
    startTime: v.string(),        // "16:00"
    description: v.optional(v.string()),      // Notes, rules, guidelines

    liveAt: v.optional(v.number()),    // When they clicked "Go Live"
    expiresAt: v.optional(v.number()), // liveAt + 24 hours (or duration)
    
  })
  .index("by_joinCode", ["joinCode"])
  .index("by_admin", ["adminId", "eventDate"]),

  eventSections: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    headcount: v.number(),
    occupancyFill: v.union(
      v.literal("0"),
      v.literal("25"),
      v.literal("50"),
      v.literal("75"),
      v.literal("90"),
      v.literal("full"),
    ),
    activity: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("busy"),
      v.literal("overload"),
    ),
    headcountReporting: v.boolean(),
    includeInTotal: v.boolean(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    lastUpdatedAt: v.optional(v.number()),
    lastUpdatedBy: v.optional(v.id("liveStaff")),
  }).index("by_event", ["eventId"]),

  // Job Scopes / Role Slots (Pre-created by Admins, claimed by liveStaff)
  roleSlots: defineTable({
    eventId: v.id("events"),
    title: v.string(),                         // e.g., "Receptionist - Morning Shift"
    role: v.union(v.literal("supervisor"), v.literal("staff")),
    sectionId: v.optional(v.id("eventSections")), // Linked relation instead of string
    description: v.optional(v.string()),       // Specific duties
    
    // EPHEMERAL INVITE SECURITY
    inviteToken: v.optional(v.string()),       // Secure random token for WhatsApp/Email
    
    // CLAIMED STAFF
    assignedStaffId: v.optional(v.id("liveStaff")), // Null if vacant/unclaimed
  })
  .index("by_event", ["eventId"])
  .index("by_inviteToken", ["inviteToken"])
  .index("by_assignedStaff", ["assignedStaffId"]),

  // Ephemeral Guest/Staff Users
  liveStaff: defineTable({
    eventId: v.id("events"),
    staffName: v.string(),
    role: v.union(v.literal("supervisor"), v.literal("staff")),
    sectionId: v.optional(v.id("eventSections")), // Tracks their active physical post
    accessToken: v.string(),         // The secret token stored in localStorage
    lastActive: v.number(),
    status: v.optional(v.union(v.literal("unclaimed"), v.literal("active"), v.literal("checked_out"))), // Support active shift rotation
    adminUserId: v.optional(v.id("users")), // Admin floor session (not tied to a role slot)
    operationalRoleTitle: v.optional(v.string()), // Admin-only descriptive label when covering a section
  })
  .index("by_event", ["eventId"])
  .index("by_accessToken", ["accessToken"])
  .index("by_event_admin", ["eventId", "adminUserId"]),

  // Job Queues
  jobs: defineTable({
    eventId: v.id("events"),
    creatorId: v.id("liveStaff"),
    claimerId: v.optional(v.id("liveStaff")),        // The Usher who claimed it
    originSectionId: v.optional(v.id("eventSections")), // Where the job was dispatched from
    destinationSectionId: v.optional(v.id("eventSections")), // Where the usher is taking them
    personCount: v.number(),
    requestType: v.string(),         // "vip", "wheelchair", "regular", etc.
    description: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("resolved")),
  }).index("by_event", ["eventId"]),

  // Live incident alerts (radio-style queue)
  alerts: defineTable({
    eventId: v.id("events"),
    creatorId: v.id("liveStaff"),
    sectionId: v.optional(v.id("eventSections")),
    alertType: v.string(),
    body: v.string(),
    photoId: v.optional(v.id("_storage")),
    isPinned: v.boolean(),
    pinnedAt: v.optional(v.number()),
    pinnedById: v.optional(v.id("liveStaff")),
    status: v.union(v.literal("open"), v.literal("resolved")),
    resolvedAt: v.optional(v.number()),
    resolvedById: v.optional(v.id("liveStaff")),
  }).index("by_event", ["eventId"]),

  alertUpdates: defineTable({
    alertId: v.id("alerts"),
    eventId: v.id("events"),
    authorId: v.id("liveStaff"),
    content: v.string(),
  }).index("by_alert", ["alertId"]),

  // Admin read cursors for live alert notifications (header bell)
  adminAlertReadState: defineTable({
    adminId: v.id("users"),
    alertId: v.id("alerts"),
    eventId: v.id("events"),
    lastSeenUpdateCount: v.number(),
    updatedAt: v.number(),
  })
    .index("by_admin_alert", ["adminId", "alertId"])
    .index("by_admin_event", ["adminId", "eventId"]),

  // Admin-published security watchlist (banned persons, prohibited items)
  eventWatchlist: defineTable({
    eventId: v.id("events"),
    kind: v.union(v.literal("banned_person"), v.literal("prohibited_item")),
    label: v.string(),
    notes: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    status: v.union(v.literal("active"), v.literal("removed")),
    createdByAdminId: v.id("users"),
    removedAt: v.optional(v.number()),
    removedByAdminId: v.optional(v.id("users")),
  }).index("by_event", ["eventId"]),

  watchlistUpdates: defineTable({
    watchlistEntryId: v.id("eventWatchlist"),
    eventId: v.id("events"),
    authorId: v.id("liveStaff"),
    content: v.string(),
  }).index("by_entry", ["watchlistEntryId"]),

  // Admin live-floor broadcasts (one active at a time per event)
  broadcasts: defineTable({
    eventId: v.id("events"),
    content: v.string(),
    createdByStaffId: v.id("liveStaff"),
    createdAt: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  }).index("by_event", ["eventId"]),

  // Discord-like Messages
  messages: defineTable({
    eventId: v.id("events"),
    senderId: v.id("liveStaff"),
    content: v.string(),
    channel: v.string(),             // e.g., "general", "section-a", "door-attendants"
    createdAt: v.number(),
  }).index("by_event", ["eventId"]),

  // Permanent Transaction History
  payments: defineTable({
    authUserId: v.string(),
    checkoutId: v.string(),
    timestamp: v.string(),
    orderId: v.string(),
    invoiceNo: v.string(),
    totalAmount: v.number(),
    currency: v.string(),
    discountAmount: v.number(),
    netAmount: v.number(),
    productName: v.string(),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_checkoutId", ["checkoutId"])
    .index("by_authUserId", ["authUserId"]),
});