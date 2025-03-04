export default async function handler(req, res) {
  const { query } = req.query;

  if (!query || query.length < 2) {
    return res.status(400).json({ error: "Query too short" });
  }

  try {
    const response = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(query)}`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ error: "Failed to fetch universities" });
  }
}
