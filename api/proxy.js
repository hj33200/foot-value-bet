export default async function handler(req, res) {
  // ✅ CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-apisports-key');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { endpoint, league, season, date, team, from, to } = req.query;
  const API_KEY = process.env.FOOTBALL_API_KEY || 'fa96c57b27321cef9fc4cae58aa3fe13';
  
  try {
    if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });
    let url = `https://v3.football.api-sports.io/${endpoint}?`;
    const params = [];
    
    // Ajouter les paramètres standards
    if (league) params.push(`league=${encodeURIComponent(league)}`);
    if (season) params.push(`season=${encodeURIComponent(season)}`);
    if (date) params.push(`date=${encodeURIComponent(date)}`);
    if (team) params.push(`team=${encodeURIComponent(team)}`);
    
    // ⚠️ NE PAS ajouter season par défaut pour récupérer TOUS les matchs (amicaux + officiels)
    // if (team && !season) {
    //   params.push('season=2024');
    // }
    
    // Ajouter les dates
    if (from) params.push(`from=${encodeURIComponent(from)}`);
    if (to) params.push(`to=${encodeURIComponent(to)}`);
    
    url += params.join('&');
    
    console.log(`📡 ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'x-apisports-key': API_KEY,
        'User-Agent': 'Foot-Value-Bet-Proxy/2.0'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}`);
      return res.status(response.status).json({ error: `HTTP ${response.status}` });
    }
    
    const data = await response.json();
    
    if (data.errors && Object.keys(data.errors).length > 0) {
      return res.status(400).json({ error: 'API errors', errors: data.errors });
    }
    
    console.log(`✅ ${data.response?.length || 0} items`);
    return res.status(200).json(data);
    
  } catch (err) {
    console.error(`❌ Error:`, err.message);
    return res.status(500).json({ error: err.message });
  }
}
