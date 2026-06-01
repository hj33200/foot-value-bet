export default async function handler(req, res) {
  const { endpoint, league, season, date } = req.query;
  const API_KEY = 'fa96c57b2732lcef9fc4cae58aa3fe13';
  
  try {
    let url = `https://v3.football.api-sports.io/${endpoint}?league=${league}&season=${season}`;
    if (date) url += `&date=${date}`;
    
    console.log('Calling API:', url);
    
    const response = await fetch(url, {
      headers: { 
        'x-apisports-key': API_KEY
      }
    });
    
    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-apisports-key');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
