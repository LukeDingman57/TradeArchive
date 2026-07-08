export default async function handler(req, res) {
  try {
    const apiKey = process.env.FMP_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing FMP_API_KEY in Vercel" });
    }

    const today = new Date();
    const from = today.toISOString().split("T")[0];

    const end = new Date();
    end.setDate(today.getDate() + 7);
    const to = end.toISOString().split("T")[0];

    const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${from}&to=${to}&apikey=${apiKey}`;

    const fmpRes = await fetch(url);
    const text = await fmpRes.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "FMP did not return JSON",
        response: text,
      });
    }

    if (!fmpRes.ok) {
      return res.status(fmpRes.status).json({
        error: "FMP request failed",
        details: data,
      });
    }

    if (!Array.isArray(data)) {
      return res.status(500).json({
        error: "FMP returned unexpected data",
        details: data,
      });
    }

    const sorted = data
      .filter((event) => event.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json(sorted);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Economic calendar failed",
    });
  }
}