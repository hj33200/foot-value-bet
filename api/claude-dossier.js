export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { teamName, season } = req.query;
    
    console.log('📍 Received request:', { teamName, season });
    
    if (!teamName) {
      console.error('❌ Missing teamName');
      return res.status(400).json({ error: 'teamName is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('❌ Missing ANTHROPIC_API_KEY');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log(`🤖 Fetching info for: ${teamName}`);

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
          content: `Tu es expert en football. Infos ACTUELLES de ${teamName} saison 2026-2027. RÉPONDS EN JSON UNIQUEMENT:
{
  "injuries": [{"player": "Nom", "position": "Striker/Defender/Midfielder/Goalkeeper", "returnDate": "YYYY-MM-DD"}],
  "conflicts": [{"who": "Coach vs Joueur", "details": "Description", "date": "YYYY-MM-DD", "risk": "high/medium/low"}],
  "suspensions": [{"player": "Nom", "games": 1, "reason": "Raison"}],
  "ambiance": {"morale": "Bon/Moyen/Mauvais", "cohesion": "Bonne/Moyenne/Mauvaise", "notes": "Notes"}
}
UNIQUEMENT LE JSON.`
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Claude API error: ${response.status}`, error);
      return res.status(response.status).json({ error: `Claude API returned ${response.status}` });
    }

    const data = await response.json();
    console.log('✅ Claude response received');
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('❌ Unexpected response structure');
      return res.status(500).json({ error: 'Invalid Claude response structure' });
    }

    const text = data.content[0].text;
    console.log('📝 Response text:', text.substring(0, 100));
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response');
      return res.status(400).json({ error: 'Claude response contains no JSON', text });
    }

    const teamInfo = JSON.parse(jsonMatch[0]);
    console.log('✅ JSON parsed successfully');

    return res.status(200).json({
      success: true,
      teamName,
      data: teamInfo
    });

  } catch (error) {
    console.error('❌ Error:', error.message, error.stack);
    return res.status(500).json({ 
      error: error.message,
      type: error.constructor.name
    });
  }
}
