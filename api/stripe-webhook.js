
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
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

  const sig = req.headers["stripe-signature"];
  const rawBody = await buffer(req);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const customerEmail =
      session.customer_details?.email || session.customer_email;

    const subscriptionId = session.subscription;
    const customerId = session.customer;
    const priceId = session.metadata?.priceId;

    const plan = getPlanFromPriceId(priceId);

    console.log("Payment success for:", customerEmail);
    console.log("Plan:", plan);

    if (!customerEmail) {
      return res.status(400).json({ error: "Missing customer email" });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        plan,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("email", customerEmail);

    if (error) {
      console.error("Supabase update error:", error);
      return res.status(500).json({ error: "Supabase update failed" });
    }

    console.log("User upgraded successfully");
  }

  return res.status(200).json({ received: true });
}