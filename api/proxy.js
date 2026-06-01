export default async function handler(req, res) {
  const { endpoint, league, season } = req.query;
  const API_KEY = 'fa96c57b2732lcef9fc4cae58aa3fe13';
  
  try {
    const url = `https://v3.football.api-sports.io/${endpoint}?league=${league}&season=${season}`;
    
    const response = await fetch(url, {
      headers: { 'x-apisports-key': API_KEY }
    });
    
    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
