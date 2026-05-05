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

function getPlanFromPriceId(priceId) {
  if (priceId === process.env.STRIPE_ESSENTIAL_PRICE_ID) return "essential";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  return "free";
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
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const customerEmail =
        session.customer_details?.email || session.customer_email;

      const subscriptionId = session.subscription;
      const customerId = session.customer;

      if (!customerEmail) {
        console.error("Missing customer email on checkout session");
        return res.status(400).json({ error: "Missing customer email" });
      }

      if (!subscriptionId) {
        console.error("Missing subscription ID on checkout session");
        return res.status(400).json({ error: "Missing subscription ID" });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const plan = getPlanFromPriceId(priceId);

      const { error } = await supabase
        .from("profiles")
        .update({
          plan,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: subscription.status,
          updated_at: new Date().toISOString(),
        })
        .eq("email", customerEmail);

      if (error) {
        console.error("Supabase checkout update error:", error);
        return res.status(500).json({ error: "Supabase checkout update failed" });
      }

      console.log(`User upgraded: ${customerEmail} -> ${plan}`);
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;

      const subscriptionId = subscription.id;
      const status = subscription.status;
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const plan = status === "active" ? getPlanFromPriceId(priceId) : "free";

      const { error } = await supabase
        .from("profiles")
        .update({
          plan,
          subscription_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscriptionId);

      if (error) {
        console.error("Supabase subscription update error:", error);
        return res.status(500).json({ error: "Supabase subscription update failed" });
      }

      console.log(`Subscription updated: ${subscriptionId} -> ${plan} / ${status}`);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const subscriptionId = subscription.id;

      const { error } = await supabase
        .from("profiles")
        .update({
          plan: "free",
          subscription_status: "canceled",
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscriptionId);

      if (error) {
        console.error("Supabase cancel update error:", error);
        return res.status(500).json({ error: "Supabase cancel update failed" });
      }

      console.log(`Subscription canceled: ${subscriptionId} -> free`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ error: "Webhook failed" });
  }
}