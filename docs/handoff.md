# BYN — Project Handoff Document
*Last updated: July 11, 2026*

---

## What is BYN?

**BYN (Bet Your Nuts)** is a play-money sports prediction market platform. No real money — ever. Users receive 1,000 virtual credits ("nuts") per round, must stake at least 50% before lockout, and winnings carry forward across rounds. Pricing is driven by an LMSR model seeded from our own probability models, then moved by user bets.

- **Live app:** https://www.bynapp.online/app
- **Landing page:** https://www.bynapp.online
- **Admin dashboard:** https://southscale.co.uk/admin (password protected — 3 tabs: Dashboard, Fixtures, Backlog)
- **Company site:** https://southscale.co.uk
- **GitHub:** https://github.com/SouthScale-HQ/byn-test (byn-test) and southscale-web repos

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite 5.4, hosted on Vercel |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (Postgres) — `rmpkwgmtwuzwyhguqmld.supabase.co` |
| Email | Resend via `/api/send-email.js` serverless |
| Serverless | Vercel (`/api/*.js`) |
| Domain | bynapp.online (GoDaddy DNS → Vercel) |
| Node | v24 local, pinned to 20 in .nvmrc for Vercel |

---

## Repository Structure

### byn-test (main app)
```
byn-test/
├── src/
│   ├── App.jsx                # Main React app (~2100 lines)
│   ├── constants.js           # All competitions, team pools, game config
│   ├── oddsService.js         # Routes competitions to model endpoints
│   ├── emailService.js        # Email templates (Resend)
│   ├── supabase.js / profileService.js / walletService.js / betService.js / roundService.js / persistenceManager.js
├── api/                       # Vercel serverless functions
│   ├── send-email.js          # Email + sponsor banner injection
│   ├── f1-fixtures.js         # F1 via OpenF1 + championship model
│   ├── rugby-fixtures.js      # Rugby probability model
│   ├── football-model.js      # Football model (all competitions)
│   ├── tennis-model.js        # Tennis (inactive — model built)
│   ├── golf-model.js          # Golf (inactive — model built)
│   ├── nfl-model.js           # NFL (inactive — model built)
│   ├── set-reminder.js        # Fixture reminders
│   ├── request-deletion.js / cancel-deletion.js
├── public/
│   └── landing.html           # Marketing landing page at bynapp.online/
├── docs/
│   ├── handoff.md             # This file
│   ├── backlog.md             # Full product backlog
│   ├── schema.md              # Database schema
│   ├── sports-calendar.md     # Season dates and activation schedule
│   └── decisions.md / tester-guide.md
└── vercel.json                # / → landing.html, /api/* → serverless, /* → index.html
```

### southscale-web (company site + admin)
```
southscale-web/
├── index.html                 # Company homepage
├── package.json
├── vercel.json
├── api/
│   ├── admin-stats.js         # Dashboard stats (Supabase queries)
│   └── admin-fixtures.js      # Fixture proxy — calls bynapp.online endpoints server-side
├── admin/
│   └── index.html             # Password-protected admin (Dashboard / Fixtures / Backlog tabs)
└── legal/
    ├── byn-privacy.html
    └── byn-terms.html
```

---

## Environment Variables

### Vercel — byn-test
| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase URL (browser) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (browser) |
| `RESEND_API_KEY` | Resend email (server-side, no VITE_ prefix) |
| `SUPABASE_URL` | Supabase URL (serverless functions) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (serverless) |
| `API_SPORTS_KEY` | API-Sports (not used — free plan lacks current season) |
| `RUGBY_API_KEY` | Highlightly Rugby (not used — own model instead) |

### Vercel — southscale-web
| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `ADMIN_PASSWORD` | Admin dashboard password |

---

## Active Competitions (July 2026) — 14 active

| Competition | Key | Format | Status |
|---|---|---|---|
| Premier League | `epl` | three_way | Starts Aug 21 2026 |
| Championship | `championship` | three_way | Starts Aug 14 2026 |
| League One | `league_one` | three_way | Starts Aug 14 2026 |
| League Two | `league_two` | three_way | Starts Aug 14 2026 |
| National League | `national_league` | three_way | Starts Aug 14 2026 |
| La Liga | `laliga` | three_way | Starts Aug 2026 |
| Champions League | `ucl` | three_way | Starts Sep 16 2026 |
| Nations Championship | `nations_champ` | three_way | LIVE — Jul–Nov 2026 |
| Rugby Championship | `rugby_champ` | three_way | Starts Aug 8 2026 |
| Six Nations | `six_nations` | three_way | Feb 2027 |
| URC | `urc` | three_way | Starts Sep 25 2026 |
| Premiership Rugby | `prem_rugby` | three_way | Starts Sep 25 2026 |
| Super Rugby Pacific | `super_rugby` | three_way_no_draw | Feb 2027 |
| F1 | `f1` | outright | Belgian GP Jul 18 2026 |

### Inactive (model built, ready to activate)
`fifa_wc`, `euros`, `rugby_wc`, `nfl`, `tennis`, `pga`, `nba`, `ipl`, `motogp`, `nascar`
To activate: set `active: true` in `constants.js` and `UPDATE competitions SET active = true WHERE key = '...'` in Supabase.

---

## Probability Models

All built in-house. No external odds API dependency.

| Sport | File | Data source |
|---|---|---|
| F1 | `/api/f1-fixtures.js` | OpenF1 (free) + 2026 championship standings. 22 drivers, full names + teams. |
| International rugby | `/api/rugby-fixtures.js` | World Rugby PulseLive rankings (free) + H2H records |
| Club rugby | `/api/rugby-fixtures.js` | Team strength ratings (URC, Prem, Super Rugby) |
| Football international | `/api/football-model.js` | FIFA ranking points + ELO model |
| Football club | `/api/football-model.js` | Team strength ratings. 90-day window. |
| Tennis | `/api/tennis-model.js` | ATP/WTA rankings + grass adjustment (inactive) |
| Golf | `/api/golf-model.js` | OWGR + links history (inactive) |
| NFL | `/api/nfl-model.js` | Team power ratings (inactive) |

**Football model covers:** `epl`, `championship`, `league_one`, `league_two`, `national_league`, `laliga`, `ucl`, `fifa_wc`, `euros`
**Rugby model covers:** `nations_champ`, `rugby_champ`, `six_nations`, `urc`, `prem_rugby`, `super_rugby`, `rugby_wc`

---

## Key Architecture

- **No React Router** — navigation via React state (`tab`, `activeCompKey`). SPA handled by `vercel.json` routes.
- **Constants split** — heavy data in `src/constants.js`, imported into App.jsx.
- **Fixture caching** — `round_fixtures` Supabase table caches model output per competition per round.
- **90-day fixture window** — models look 90 days ahead so upcoming seasons show in app and admin.
- **Server-side email** — all email via `/api/send-email.js` (avoids CORS, keeps Resend key off browser).
- **Sponsor banners** — injected into all emails from `sponsor_slots` Supabase table using `__SPONSOR_BANNER__` marker.
- **All competitions shown** — active flag controls visibility. Off-season comps show "No fixtures" card with next date + Remind Me button.

---

## Game Logic

- **Round flow:** Open → Locked (1hr before first event) → Results → Settled → Next round
- **LMSR pricing:** `q` values set from model probabilities, moved by user bets
- **Minimum commitment:** 50% of balance must be staked before lockout. Shortfall forfeited.
- **Payouts:** Stake × (1/probability at bet time). Locked in at bet.
- **Season reset:** Balances clear to 0 at season end.
- **Demo buttons:** "Advance to lockout" and "Simulate results" still visible — remove before go-live.
- **Season length:** `SEASON_LENGTH_DEMO = 4` — change to real values (EPL=38 etc.) before go-live.

---

## Email Types (Resend — `noreply@bynapp.online`)

All routed through `/api/send-email.js`. Sponsor banner auto-injected from `sponsor_slots` table.

1. **Welcome** — new user setup completion
2. **Round settled** — subject: "Round X settled — See your results"
3. **Deletion confirmation** — 60-day cooling-off request
4. **Deletion reminder** — 7 days before cooling-off expires
5. **Reminder confirmation** — when user sets a fixture reminder

---

## Supabase — Key Tables

`profiles`, `sport_categories`, `competitions`, `wallets`, `betting_rounds`, `events`, `markets`, `market_outcomes`, `bets`, `round_standings`, `groups`, `group_members`, `ad_views`, `referrals`, `sponsor_slots`, `pending_deletions`, `reminders`, `round_fixtures`

---

## Admin Dashboard (southscale.co.uk/admin)

Password protected. Three tabs:
- **Dashboard** — auto-refreshes every 5 min. Users, bets, competitions, rounds, leagues, health alerts.
- **Fixtures** — all competitions split into **Active on BYN** and **Not currently active** sections. Fetched via `/api/admin-fixtures.js` proxy (server-side, avoids CORS).
- **Backlog** — live from `docs/backlog.md` on GitHub main branch.

---

## Known Demo Limitations

- Demo simulator buttons visible — remove before go-live
- `SEASON_LENGTH_DEMO = 4` — set real values
- F1 always shows current real-world next race (Belgian GP Jul 18) regardless of demo round
- Bot simulation (`BOTS` array) still active — remove before go-live

---

## Top Priorities (from backlog)

1. Update EFL GW1 fixtures when full lists published (Championship confirmed: Wolves vs Blackburn Aug 14)
2. Reminder cron job — `reminders` table needs scheduled job to send 7-day-before email
3. Apple Sign In — required for App Store
4. Stripe — league slot purchases
5. Incorporate SouthScale — Companies House (£50)
6. ICO registration — £40/year

---

## Accounts

| Service | Owner |
|---|---|
| GitHub (SouthScale-HQ) | andrew@southscale.co.uk |
| Vercel (both projects) | andrew@southscale.co.uk |
| Supabase | andrew@southscale.co.uk |
| GoDaddy (bynapp.online) | andrew@southscale.co.uk |
| Resend | andrew@southscale.co.uk |
| Google Cloud | andrew@southscale.co.uk |
