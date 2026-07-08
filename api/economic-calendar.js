export default async function handler(req, res) {
  try {
    const apiKey = process.env.JBLANKED_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing JBLANKED_API_KEY in Vercel Environment Variables",
      });
    }

    const url = "https://www.jblanked.com/news/api/mql5/calendar/today/";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Api-Key ${apiKey}`,
      },
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "JBlanked did not return JSON",
        response: text.substring(0, 500),
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error || data?.message || "JBlanked request failed",
        details: data,
      });
    }

    const events = Array.isArray(data) ? data : data?.data || [];

    const normalized = events
      .map((event, index) => ({
        date:
          event.Date ||
          event.date ||
          event.Time ||
          event.time ||
          event.datetime ||
          null,

        event:
          event.Name ||
          event.name ||
          event.Event ||
          event.event ||
          event.Title ||
          event.title ||
          "Economic Event",

        currency:
          event.Currency ||
          event.currency ||
          event.Country ||
          event.country ||
          "USD",

        country:
          event.Country ||
          event.country ||
          "",

        impact:
          event.Impact ||
          event.impact ||
          event.Importance ||
          event.importance ||
          "Low",

        previous:
          event.Previous ??
          event.previous ??
          null,

        estimate:
          event.Forecast ??
          event.forecast ??
          event.Estimate ??
          event.estimate ??
          null,

        actual:
          event.Actual ??
          event.actual ??
          null,

        id: event.Id || event.id || `${index}`,
      }))
      .filter((event) => event.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json(normalized);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Economic calendar failed",
    });
  }
}