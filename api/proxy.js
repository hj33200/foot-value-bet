export default async function handler(req, res) {
  // ✅ CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-apisports-key');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { endpoint, league, season, date, team, from, to, fixture } = req.query;
  const API_KEY = process.env.FOOTBALL_API_KEY || 'fa96c57b27321cef9fc4cae58aa3fe13';
  
  try {
    if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });
    
    // 📊 Endpoint ODDS
    if (endpoint === 'odds' && fixture) {
      const url = `https://v3.football.api-sports.io/odds?fixture=${encodeURIComponent(fixture)}`;
      console.log(`📡 Odds pour fixture ${fixture}: ${url}`);
      
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
      console.log(`✅ ${data.response?.length || 0} cotes trouvées`);
      return res.status(200).json(data);
    }
    
    // 🔥 SPÉCIAL: Pour fixtures avec team, faire PLUSIEURS requêtes (toutes les saisons)
    if (endpoint === 'fixtures' && team && !season) {
      console.log(`📡 Mode MULTI-SEASON pour team ${team}`);
      const seasons = ['2023', '2024', '2025', '2026'];
      let allMatches = [];
      
      for (const s of seasons) {
        const url = `https://v3.football.api-sports.io/fixtures?team=${encodeURIComponent(team)}&season=${s}&from=${encodeURIComponent(from || '2023-01-01')}&to=${encodeURIComponent(to || '2026-06-30')}`;
        console.log(`  📡 Saison ${s}: ${url}`);
        
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: { 
              'x-apisports-key': API_KEY,
              'User-Agent': 'Foot-Value-Bet-Proxy/2.0'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const matches = data.response || [];
            console.log(`    ✅ ${matches.length} matchs trouvés pour saison ${s}`);
            allMatches = allMatches.concat(matches);
          } else {
            console.warn(`    ⚠️ HTTP ${response.status} pour saison ${s}`);
          }
        } catch (err) {
          console.warn(`    ⚠️ Erreur saison ${s}:`, err.message);
        }
      }
      
      // Dédupliquer par fixture.id
      let uniqueMatches = Array.from(
        new Map(allMatches.map(m => [m.fixture.id, m])).values()
      );
      
      // ✅ TRIER par date (du plus ancien au plus récent)
      uniqueMatches.sort((a, b) => 
        new Date(a.fixture.date) - new Date(b.fixture.date)
      );
      
      console.log(`✅ Total: ${uniqueMatches.length} matchs uniques (triés par date)`);
      return res.status(200).json({
        get: 'fixtures',
        paging: { current: 1, total: 1 },
        parameters: { team, from, to, seasons: seasons.join(',') },
        response: uniqueMatches,
        results: uniqueMatches.length
      });
    }
    
    // Mode standard pour les autres requêtes
    let url = `https://v3.football.api-sports.io/${endpoint}?`;
    const params = [];
    
    if (league) params.push(`league=${encodeURIComponent(league)}`);
    if (season) params.push(`season=${encodeURIComponent(season)}`);
    if (date) params.push(`date=${encodeURIComponent(date)}`);
    if (team) params.push(`team=${encodeURIComponent(team)}`);
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
