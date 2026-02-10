# Scorebit

A real-time sports match and live commentary server built with Express.js and WebSockets. Scorebit provides a robust backend for managing sports matches, tracking game status, and broadcasting live commentary events to multiple connected clients.

## Features

- **Match Management**: Create and retrieve sports matches with detailed information
- **Real-Time Commentary**: Add live event updates and commentary with metadata support
- **WebSocket Broadcasting**: Instant updates to all connected clients via WebSocket subscriptions
- **Live Status Tracking**: Automatic match status management (scheduled, live, finished)
- **Validation & Security**: Input validation with Zod and rate-limiting with Arcjet
- **Database Persistence**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Performance Monitoring**: APMInsight integration for application monitoring

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Web Framework**: Express.js
- **Real-Time Communication**: WebSocket (ws)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod
- **Security**: Arcjet
- **Monitoring**: APMInsight

## Getting Started

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd scorebit
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the project root:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/scorebit
   PORT=3000
   HOST=localhost
   ARCJET_KEY=your_arcjet_key
   ```

4. **Set up the database**:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

### Running the Server

**Development mode** (with file watching):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

The server will be available at `http://localhost:3000` with WebSocket support at `ws://localhost:3000/ws`.

## Usage

### REST API Endpoints

#### Matches

**Get all matches**:

```bash
curl http://localhost:3000/matches
```

**Create a new match**:

```bash
curl -X POST http://localhost:3000/matches \
  -H "Content-Type: application/json" \
  -d '{
    "sport": "soccer",
    "homeTeam": "Team A",
    "awayTeam": "Team B",
    "startTime": "2026-02-15T15:00:00Z",
    "endTime": "2026-02-15T17:00:00Z"
  }'
```

#### Commentary

**Get commentary for a match**:

```bash
curl http://localhost:3000/matches/1/commentary
```

**Add commentary to a match**:

```bash
curl -X POST http://localhost:3000/matches/1/commentary \
  -H "Content-Type: application/json" \
  -d '{
    "minute": 45,
    "eventType": "goal",
    "actor": "Player Name",
    "team": "Team A",
    "message": "Goal scored!"
  }'
```

### WebSocket Connection

Connect to the WebSocket server at `ws://localhost:3000/ws`:

```javascript
const ws = new WebSocket("ws://localhost:3000/ws");

ws.onmessage = (event) => {
	const data = JSON.parse(event.data);
	console.log("Event:", data);
};

// Subscribe to match updates
ws.send(
	JSON.stringify({
		action: "subscribe",
		matchId: 1,
	}),
);
```

**WebSocket message types**:

- `match:created` - New match created
- `commentary:added` - Commentary added to a match

## Project Structure

```
scorebit/
├── src/
│   ├── index.js              # Application entry point
│   ├── arcjet.js             # Security middleware
│   ├── db/
│   │   ├── db.js             # Database client
│   │   └── schema.js         # Drizzle ORM schemas
│   ├── routes/
│   │   ├── matches.js        # Match endpoints
│   │   └── commentary.js     # Commentary endpoints
│   ├── ws/
│   │   └── server.js         # WebSocket server setup
│   ├── validation/
│   │   ├── matches.js        # Match validation schemas
│   │   └── commentary.js     # Commentary validation schemas
│   ├── utils/
│   │   └── match-status.js   # Match status utilities
│   └── shared/
│       └── constants.js      # Application constants
├── drizzle/                  # Database migrations
├── package.json
├── drizzle.config.js         # Drizzle ORM configuration
└── .env                      # Environment variables
```

## Database Schema

### Matches Table

Stores information about sports matches:

- `id` (Primary Key)
- `sport` (string)
- `homeTeam`, `awayTeam` (strings)
- `status` (enum: scheduled, live, finished)
- `startTime`, `endTime` (timestamps)
- `homeScore`, `awayScore` (integers)
- `createdAt` (timestamp)

### Commentary Table

Stores live event commentary linked to matches:

- `id` (Primary Key)
- `matchId` (Foreign Key)
- `minute` (integer)
- `sequence` (integer)
- `period` (string)
- `eventType` (string)
- `actor`, `team` (strings)
- `message` (string)
- `metadata` (JSON)
- `tags` (string)
- `createdAt` (timestamp)

## Database Management

**Generate migrations**:

```bash
npm run db:generate
```

**Apply migrations**:

```bash
npm run db:migrate
```

**Open Drizzle Studio UI** (visual database management):

```bash
npm run db:studio
```

## Configuration

### Environment Variables

| Variable       | Description                      | Required |
| -------------- | -------------------------------- | -------- |
| `DATABASE_URL` | PostgreSQL connection string     | Yes      |
| `PORT`         | Server port (default: 3000)      | No       |
| `HOST`         | Server host (default: localhost) | No       |
| `ARCJET_KEY`   | Arcjet security API key          | No       |

## Development

### Adding New Routes

1. Create a new file in `src/routes/`
2. Use Zod schemas in `src/validation/` for request validation
3. Import the router in `src/index.js` and add it to the app

### Database Schema Changes

1. Update schema in `src/db/schema.js`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:migrate` to apply migration

## Support

For issues, questions, or contributions, please refer to the [project repository](https://github.com/IbrahimItani01/scorebit-websockets).

## License

This project is licensed under the ISC license. See LICENSE file for details.

## Author

Ibrahim Itani

---

**Happy scoring!** 🎯
