
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
    // 1. Subscription based (Time-limited unlimited access)
    subscriptionTier: v.optional(v.union(v.literal("free"), v.literal("pro_monthly"))),
    subscriptionExpiresAt: v.optional(v.number()), // Unix timestamp for sub end
    
    // 2. Credit based (One-time purchase per event)
    eventCredits: v.optional(v.number()), // Number of "Pro Event" credits available
    
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
    
    liveAt: v.optional(v.number()),    // When they clicked "Go Live"
    expiresAt: v.optional(v.number()), // liveAt + 24 hours (or duration)
    
    createdAt: v.number(),
  }).index("by_joinCode", ["joinCode"]),

  // Ephemeral Guest/Staff Users
  liveStaff: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    role: v.union(v.literal("usher"), v.literal("attendant"), v.literal("supervisor")),
    section: v.optional(v.string()), // e.g., "Section B" or "Door 1"
    token: v.string(),               // The secret token stored in localStorage
    lastActive: v.number(),
    createdAt: v.number(),
  })
  .index("by_event", ["eventId"])
  .index("by_token", ["token"]),

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