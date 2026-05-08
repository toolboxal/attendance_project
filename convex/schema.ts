
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
    billingPlan: v.optional(v.union(v.literal("free"), v.literal("pay_as_you_go"), v.literal("pro_monthly"))),
    subscriptionExpiresAt: v.optional(v.number()), // Unix timestamp for sub end
    
    // Separated Credit Pools (Model A)
    oneTimeCredits: v.optional(v.number()), // Lifetime credits (Single Pass & Weekend Bundle)
    monthlyCredits: v.optional(v.number()), // Subscription credits (resets monthly, no rollover)
    monthlyCreditsResetAt: v.optional(v.number()), // Timestamp for next monthly credit reset
    
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
    location: v.optional(v.string()),         // Physical venue/address
    eventDate: v.optional(v.number()),        // Epoch timestamp for event day
    startTime: v.optional(v.string()),        // "16:00"
    endTime: v.optional(v.string()),          // "23:00"
    description: v.optional(v.string()),      // Notes, rules, guidelines
    sections: v.optional(v.array(v.string())),// Preset list of sections/areas

    liveAt: v.optional(v.number()),    // When they clicked "Go Live"
    expiresAt: v.optional(v.number()), // liveAt + 24 hours (or duration)
    
    createdAt: v.number(),
  }).index("by_joinCode", ["joinCode"]),

  // Job Scopes / Role Slots (Pre-created by Admins, claimed by liveStaff)
  roleSlots: defineTable({
    eventId: v.id("events"),
    title: v.string(),                         // e.g., "Receptionist - Morning Shift"
    role: v.union(v.literal("usher"), v.literal("attendant"), v.literal("supervisor")),
    section: v.optional(v.string()),           // e.g., "Main Foyer"
    timeSlot: v.optional(v.string()),          // e.g., "08:00 - 13:00"
    description: v.optional(v.string()),       // Specific duties
    
    // EPHEMERAL INVITE SECURITY
    inviteToken: v.optional(v.string()),       // Secure random token for WhatsApp/Email
    inviteTokenExpiresAt: v.optional(v.number()), // Link expiration timestamp
    
    // CLAIMED STAFF
    assignedStaffId: v.optional(v.id("liveStaff")), // Null if vacant/unclaimed
  })
  .index("by_event", ["eventId"])
  .index("by_inviteToken", ["inviteToken"])
  .index("by_assignedStaff", ["assignedStaffId"]),

  // Ephemeral Guest/Staff Users
  liveStaff: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    role: v.union(v.literal("usher"), v.literal("attendant"), v.literal("supervisor")),
    section: v.optional(v.string()), // e.g., "Section B" or "Door 1"
    accessToken: v.string(),         // The secret token stored in localStorage
    lastActive: v.number(),
    status: v.optional(v.union(v.literal("active"), v.literal("checked_out"))), // Support active shift rotation
    createdAt: v.number(),
  })
  .index("by_event", ["eventId"])
  .index("by_accessToken", ["accessToken"]),

  // Job Queues
  jobs: defineTable({
    eventId: v.id("events"),
    creatorId: v.id("liveStaff"),
    assigneeId: v.optional(v.id("liveStaff")),
    title: v.string(),               // e.g., "Latecomers needing Section C"
    details: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("resolved")),
    createdAt: v.number(),
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
  }).index("by_checkoutId", ["checkoutId"]),
});