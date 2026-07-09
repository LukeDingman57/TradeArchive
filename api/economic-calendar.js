import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        error: "Missing Supabase env variables",
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase
      .from("economic_events")
      .select("*")
      .gte("event_time", new Date().toISOString())
      .order("event_time", { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const events = data.map((event) => ({
      id: event.id,
      date: event.event_time,
      event: event.event,
      currency: event.currency || "USD",
      country: event.country || "",
      impact: event.impact || "Low",
      previous: event.previous,
      estimate: event.forecast,
      actual: event.actual,
    }));

    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Economic calendar failed",
    });
  }
}