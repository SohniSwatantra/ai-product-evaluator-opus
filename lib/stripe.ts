/**
 * Stripe client and configuration
 */

import Stripe from "stripe";

// Lazy-initialize Stripe client to avoid build-time errors
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(secretKey, {
      apiVersion: "2025-04-30.basil",
    });
  }
  return _stripe;
}

// Credit pack configurations
export const CREDIT_PACKS = {
  starter: {
    id: "starter",
    name: "Starter Pack",
    credits: 30,
    price: 2900, // in cents ($29.00)
    priceDisplay: "$29",
    description: "30 Credits - Perfect for trying out",
    popular: false,
  },
  pro: {
    id: "pro",
    name: "Pro Pack",
    credits: 60,
    price: 4900, // in cents ($49.00)
    priceDisplay: "$49",
    description: "60 Credits - Best value for regular users",
    popular: true,
    savings: "Save 18%",
  },
  agency: {
    id: "agency",
    name: "Agency Pack",
    credits: 200,
    price: 12900, // in cents ($129.00)
    priceDisplay: "$129",
    description: "200 Credits - For teams and heavy users",
    popular: false,
    savings: "Save 33%",
  },
} as const;

export type CreditPackId = keyof typeof CREDIT_PACKS;

/**
 * Create a Stripe checkout session for purchasing credits
 */
export async function createCheckoutSession(
  packId: CreditPackId,
  userId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const pack = CREDIT_PACKS[packId];

  if (!pack) {
    throw new Error(`Invalid pack ID: ${packId}`);
  }

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: pack.name,
            description: pack.description,
          },
          unit_amount: pack.price,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    metadata: {
      userId,
      packId,
      credits: pack.credits.toString(),
    },
  });

  return session;
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
}
