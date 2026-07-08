// api/economic-calendar.js
export default async function handler(req, res) {
  try {
    const apiKey = process.env.FMP_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing FMP_API_KEY" });
    }

    const today = new Date();
    const from = today.toISOString().slice(0, 10);

    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const to = nextWeek.toISOString().slice(0, 10);

    const url = `https://financialmodelingprep.com/stable/economic-calendar?from=${from}&to=${to}&apikey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "FMP request failed",
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Calendar failed to load",
      details: error.message,
    });
  }
}