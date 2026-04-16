import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { priceId, customerEmail } = req.body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
    }

    if (!priceId) {
      return res.status(400).json({ error: "Missing priceId" });
    }

    const origin =
      req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      success_url: `${origin}/dashboard`,
      cancel_url: `${origin}/pricing`,
    });

    return res.status(200).json({ id: session.id });
  } catch (err) {
    console.error("Stripe session error:", err);
    return res.status(500).json({
      error: err.message || "Something went wrong",
    });
  }
}