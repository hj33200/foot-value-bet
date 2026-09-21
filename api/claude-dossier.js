export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { teamName, season = '2026-2027' } = req.query;
  if (!teamName) {
    return res.status(400).json({ error: 'teamName required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const prompt = `Tu es expert en football. Infos ACTUELLES de ${teamName} saison ${season}:
RÉPONDS EN JSON UNIQUEMENT:
{
  "injuries": [{"player": "Nom", "position": "Striker/Defender/Midfielder/Goalkeeper", "status": "Blessé/Suspendu", "returnDate": "YYYY-MM-DD"}],
  "conflicts": [{"who": "Coach vs Joueur", "details": "Description", "date": "YYYY-MM-DD", "risk": "high/medium/low"}],
  "suspensions": [{"player": "Nom", "games": 2, "reason": "Carton rouge"}],
  "ambiance": {"morale": "Excellent/Bon/Moyen/Mauvais", "cohesion": "Excellente/Bonne/Moyenne/Mauvaise", "notes": "Résumé"}
}
UNIQUEMENT LE JSON.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Claude API error' });
    }

    const data = await response.json();
    const content = data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return res.status(400).json({ error: 'Invalid response' });
    }

    const teamInfo = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ success: true, teamName, data: teamInfo });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
