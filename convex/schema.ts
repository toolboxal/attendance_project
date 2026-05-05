
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
  // Your main application user table
  users: defineTable({
    // This is the string ID that links directly to the Better Auth user
    authUserId: v.string(),
    // Core profile fields you might want to mirror or add
    email: v.string(),
    name: v.optional(v.string()),
    // App-specific fields
    role: v.optional(v.union(v.literal("admin"), v.literal("member"))),
    tier: v.optional(v.union(v.literal("free"), v.literal("pass_7d"), v.literal("monthly"))),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    createdAt: v.number(),
  })
  // Create an index to quickly look up your app user by their Better Auth ID
  .index("by_authUserId", ["authUserId"])
  .index("by_email", ["email"]),

  // Event Sessions (Created by Admins)
  events: defineTable({
    adminId: v.id("users"),
    title: v.string(),
    joinCode: v.string(), // e.g., "ABCD-1234"
    maxStaff: v.number(),  // e.g., 20
    tier: v.union(v.literal("free"), v.literal("pass_7d"), v.literal("monthly")),
    expiresAt: v.optional(v.number()), // Unix timestamp for when the event expires
    isActive: v.boolean(),
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
});