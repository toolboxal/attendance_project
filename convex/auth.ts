import { betterAuth } from 'better-auth/minimal'
import { createClient } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import authConfig from './auth.config'
import { components } from './_generated/api'
import { query } from './_generated/server'
import type { GenericCtx } from '@convex-dev/better-auth'
import type { GenericActionCtx } from 'convex/server'
import type { DataModel } from './_generated/dataModel'
import { emailOTP } from "better-auth/plugins"
import { Resend } from "resend";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth"; 
import { Polar } from "@polar-sh/sdk"; 

const siteUrl = process.env.SITE_URL!

import { internal } from './_generated/api'


const polarClient = new Polar({ 
    accessToken: process.env.POLAR_ACCESS_TOKEN, 
    // Use 'sandbox' if you're using the Polar Sandbox environment
    // Remember that access tokens, products, etc. are completely separated between environments.
    // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
    server: 'sandbox'
}); 

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent: any = createClient<DataModel>(components.betterAuth, {
  triggers: {
    user: {
      onCreate: async (ctx: any, user: any) => {
        console.log("[Trigger] Creating user in 'users' table:", user);
        await ctx.db.insert("users", {
          authUserId: user._id, 
          email: user.email,
          name: user.name,
          role: "admin",
          eventCredits: 0,
          subscriptionTier: "free",
          createdAt: Date.now(),
        });
      },
    },
  },
  authFunctions: (internal as any).auth,
} as any);

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    trustedOrigins: [
      siteUrl,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://192.168.1.5:3000",
    ],
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex({ authConfig }),
      emailOTP({ 
        expiresIn: 300,
        allowedAttempts: 3,
        async sendVerificationOTP({ email, otp }) {
          console.log(`[Better Auth] Sending OTP to ${email}`);
          const apiKey = process.env.RESEND_API_KEY;
          if (!apiKey) {
            console.error("[Better Auth Error] Missing RESEND_API_KEY environment variable!");
            throw new Error("Missing RESEND_API_KEY environment variable");
          }
          const resend = new Resend(apiKey);
          try {
            const result = await resend.emails.send({
              from: "Asistir <onboarding@resend.dev>", 
              to: email,
              subject: "Asistir verification code",
              html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
            });
            console.log("[Better Auth] Resend successfully invoked:", result);
          } catch (err) {
            console.error("[Better Auth Error] Failed to send email via Resend:", err);
            throw err;
          }
        },
      }) as any,
        polar({ 
            client: polarClient, 
            createCustomerOnSignUp: true, 
            use: [ 
                checkout({ 
                    products: [ 
                        { productId: process.env.POLAR_PRODUCT_ID_SINGLE!, slug: "single" },
                        { productId: process.env.POLAR_PRODUCT_ID_WEEKEND!, slug: "weekend" },
                        { productId: process.env.POLAR_PRODUCT_ID_MONTHLY!, slug: "monthly" },
                    ], 
                    successUrl: `${process.env.SITE_URL}/app/success?checkout_id={CHECKOUT_ID}`, 
                    authenticatedUsersOnly: true
                }), 
                portal(), 
                usage(), 
                webhooks({ 
                    secret: process.env.POLAR_WEBHOOK_SECRET!, 
                    onOrderPaid: async (event) => {
                        const order = event.data;
                        const authUserId = order.customer.externalId;
                        if (!authUserId) return;

                        let creditsToAdd = 0;
                        if (order.productId === process.env.POLAR_PRODUCT_ID_SINGLE) creditsToAdd = 1;
                        if (order.productId === process.env.POLAR_PRODUCT_ID_WEEKEND) creditsToAdd = 3;

                        const actionCtx = ctx as unknown as GenericActionCtx<DataModel>;

                        if (creditsToAdd > 0) {
                            await actionCtx.runMutation(internal.payments.grantEventCredits, {
                                authUserId,
                                creditsToAdd,
                            });
                        }

                        if (order.productId === process.env.POLAR_PRODUCT_ID_MONTHLY) {
                            await actionCtx.runMutation(internal.payments.grantSubscription, {
                                authUserId,
                            });
                        }
                    },
                }) 
            ], 
        }) 
    ],
  })
}

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.getAuthUser(ctx)
  },
})