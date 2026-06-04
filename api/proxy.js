export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-apisports-key');
    res.status(200).end();
    return;
  }
  const { endpoint, league, season, date } = req.query;
  const API_KEY = 'fa96c57b27321cef9fc4cae58aa3fe13';
  
  try {
    // Construire l'URL en excluant les paramètres undefined
    let url = `https://v3.football.api-sports.io/${endpoint}?`;
    const params = [];
    
    if (league !== undefined && league !== 'undefined') params.push(`league=${league}`);
    if (season !== undefined && season !== 'undefined') params.push(`season=${season}`);
    if (date !== undefined && date !== 'undefined') params.push(`date=${date}`);
    
    url += params.join('&');
    
    const response = await fetch(url, {
      headers: { 
        'x-apisports-key': API_KEY,
        'User-Agent': 'CustomProxy/1.0'
      }
    });
    
    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
