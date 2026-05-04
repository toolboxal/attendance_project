
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
    createdAt: v.number(),
  })
  // Create an index to quickly look up your app user by their Better Auth ID
  .index("by_authUserId", ["authUserId"])
  .index("by_email", ["email"]),
});