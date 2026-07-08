// api/f1-fixtures.js — Vercel serverless function
// Fetches upcoming F1 race and driver standings from API-Sports
// API key stays server-side — never exposed to browser

const BASE = 'https://v1.formula-1.api-sports.io'

async function apiSports(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'x-apisports-key': process.env.API_SPORTS_KEY,
    },
  })
  if (!res.ok) {
    console.error(`API-Sports error on ${path}:`, res.status)
    return null
  }
  const data = await res.json()
  return data?.response || null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const API_KEY = process.env.API_SPORTS_KEY
  if (!API_KEY) return res.status(500).json({ error: 'API_SPORTS_KEY not configured' })

  const season = new Date().getFullYear()

  try {
    // 1. Get next upcoming race
    const races = await apiSports(`/races?season=${season}&next=1`)
    if (!races?.length) {
      return res.status(200).json({ race: null, drivers: [] })
    }

    const race = races[0]
    const raceId = race.id

    // 2. Get current driver standings (use as proxy for relative probabilities)
    const standings = await apiSports(`/rankings/drivers?season=${season}`)

    // 3. Build driver list with probability estimates from championship points
    let drivers = []
    if (standings?.length) {
      const top8 = standings.slice(0, 8)
      const totalPoints = top8.reduce((sum, s) => sum + (s.points || 1), 0)

      // Normalise points to probabilities, with a minimum floor so backmarkers aren't 0
      const rawProbs = top8.map(s => Math.max(s.points || 1, 1) / totalPoints)
      const probSum = rawProbs.reduce((a, p) => a + p, 0)
      const normProbs = rawProbs.map(p => p / probSum)

      drivers = top8.map((s, i) => ({
        name: s.driver?.abbr || s.driver?.name || `Driver ${i + 1}`,
        fullName: `${s.driver?.name?.forename || ''} ${s.driver?.name?.surname || ''}`.trim(),
        team: s.team?.name || '',
        points: s.points || 0,
        probability: Math.round(normProbs[i] * 1000) / 1000,
      }))
    }

    // 4. Build race info
    const raceDate = race.date && race.time
      ? new Date(`${race.date}T${race.time}`).toISOString()
      : race.date
        ? new Date(race.date).toISOString()
        : null

    return res.status(200).json({
      race: {
        id: raceId,
        name: race.competition?.name || race.circuit?.name || 'Grand Prix',
        circuit: race.circuit?.name || '',
        location: `${race.circuit?.location?.city || ''}, ${race.circuit?.location?.country || ''}`.replace(/^, |, $/, ''),
        date: raceDate,
        season,
        round: race.season?.round || null,
      },
      drivers,
    })
  } catch (err) {
    console.error('F1 fixtures error:', err)
    return res.status(500).json({ error: err.message || 'Failed to fetch F1 data' })
  }
}
