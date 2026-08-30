# Betnare Admin API

Admin operations for managing the Betnare platform. This guide covers the protected routes that require an account with the `admin` role.

## Stack

- Express 4
- MongoDB / Mongoose 8
- Zod validation
- JWT bearer authentication
- EuroVirtuals / BetKraft virtual provider integration

## Features

- Admin authentication through the standard user login flow
- Manual wallet credit
- Sportsbook event creation
- Event settlement and payout processing
- Virtual shortcode session initiation

## Environment

Base API URL:

```bash
http://localhost:5050/api/v1
```

Admin routes require:

- `Authorization: Bearer <token>`
- a user account whose `role` is `admin`

Seeded admin account:

- Phone: `254700000001`
- Password: `password123`

## Getting started

### 1. Log in as admin

```bash
curl -s http://localhost:5050/api/v1/users/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"254700000001","password":"password123"}'
```

### 2. Reuse the token

```bash
ADMIN_TOKEN="REPLACE_ADMIN_TOKEN"
```

## Main routes

- `POST /users/credit`
- `POST /events`
- `POST /events/:id/settle`
- `POST /virtuals/shortcode/:game_uuid`

## API integration notes

- Admin protection is enforced in the route layer with `authenticate` and `authorize('admin')`.
- The same `/users/login` endpoint is used for both normal users and admins.
- Event settlement triggers sportsbook bet resolution and winner payouts.
- Virtual shortcode requests are proxied to the provider through the virtual integration client.

## Required payloads

Unless noted otherwise, protected requests send `Authorization: Bearer <token>`.

### Auth

`POST /users/login`

```json
{
  "phone": "254700000001",
  "password": "password123"
}
```

### Wallet management

`POST /users/credit`

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "amount": 500
}
```

Example:

```bash
curl -s http://localhost:5050/api/v1/users/credit \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"507f1f77bcf86cd799439011","amount":500}'
```

### Events

`POST /events`

```json
{
  "sport": "football",
  "league": "Premier League",
  "homeTeam": "The Reds",
  "awayTeam": "London Reds",
  "startTime": "2026-07-01T12:00:00.000Z",
  "selections": [
    { "key": "home", "label": "Home Team wins", "odds": 1.78 },
    { "key": "draw", "label": "Draw", "odds": 3.2 },
    { "key": "away", "label": "Away Team wins", "odds": 4.1 }
  ]
}
```

Example:

```bash
curl -s http://localhost:5050/api/v1/events \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "sport":"football",
    "league":"Premier League",
    "homeTeam":"The Reds",
    "awayTeam":"London Reds",
    "startTime":"2026-07-01T12:00:00.000Z",
    "selections":[
      {"key":"home","label":"Home Team wins","odds":1.78},
      {"key":"draw","label":"Draw","odds":3.2},
      {"key":"away","label":"Away Team wins","odds":4.1}
    ]
  }'
```

`POST /events/:id/settle`

```json
{
  "result": "home"
}
```

Example:

```bash
EVENT_ID="REPLACE_EVENT_ID"

curl -s http://localhost:5050/api/v1/events/$EVENT_ID/settle \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"result":"home"}'
```

### Virtuals

`POST /virtuals/shortcode/:game_uuid`

```json
{
  "player_id": "507f1f77bcf86cd799439011",
  "player_name": "Jimmy",
  "currency": "KES",
  "content": "1",
  "channel": "ussd"
}
```

Example:

```bash
GAME_UUID="REPLACE_GAME_UUID"

curl -s http://localhost:5050/api/v1/virtuals/shortcode/$GAME_UUID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "player_id":"507f1f77bcf86cd799439011",
    "player_name":"Jimmy",
    "currency":"KES",
    "content":"1",
    "channel":"ussd"
  }'
```

## Notes

- Phone numbers are normalized to `2547XXXXXXXX` by the API.
- Public and standard user flows remain documented in [README.md](./README.md).
- The dashboard frontend wires these admin actions into [src/pages/Settings.jsx](./src/pages/Settings.jsx).
