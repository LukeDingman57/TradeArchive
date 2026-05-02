import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ When checkout is completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const customerEmail = session.customer_details.email;
    const subscriptionId = session.subscription;
    const customerId = session.customer;

    console.log("Payment success for:", customerEmail);

    // 🔥 Update user in Supabase
    const { error } = await supabase
      .from("profiles")
      .update({
        plan: "essential",
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: "active",
      })
      .eq("email", customerEmail);

    if (error) {
      console.error("Supabase update error:", error);
    } else {
      console.log("User upgraded successfully");
    }
  }

  res.status(200).json({ received: true });
