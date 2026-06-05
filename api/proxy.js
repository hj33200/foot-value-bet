export default async function handler(req, res) {
  // ✅ CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-apisports-key');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Récupérer TOUS les paramètres
  const { endpoint, league, season, date, team, from, to } = req.query;
  
  // ✅ Clé API depuis variable d'environnement OU en dur comme fallback
  const API_KEY = process.env.FOOTBALL_API_KEY || 'fa96c57b27321cef9fc4cae58aa3fe13';
  
  try {
    // Validation: endpoint obligatoire
    if (!endpoint) {
      return res.status(400).json({ 
        error: 'Missing endpoint parameter',
        example: '?endpoint=standings&league=61&season=2024'
      });
    }

    // Construire l'URL API-Football
    let url = `https://v3.football.api-sports.io/${endpoint}?`;
    const params = [];
    
    // ✅ Passer les paramètres exactement comme le HTML les envoie
    if (league) params.push(`league=${encodeURIComponent(league)}`);
    if (season) params.push(`season=${encodeURIComponent(season)}`);
    if (date) params.push(`date=${encodeURIComponent(date)}`);
    if (team) params.push(`team=${encodeURIComponent(team)}`);
    
    // Les paramètres from/to: API-Football les accepte nativement
    if (from) params.push(`from=${encodeURIComponent(from)}`);
    if (to) params.push(`to=${encodeURIComponent(to)}`);
    
    url += params.join('&');
    
    console.log(`[${new Date().toISOString()}] 📡 Proxy request: ${url}`);
    console.log(`   API Key: ${API_KEY.substring(0, 8)}...`);
    
    // Appel à l'API-Football
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'x-apisports-key': API_KEY,
        'User-Agent': 'Foot-Value-Bet-Proxy/2.0'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    
    // Vérifier le statut HTTP
    if (!response.ok) {
      const bodyText = await response.text();
      console.error(`   ❌ API Error ${response.status}:`, bodyText.substring(0, 200));
      
      if (response.status === 401 || response.status === 403) {
        return res.status(response.status).json({ 
          error: 'Invalid API key or unauthorized',
          statusCode: response.status
        });
      }
      
      return res.status(response.status).json({ 
        error: `API returned ${response.status}`,
        statusCode: response.status
      });
    }
    
    // Parser la réponse JSON
    const data = await response.json();
    
    // Vérifier les erreurs dans la réponse API
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.warn(`   ⚠️ API Errors:`, data.errors);
      return res.status(400).json({ 
        error: 'API returned errors',
        errors: data.errors,
        statusCode: 400
      });
    }
    
    // Log de succès
    const itemCount = data.response?.length || 0;
    console.log(`   ✅ Success: ${itemCount} items returned`);
    
    // Retourner la réponse de l'API-Football
    return res.status(200).json(data);
    
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Proxy Error:`, err.message);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: err.message,
      statusCode: 500
    });
  }
}
