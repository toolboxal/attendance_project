# Subscription & Credit Strategy: Preventing Runaway Costs for Asistir

This document analyzes the unit economics of **Asistir's** monetization model and provides concrete strategies to prevent runaway server costs while maintaining a premium, high-converting customer experience.

---

## 1. The Core Challenge & Runaway Cost Risks

Asistir is a real-time event coordination platform. Unlike traditional SaaS apps that only store static data, Asistir utilizes **Convex real-time database subscriptions (WebSockets)** to sync:
*   Live staff statuses (`liveStaff`)
*   Job queues (`jobs`)
*   Discord-like messages (`messages`)

### The Mathematical Problem with "True Unlimited" for $39/mo
*   **Single Credit**: $9.00 / event
*   **Weekend Bundle**: $8.33 / event ($25 total for 3)
*   **Pro Monthly**: $39.00 / month

If Pro Monthly offers **unlimited events**:
*   **Breakeven point**: A user running **5 events** a month pays $39 instead of $45 (using single credits) or $41 (using a 3-pack + 2 singles).
*   **The Power-User Loophole**: A multi-stage festival, a large church, or an event production agency could run **30+ events a month** using a single $39/month account.
    *   **Unit Cost Drop**: Their effective cost per event drops to **$1.30**.
    *   **Convex Load**: Running 30 real-time events with 15–20 active staff members creates thousands of WebSocket connections, database reads, and writes.
    *   **Support & Opportunity Cost**: They receive premium support and consume massive resources while paying a tiny fraction of their actual business value.

---

## 2. Three Strategic Pricing Models to Control Costs

### Model A: The Capped Credit Subscription (Recommended)
Instead of "Unlimited," the $39/mo subscription grants a generous but capped number of **Pro Event Credits** per month.

*   **How many credits?** **6 to 8 Credits per month**.
*   **The Math**:
    *   **6 Credits/mo** at $39 = **$6.50 per credit** (~28% discount vs. Single Pass).
    *   **8 Credits/mo** at $39 = **$4.87 per credit** (~45% discount vs. Single Pass).
*   **Pros**:
    *   **Absolute cap on costs**: You know exactly the maximum database usage a single subscriber can generate.
    *   **Protects individual sales**: If a subscriber needs a 9th event in a month, they can buy a Single Pass top-up for $9.
    *   **Enterprise Upsell**: Legitimate heavy users (who run 10+ events/mo) are forced to either buy multiple subscriptions or contact you for an Enterprise Plan.
*   **Cons**:
    *   Loses the marketing allure of the word *"Unlimited"*.

---

### Model B: Concurrency & Seat-Capped "Unlimited"
You keep the marketing power of the word "Unlimited," but put strict technical boundaries around *how* those events are run.

*   **The Caps**:
    *   **Max 1 Concurrently Active Live Event**: They cannot run two live events at the same time. To go live with Event B, Event A must be archived.
    *   **Max Staff Seats**: Cap the number of live staff members per event on the monthly plan to **15 seats** (while credit-based events can go up to 50+ staff).
*   **Pros**:
    *   Allows you to advertise **"Unlimited Pro Events"** on the landing page.
    *   Naturally limits abuse (one human team can generally only run one event at a time).
    *   Prevents account sharing across multiple sub-teams.
*   **Cons**:
    *   Harder to explain to users.
    *   Requires writing more complex database verification logic to enforce concurrency limits and seat caps.

---

### Model C: The Hybrid Roll-Over & Discounted Top-Up
The subscription acts as a "membership" that grants a baseline of credits and unlocks highly discounted additional credits.

*   **The Structure**:
    *   **$39/month** grants **5 Pro Event Credits** per month (credits expire at the end of the billing cycle).
    *   Subscribers can buy **unlimited top-up credits at $4.00 each** (instead of $9.00).
*   **Pros**:
    *   Extremely transparent and predictable unit economics.
    *   Highly appealing to users who run a variable number of events (e.g., 4 events one month, 12 events the next).
    *   Aligns your revenue directly with their usage.
*   **Cons**:
    *   Slightly higher friction during peak event seasons as users have to manually purchase top-ups.

---

## 3. Comparison Table

| Metric / Strategy | Model A: Capped (8 Credits) | Model B: Concurrency Capped | Model C: Hybrid (5 Credits + $4 Top-up) |
| :--- | :--- | :--- | :--- |
| **Marketing Appeal** | Medium (*"Up to 8 events/mo"*) | **High** (*"Unlimited live events"*) | High (*"Value + Discounted top-ups"*) |
| **Runaway Cost Risk** | **None** (Hard limit of 8) | Low-Medium (Limits concurrent use) | **None** (Paid per additional event) |
| **Account Sharing Protection** | High | High (Can't run events simultaneously) | High |
| **Implementation Complexity** | **Very Low** (Simple monthly credit grant) | High (Needs active event tracking) | Medium (Needs subscriber check on purchase) |
| **Upsell Potential** | **Excellent** (Upgrade to Enterprise) | Medium | Excellent |

---

## 4. Final Recommendation

For **Asistir**, we recommend starting with **Model A (Capped Credits)** or a **Hybrid version of Model A & B**:

> [!IMPORTANT]
> **Recommended Tier Configuration for $39/mo:**
> *   **8 Pro Event Credits per Month** (resetting monthly, no rollover).
> *   **Concurrency limit**: Max **2 active concurrent live events** (prevents sharing a single login across large multi-venue agencies).
> *   **Staff Seat limit**: Max **20 live staff seats per event** (forces giant events onto custom enterprise plans).

### Why this is the safest and most profitable move:
1.  **Prevents Convex Overages**: You guarantee that a $39 subscriber cannot cost you more than 8 events' worth of database bandwidth.
2.  **Protects Your Time**: A user running more than 8 events per month is a high-touch user who will require more customer support. They should be paying more.
3.  **Encourages Subscription Retention**: Monthly resets encourage users to run events regularly to use up their credits.
