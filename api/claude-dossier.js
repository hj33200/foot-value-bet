export default async function handler(req, res) {
  // ✅ CORS Headers - Allow requests from GitHub Pages
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { teamName, season = '2026-2027' } = req.query;
  
  if (!teamName) {
    return res.status(400).json({ error: 'teamName required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not set in environment variables');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    console.log(`🤖 Fetching info for ${teamName}...`);

    const prompt = `Tu es expert en football. Donne-moi les infos ACTUELLES de ${teamName} pour la saison 2026-2027:
                
RÉPONDS EN JSON UNIQUEMENT (pas d'autres texte):
{
  "injuries": [
    {"player": "Nom Joueur", "position": "Striker/Defender/Midfielder/Goalkeeper", "status": "Blessé/Suspendu", "returnDate": "YYYY-MM-DD ou null"}
  ],
  "conflicts": [
    {"who": "Coach vs Joueur", "details": "Description courte", "date": "YYYY-MM-DD", "risk": "high/medium/low"}
  ],
  "suspensions": [
    {"player": "Nom", "games": 2, "reason": "Carton rouge"}
  ],
  "ambiance": {
    "morale": "Excellent/Bon/Moyen/Mauvais",
    "cohesion": "Excellente/Bonne/Moyenne/Mauvaise",
    "notes": "Résumé en 1-2 phrases"
  }
}

Sois PRÉCIS. Retourne UNIQUEMENT le JSON, rien d'autre.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Claude API error: ${response.status}`, errorData);
      return res.status(response.status).json({ error: `Claude API error: ${response.status}` });
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn(`⚠️ No JSON in response`);
      return res.status(400).json({ error: 'Invalid response format' });
    }

    const teamInfo = JSON.parse(jsonMatch[0]);
    console.log(`✅ Successfully fetched info for ${teamName}`);

    return res.status(200).json({
      success: true,
      teamName,
      season,
      data: teamInfo
    });

  } catch (error) {
    console.error(`❌ Error in /api/claude-dossier:`, error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
