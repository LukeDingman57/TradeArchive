import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { priceId, customerEmail, userId, plan } = req.body || {};

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
    }

    if (!priceId) {
      return res.status(400).json({ error: "Missing priceId" });
    }

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    if (!plan) {
      return res.status(400).json({ error: "Missing plan" });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

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

      metadata: {
        userId,
        plan,
        priceId,
        customerEmail: customerEmail || "",
      },

      subscription_data: {
        metadata: {
          userId,
          plan,
          priceId,
          customerEmail: customerEmail || "",
        },
      },

      success_url: `${origin}?checkout=success`,
      cancel_url: `${origin}?checkout=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    return res.status(500).json({
      error: err?.message || "Something went wrong",
    });
  }
}