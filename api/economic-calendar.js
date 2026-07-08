export default async function handler(req, res) {
  try {
    const apiKey = process.env.FMP_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing FMP_API_KEY in Vercel Environment Variables",
      });
    }

    const url = `https://financialmodelingprep.com/stable/economic-calendar?apikey=${apiKey}`;

    const fmpRes = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    const text = await fmpRes.text();

    try {
      const data = JSON.parse(text);

      if (!fmpRes.ok) {
        return res.status(fmpRes.status).json({
          error: data?.message || data?.error || "FMP request failed",
          details: data,
        });
      }

      const events = Array.isArray(data) ? data : data?.data || [];

      return res.status(200).json(
        events
          .filter((event) => event.date)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      );
    } catch {
      return res.status(500).json({
        error: text.substring(0, 500),
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Economic calendar failed",
    });
  }
}