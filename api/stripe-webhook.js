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
  return "essential";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sig = req.headers["stripe-signature"];
    const rawBody = await buffer(req);

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const customerEmail =
        session.customer_details?.email ||
        session.customer_email ||
        session.metadata?.customerEmail;

      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const priceId = session.metadata?.priceId;
      const plan = getPlanFromPriceId(priceId);

      if (!customerEmail) {
        console.error("Missing customer email");
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
        return res.status(500).json({ error: error.message });
      }

      console.log(`Updated ${customerEmail} to ${plan}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}