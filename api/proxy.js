export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-apisports-key');
    res.status(200).end();
    return;
  }
  
  const { endpoint, league, season, date, team, from, to } = req.query;
  const API_KEY = 'fa96c57b27321cef9fc4cae58aa3fe13';
  
  try {
    let url = `https://v3.football.api-sports.io/${endpoint}?`;
    const params = [];
    
    // ✅ Passer TOUS les paramètres
    if (league !== undefined && league !== 'undefined') params.push(`league=${league}`);
    if (season !== undefined && season !== 'undefined') params.push(`season=${season}`);
    if (date !== undefined && date !== 'undefined') params.push(`date=${date}`);
    if (team !== undefined && team !== 'undefined') params.push(`team=${team}`);
    if (from !== undefined && from !== 'undefined') params.push(`from=${from}`);
    if (to !== undefined && to !== 'undefined') params.push(`to=${to}`);
    
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
