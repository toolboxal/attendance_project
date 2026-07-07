import { Buffer } from "buffer/";
if (typeof (globalThis as any).Buffer === "undefined") {
    (globalThis as any).Buffer = Buffer;
}

import { betterAuth } from 'better-auth/minimal'
import { APIError } from 'better-auth/api'
import { createClient } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import authConfig from './auth.config'
import { components } from './_generated/api'
import { query } from './_generated/server'
import type { GenericCtx } from '@convex-dev/better-auth'
import type { GenericActionCtx } from 'convex/server'
import type { DataModel } from './_generated/dataModel'
import { emailOTP } from "better-auth/plugins"
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth"; 
import { Polar } from "@polar-sh/sdk"; 

const siteUrl = process.env.SITE_URL!

import { internal } from './_generated/api'
import { buildOtpEmailHtml, sendResendEmail } from "./email";

function subscriptionAuthUserId(subscription: {
    customer?: { externalId?: string | null };
}) {
    return subscription.customer?.externalId ?? null;
}

function isMonthlyPolarProduct(productId: string) {
    return productId === process.env.POLAR_PRODUCT_ID_MONTHLY;
}

async function handleMonthlySubscriptionWebhook(
    actionCtx: GenericActionCtx<DataModel>,
    subscription: {
        id: string;
        productId: string;
        currentPeriodEnd: Date | string;
        cancelAtPeriodEnd?: boolean;
        customer?: { externalId?: string | null };
    },
    action: "canceled" | "revoked" | "uncanceled" | "updated",
) {
    const authUserId = subscriptionAuthUserId(subscription);
    if (!authUserId || !isMonthlyPolarProduct(subscription.productId)) return;

    if (action === "revoked") {
        await actionCtx.runMutation(internal.payments.revokeSubscription, { authUserId });
        return;
    }

    const subscriptionPeriodEndsAt = new Date(subscription.currentPeriodEnd).getTime();
    if (action === "canceled") {
        await actionCtx.runMutation(internal.payments.markSubscriptionCanceled, {
            authUserId,
            subscriptionPeriodEndsAt,
            polarSubscriptionId: subscription.id,
        });
        return;
    }

    if (action === "uncanceled") {
        await actionCtx.runMutation(internal.payments.clearSubscriptionCanceled, {
            authUserId,
            subscriptionPeriodEndsAt,
            polarSubscriptionId: subscription.id,
        });
        return;
    }

    await actionCtx.runMutation(internal.payments.syncSubscriptionMetadata, {
        authUserId,
        subscriptionPeriodEndsAt,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
        polarSubscriptionId: subscription.id,
    });
}


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
        // console.log("[Trigger] Creating user in 'users' table:", user);
        await ctx.db.insert("users", {
          authUserId: user._id, 
          email: user.email,
          name: user.name,
          role: "admin",
          freeTrialCredits: 1, // Signup gift: 1 live event capped at 5 staff
          oneTimeCredits: 0,
          monthlyCredits: 0,
          billingPlan: "free",
          createdAt: Date.now(),
        });
      },
      onUpdate: async (ctx: any, user: any) => {
        const existing = await ctx.db
          .query("users")
          .withIndex("by_authUserId", (q: any) => q.eq("authUserId", user._id))
          .first();
        if (!existing) return;

        const patch: { name?: string; email?: string } = {};
        if (user.name !== undefined) patch.name = user.name;
        if (user.email !== undefined) patch.email = user.email;
        if (Object.keys(patch).length > 0) {
          await ctx.db.patch(existing._id, patch);
        }
      },
      onDelete: async (ctx: any, user: any) => {
        await ctx.runMutation(internal.users.deleteAccountData, {
          authUserId: user._id,
        });
      },
    },
  },
  authFunctions: (internal as any).auth,
} as any);

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const trustedOrigins = [
    siteUrl,
    "https://www.asistir.online",
    "https://asistir.online",
    "http://localhost:3000",
   "http://192.168.1.5:3000"
  ];

  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    trustedOrigins: [...new Set(trustedOrigins)],
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    user: {
      deleteUser: {
        enabled: true,
        sendDeleteAccountVerification: async ({ user, url }) => {
          try {
            await sendResendEmail(
              user.email,
              "Confirm Asistir account deletion",
              `<p>You requested to permanently delete your Asistir account.</p><p><a href="${url}">Confirm account deletion</a></p><p>If you did not request this, you can ignore this email.</p>`,
            );
          } catch (err) {
            console.error("[Better Auth Error] Failed to send delete verification:", err);
            throw err;
          }
        },
        beforeDelete: async (user) => {
          const actionCtx = ctx as unknown as GenericActionCtx<DataModel>;
          try {
            await actionCtx.runMutation(internal.users.assertCanDeleteAccount, {
              authUserId: user.id,
            });
          } catch (err: unknown) {
            let message = "Account deletion is not allowed.";
            if (err instanceof Error && err.message) {
              message = err.message;
            }
            if (err && typeof err === "object" && "data" in err) {
              const data = (err as { data?: { reason?: string } }).data;
              if (data?.reason) message = data.reason;
            }
            throw new APIError("BAD_REQUEST", { message });
          }
        },
      },
    },
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex({ authConfig }),
      emailOTP({ 
        expiresIn: 300,
        allowedAttempts: 3,
        async sendVerificationOTP({ email, otp }) {
          // console.log(`[Better Auth] Sending OTP to ${email}`);
          try {
            await sendResendEmail(
              email,
              "Your Asistir verification code",
              buildOtpEmailHtml(otp, siteUrl.replace(/\/$/, "")),
            );
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
                        { productId: process.env.POLAR_PRODUCT_ID_BUNDLE!, slug: "bundle" },
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
                        if (order.productId === process.env.POLAR_PRODUCT_ID_BUNDLE) creditsToAdd = 4;

                        const actionCtx = ctx as unknown as GenericActionCtx<DataModel>;

                        // 1. Record the payment in permanent database history
                        const checkoutId = order.checkoutId ?? (order as any).checkout?.id;
                      
                        if (checkoutId) {
                            await actionCtx.runMutation(internal.payments.recordPayment, {
                                authUserId,
                                checkoutId,
                                timestamp: event.timestamp.toISOString(),
                                orderId: order.id,
                                invoiceNo: order.invoiceNumber,
                                totalAmount: order.totalAmount,
                                netAmount: order.netAmount,
                                currency: order.currency,
                                discountAmount: order.discountAmount,
                                productName: order.description,
                                status: order.status,
                            });
                        }

                        // 2. Link Polar Identifiers to user record
                        const polarCustomerId = order.customerId ?? (order as any).customer?.id;
                        const polarSubscriptionId = order.subscriptionId ?? (order as any).subscription_id;
                        if (polarCustomerId) {
                            await actionCtx.runMutation(internal.payments.updatePolarBillingIds, {
                                authUserId,
                                polarCustomerId,
                                polarSubscriptionId: polarSubscriptionId ?? undefined,
                            });
                        }

                        // 3. Grant credits/subscriptions
                        if (creditsToAdd > 0) {
                            await actionCtx.runMutation(internal.payments.grantOneTimeCredits, {
                                authUserId,
                                creditsToAdd,
                            });
                        }

                        if (order.productId === process.env.POLAR_PRODUCT_ID_MONTHLY) {
                            const subscription = (order as { subscription?: { currentPeriodEnd?: Date | string } }).subscription;
                            const periodEnd = subscription?.currentPeriodEnd;
                            if (!periodEnd) {
                                console.error(
                                    "[Polar] Monthly order.paid missing subscription.currentPeriodEnd — subscription not granted",
                                    order.id,
                                );
                            } else {
                                await actionCtx.runMutation(internal.payments.grantSubscription, {
                                    authUserId,
                                    initialMonthlyCredits: 8,
                                    subscriptionPeriodEndsAt: new Date(periodEnd).getTime(),
                                });
                            }
                        }
                    },
                    onSubscriptionCanceled: async (event) => {
                        const actionCtx = ctx as unknown as GenericActionCtx<DataModel>;
                        await handleMonthlySubscriptionWebhook(
                            actionCtx,
                            event.data,
                            "canceled",
                        );
                    },
                    onSubscriptionRevoked: async (event) => {
                        const actionCtx = ctx as unknown as GenericActionCtx<DataModel>;
                        await handleMonthlySubscriptionWebhook(
                            actionCtx,
                            event.data,
                            "revoked",
                        );
                    },
                    onSubscriptionUncanceled: async (event) => {
                        const actionCtx = ctx as unknown as GenericActionCtx<DataModel>;
                        await handleMonthlySubscriptionWebhook(
                            actionCtx,
                            event.data,
                            "uncanceled",
                        );
                    },
                    onSubscriptionUpdated: async (event) => {
                        const actionCtx = ctx as unknown as GenericActionCtx<DataModel>;
                        await handleMonthlySubscriptionWebhook(
                            actionCtx,
                            event.data,
                            "updated",
                        );
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