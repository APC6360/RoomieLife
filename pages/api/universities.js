// pages/api/universities.js
export default async function handler(req, res) {
  const { query } = req.query;
  
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  try {
    // Make the request to the external API using HTTPS
    const response = await fetch(`https://universities.hipolabs.com/search?name=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch universities');
    }
    
    const data = await response.json();
    
    // Extract university names and remove duplicates
    const universityNames = [...new Set(data.map(uni => uni.name))];
    
    // Return the university names
    res.status(200).json({ universities: universityNames });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
}