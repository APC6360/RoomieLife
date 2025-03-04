export default async function handler(req, res) {
    const { query } = req.query;
    
    console.log("API received query:", query);
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    try {
      const apiUrl = `http://universities.hipolabs.com/search?name=${encodeURIComponent(query)}`;
      console.log("Calling external API:", apiUrl);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log("API received data:", data.length, "universities");
      res.status(200).json(data);
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Failed to fetch universities' });
    }
  }