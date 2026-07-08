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

    const url = `https://financialmodelingprep.com/stable/economic-calendar?from=${from}&to=${to}&apikey=${apiKey}`;

    const fmpRes = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    const text = await fmpRes.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "FMP did not return JSON",
        response: text.substring(0, 1000),
        url,
      });
    }

    if (!fmpRes.ok) {
      return res.status(fmpRes.status).json({
        error:
          data?.["Error Message"] ||
          data?.message ||
          data?.error ||
          "FMP request failed",
        details: data,
        url,
      });
    }

    const events = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : [];

    const sorted = events
      .filter((event) => event.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json(sorted);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Economic calendar failed",
    });
  }
}