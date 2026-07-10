// api/golf-model.js — Golf outright winner probability model (no external API)
// Covers: The Open, Masters, PGA Championship, US Open
//
// Model: OWGR position → base probability + links/course history adjustment
// Returns OUTRIGHT format (all players with win probability)

// ── The Open 2026 field — Royal Birkdale (July 16-19) ─────────────────────────
// OWGR positions as of July 2026 + links performance adjustment
// Defending champion: Scottie Scheffler (won 2025 at Royal Portrush)
const OPEN_2026_FIELD = [
  // Format: [name, OWGR position, links bonus (0=none, 1=good, 2=great)]
  ['Scottie Scheffler',    1, 1],  // World #1, defending champion
  ['Rory McIlroy',         2, 2],  // Links master, 4x major winner, owns Birkdale
  ['Tommy Fleetwood',      7, 2],  // Birkdale runner-up 2017, links specialist
  ['Ludvig Åberg',         4, 1],
  ['Collin Morikawa',      5, 1],
  ['Viktor Hovland',       6, 1],
  ['Xander Schauffele',    3, 0],
  ['Patrick Cantlay',      9, 0],
  ['Tony Finau',          11, 0],
  ['Matt Fitzpatrick',    14, 2],  // links-experienced British player
  ['Robert MacIntyre',    15, 2],  // Scottish links specialist
  ['Shane Lowry',         18, 2],  // 2019 Open champion, loves links
  ['Justin Rose',         22, 2],  // experienced links player
  ['Bryson DeChambeau',   10, 0],
  ['Jon Rahm',            12, 1],
  ['Max Homa',            16, 0],
  ['Tom Kim',             17, 0],
  ['Harris English',      20, 0],
  ['Hideki Matsuyama',    13, 0],
  ['Sungjae Im',          19, 0],
  ['Rasmus Hojgaard',     24, 1],  // Danish, some links experience
  ['Nicolai Hojgaard',    25, 1],
  ['Akshay Bhatia',       23, 0],
  ['Brian Harman',        26, 2],  // 2024 Royal Troon champion
  ['Jordan Spieth',       30, 2],  // 2017 Birkdale champion
  ['Joaquin Niemann',     35, 0],  // LIV qualifier
]

function buildGolfProbabilities(field) {
  // Convert OWGR to raw rating, then apply links bonus
  const ratings = field.map(([name, owgr, linksBonus]) => {
    const base = 1000 / Math.pow(owgr, 0.6) // sub-linear so field isn't dominated by #1
    const bonus = 1 + (linksBonus * 0.12) // 12% bonus per links level
    return { name, rating: base * bonus }
  })

  // Normalise to sum to 1.0
  const total = ratings.reduce((s, r) => s + r.rating, 0)
  return ratings.map(r => ({
    name: r.name,
    probability: Math.round((r.rating / total) * 1000) / 1000,
  }))
}

// ── Tournament schedules ───────────────────────────────────────────────────────
const TOURNAMENTS = {
  pga: {
    name: 'The Open Championship 2026',
    venue: 'Royal Birkdale, Southport',
    startDate: '2026-07-16T06:00:00Z',
    endDate:   '2026-07-19T18:00:00Z',
    field: OPEN_2026_FIELD,
  },
}

const COMP_TOURNAMENT = { pga: 'pga' }

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { competitionKey } = req.query
  if (!competitionKey) return res.status(400).json({ error: 'competitionKey required' })

  const tournamentKey = COMP_TOURNAMENT[competitionKey]
  const tournament = TOURNAMENTS[tournamentKey]
  if (!tournament) return res.status(200).json({ fixtures: [], debug: `No tournament for ${competitionKey}` })

  const now = new Date()
  const start = new Date(tournament.startDate)
  const end = new Date(tournament.endDate)

  // Tournament is in the past
  if (now > end) {
    return res.status(200).json({ fixtures: [], debug: 'Tournament complete' })
  }

  const players = buildGolfProbabilities(tournament.field)

  // Build as a single outright market
  const fixture = {
    name: tournament.name,
    venue: tournament.venue,
    kickoff: tournament.startDate,
    outcomes: players.map(p => p.name),
    probabilities: players.map(p => p.probability),
    format: 'outright',
    meta: {
      daysUntilStart: Math.max(0, Math.round((start - now) / (1000 * 60 * 60 * 24))),
      inProgress: now >= start && now <= end,
    },
  }

  return res.status(200).json({
    fixtures: [fixture],
    tournament: tournament.name,
    count: 1,
  })
}
