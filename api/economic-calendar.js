export default async function handler(req, res) {
  try {
    const apiKey = process.env.FMP_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing FMP_API_KEY in Vercel Environment Variables",
      });
    }

    const today = new Date();
    const from = today.toISOString().split("T")[0];

    const end = new Date();
    end.setDate(today.getDate() + 7);
    const to = end.toISOString().split("T")[0];

    const urls = [
      `https://financialmodelingprep.com/stable/economic-calendar?from=${from}&to=${to}&apikey=${apiKey}`,
      `https://financialmodelingprep.com/stable/economic-calendar?apikey=${apiKey}`,
    ];

    let lastError = null;

    for (const url of urls) {
      const fmpRes = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "TradeArchive/1.0",
        },
      });

      const text = await fmpRes.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        lastError = {
          error: "FMP did not return JSON",
          status: fmpRes.status,
          response: text.substring(0, 1000),
          url: url.replace(apiKey, "HIDDEN_API_KEY"),
        };
        continue;
      }

      if (!fmpRes.ok) {
        lastError = {
          error:
            data?.["Error Message"] ||
            data?.message ||
            data?.error ||
            "FMP request failed",
          status: fmpRes.status,
          details: data,
          url: url.replace(apiKey, "HIDDEN_API_KEY"),
        };
        continue;
      }

      const events = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const sorted = events
        .filter((event) => event.date || event.datetime)
        .map((event) => ({
          date: event.date || event.datetime,
          event: event.event || event.title || event.name || "Economic Event",
          currency: event.currency || event.countryCode || "USD",
          country: event.country || "",
          impact: event.impact || event.importance || "Low",
          previous: event.previous ?? null,
          estimate: event.estimate ?? event.forecast ?? event.consensus ?? null,
          actual: event.actual ?? null,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      return res.status(200).json(sorted);
    }

    return res.status(500).json(lastError || { error: "FMP calendar failed" });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Economic calendar failed",
    });
  }
}