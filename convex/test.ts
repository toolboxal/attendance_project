import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * 🧪 HIGH-SPEED TESTING SCRIPT
 * Generates a fully active test invite link directly from the Convex Dashboard!
 * Bypasses all frontend admin authentication gates.
 */
export const generateTestInvite = mutation({
	args: {
		slotId: v.optional(v.id("roleSlots")),
	},
	handler: async (ctx, args) => {
		// 1. 🕵️ Find a target role slot
		let targetSlot = null;

		if (args.slotId) {
			targetSlot = await ctx.db.get(args.slotId);
		} else {
			// 💎 Smart Scanner: Try to find an EMPTY/VACANT slot first so we don't overwrite real data!
			targetSlot = await ctx.db
				.query("roleSlots")
				.withIndex("by_assignedStaff", (q) => q.eq("assignedStaffId", undefined))
				.first();

			// Fallback: If every slot is taken, only then pick the first one and reuse it.
			if (!targetSlot) {
				targetSlot = await ctx.db.query("roleSlots").first();
			}
		}

		if (!targetSlot) {
			throw new Error(
				"❌ No Role Slots found in the database! Please create at least one Event with a Role Slot first.",
			);
		}

		// 2. 🛠️ Generate credentials
		const secureAccessToken =
			"test_access_" +
			Math.random().toString(36).substring(2, 15);
		const inviteToken =
			"test_token_" +
			Math.random().toString(36).substring(2, 10);

		// 3. 👥 Pre-create or update the test user
		let liveStaffId = targetSlot.assignedStaffId;

		if (!liveStaffId) {
			liveStaffId = await ctx.db.insert("liveStaff", {
				eventId: targetSlot.eventId,
				name: "🕵️ Test Agent (Dashboard)",
				role: targetSlot.role,
				sectionId: targetSlot.sectionId,
				accessToken: secureAccessToken,
				lastActive: Date.now(),
				status: "unclaimed", // Fresh status ready to be claimed!
			});
		} else {
			// If already assigned, just reset its status and token to "unclaimed" for the test!
			await ctx.db.patch(liveStaffId, {
				name: "🕵️ Test Agent (Dashboard Reset)",
				accessToken: secureAccessToken,
				status: "unclaimed",
				lastActive: Date.now(),
			});
		}

		// 4. 🛡️ Link it up in the slots
		await ctx.db.patch(targetSlot._id, {
			assignedStaffId: liveStaffId,
			inviteToken: inviteToken,
			inviteTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // Good for 24 hours
		});

		const localLink = `http://localhost:5173/live/${inviteToken}`;

		// 5. 🏁 Present the bounty in the dashboard logs!
		console.log("----------------------------------------");
		console.log("🎯 GENERATED TEST ACCESS LINK");
		console.log(`👉 ${localLink}`);
		console.log("----------------------------------------");

		return {
			success: true,
			message: "✅ Test invite generated!",
			testUser: "Test Agent (Dashboard)",
			inviteToken: inviteToken,
			localTestUrl: localLink,
		};
	},
});
