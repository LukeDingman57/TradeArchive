import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function buffer(readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

function normalizePlan(plan) {
  if (plan === "essential" || plan === "essential_yearly") return "essential";
  if (plan === "pro") return "pro";
  return "free";
}

function getPlanFromPriceId(priceId) {
  const essentialMonthly = process.env.STRIPE_ESSENTIAL_PRICE_ID;
  const essentialYearly = process.env.STRIPE_ESSENTIAL_YEARLY_PRICE_ID;
  const pro = process.env.STRIPE_PRO_PRICE_ID;

  if (priceId === essentialMonthly) return "essential";
  if (priceId === essentialYearly) return "essential";
  if (priceId === pro) return "pro";

  return "free";
}

async function upsertProfile({
  userId,
  email,
  plan,
  stripeCustomerId,
  stripeSubscriptionId,
  subscriptionStatus,
}) {
  if (!userId) {
    throw new Error("Missing userId for profile upsert");
  }

  const payload = {
    id: userId,
    email: email || null,
    plan: normalizePlan(plan),
    stripe_customer_id: stripeCustomerId || null,
    stripe_subscription_id: stripeSubscriptionId || null,
    subscription_status: subscriptionStatus || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const signature = req.headers["stripe-signature"];
  const rawBody = await buffer(req);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const userId = session.metadata?.userId;
      const metadataPlan = session.metadata?.plan;
      const metadataPriceId = session.metadata?.priceId;

      const customerEmail =
        session.metadata?.customerEmail ||
        session.customer_details?.email ||
        session.customer_email ||
        null;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;

      let plan = normalizePlan(metadataPlan);

      if (plan === "free") {
        plan = getPlanFromPriceId(metadataPriceId);
      }

      await upsertProfile({
        userId,
        email: customerEmail,
        plan,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: "active",
      });

      console.log(`✅ User upgraded: ${customerEmail} → ${plan}`);
    }

    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object;

      const subscriptionId = subscription.id;
      const status = subscription.status;
      const userId = subscription.metadata?.userId;
      const customerEmail = subscription.metadata?.customerEmail || null;

      const priceId =
        subscription.metadata?.priceId ||
        subscription.items?.data?.[0]?.price?.id;

      const plan =
        status === "active" || status === "trialing"
          ? getPlanFromPriceId(priceId)
          : "free";

      if (userId) {
        await upsertProfile({
          userId,
          email: customerEmail,
          plan,
          stripeCustomerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: status,
        });
      }

      console.log(`✅ Subscription created: ${subscriptionId} → ${plan}`);
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;

      const subscriptionId = subscription.id;
      const status = subscription.status;

      const userId = subscription.metadata?.userId;
      const customerEmail = subscription.metadata?.customerEmail || null;

      const priceId =
        subscription.metadata?.priceId ||
        subscription.items?.data?.[0]?.price?.id;

      const plan =
        status === "active" || status === "trialing"
          ? getPlanFromPriceId(priceId)
          : "free";

      if (userId) {
        await upsertProfile({
          userId,
          email: customerEmail,
          plan,
          stripeCustomerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: status,
        });
      } else {
        const { error } = await supabase
          .from("profiles")
          .update({
            plan,
            subscription_status: status,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) throw error;
      }

      console.log(`🔄 Subscription updated: ${subscriptionId} → ${plan}`);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const subscriptionId = subscription.id;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const { error } = await supabase
          .from("profiles")
          .update({
            plan: "free",
            subscription_status: "canceled",
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .update({
            plan: "free",
            subscription_status: "canceled",
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) throw error;
      }

      console.log(`❌ Subscription canceled: ${subscriptionId} → free`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).json({ error: err?.message || "Webhook failed" });
  }
}