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
    name: "Solo",
    credits: 500,
    price: 149900, // in cents (€1,499.00)
    priceDisplay: "€1,499",
    description: "500 Credits - Perfect for trying out",
    popular: false,
  },
  pro: {
    id: "pro",
    name: "Business Pro",
    credits: 1000,
    price: 199900, // in cents (€1,999.00)
    priceDisplay: "€1,999",
    description: "1000 Credits - Best value for regular business",
    popular: true,
  },
  agency: {
    id: "agency",
    name: "Large Business",
    credits: 2000,
    price: 299900, // in cents (€2,999.00)
    priceDisplay: "€2,999",
    description: "2000 Credits - For Large Business Teams",
    popular: false,
  },
} as const;

export type CreditPackId = keyof typeof CREDIT_PACKS;

export interface ReferralInfo {
  code: string;
  codeId: number;
  discountPercent: number;
  commissionPercent: number;
}

export interface DiscountInfo {
  code: string;
  codeId: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

/**
 * Create a Stripe checkout session for purchasing credits
 */
export async function createCheckoutSession(
  packId: CreditPackId,
  userId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string,
  referralInfo?: ReferralInfo,
  discountInfo?: DiscountInfo
): Promise<Stripe.Checkout.Session> {
  const pack = CREDIT_PACKS[packId];

  if (!pack) {
    throw new Error(`Invalid pack ID: ${packId}`);
  }

  // Calculate discounted price if referral code is applied
  let finalPrice = pack.price;
  let discountAmount = 0;
  let discountDescription = "";

  // Apply referral discount first (if present)
  if (referralInfo && referralInfo.discountPercent > 0) {
    discountAmount = Math.round(pack.price * (referralInfo.discountPercent / 100));
    finalPrice = pack.price - discountAmount;
    discountDescription = `${referralInfo.discountPercent}% off with referral code: ${referralInfo.code}`;
  }
  // Apply discount code if present (and no referral - they don't stack)
  else if (discountInfo) {
    if (discountInfo.discountType === 'percentage') {
      discountAmount = Math.round(pack.price * (discountInfo.discountValue / 100));
    } else {
      // Fixed discount in cents
      discountAmount = Math.min(discountInfo.discountValue * 100, pack.price);
    }
    finalPrice = pack.price - discountAmount;
    discountDescription = discountInfo.discountType === 'percentage'
      ? `${discountInfo.discountValue}% off with code: ${discountInfo.code}`
      : `€${discountInfo.discountValue} off with code: ${discountInfo.code}`;
  }

  // Build product description with discount info
  let productDescription = pack.description;
  if (discountDescription) {
    productDescription = `${pack.description} (${discountDescription})`;
  }

  // Build metadata
  const metadata: Record<string, string> = {
    userId,
    packId,
    credits: pack.credits.toString(),
    originalPrice: pack.price.toString(),
  };

  // Add referral info to metadata if present
  if (referralInfo) {
    metadata.referralCode = referralInfo.code;
    metadata.referralCodeId = referralInfo.codeId.toString();
    metadata.discountPercent = referralInfo.discountPercent.toString();
    metadata.commissionPercent = referralInfo.commissionPercent.toString();
    metadata.discountAmount = discountAmount.toString();
  }
  // Add discount code info to metadata if present (and no referral)
  else if (discountInfo) {
    metadata.discountCode = discountInfo.code;
    metadata.discountCodeId = discountInfo.codeId.toString();
    metadata.discountType = discountInfo.discountType;
    metadata.discountValue = discountInfo.discountValue.toString();
    metadata.discountAmount = discountAmount.toString();
  }

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: pack.name,
            description: productDescription,
          },
          unit_amount: finalPrice,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    metadata,
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
