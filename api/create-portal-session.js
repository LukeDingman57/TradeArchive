import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { stripeCustomerId, customerEmail } = req.body || {};

    let customerId = stripeCustomerId;

    if (!customerId && customerEmail) {
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      }
    }

    if (!customerId && customerEmail) {
      const customer = await stripe.customers.create({
        email: customerEmail,
      });

      customerId = customer.id;
    }

    if (!customerId) {
      return res.status(400).json({
        error: "Missing Stripe customer. Please log out and log back in.",
      });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Portal session error:", err);
    return res.status(500).json({
      error: err?.message || "Something went wrong",
    });
  }
}