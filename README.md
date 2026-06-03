# Client Radar

Client Radar is a minimal MVP SaaS for freelancers. A user connects Gmail, the app scans recent threads, and OpenAI generates a daily-style report with missed follow-ups, unanswered questions, payment risks, deadlines, forgotten promises, and warm leads going cold.

## Stack

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- Google OAuth + Gmail API readonly scope
- OpenAI API
- Railway deployment

## Environment variables

Copy `.env.example` to `.env` locally and fill in values:

```bash
DATABASE_URL=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
APP_URL=
```

`GOOGLE_REDIRECT_URI` should point to `/api/auth/google/callback`, for example `http://localhost:3000/api/auth/google/callback` locally or `https://your-app.up.railway.app/api/auth/google/callback` in production.

## Local development

```bash
npm install
npm run dev
```

Run migrations locally after creating a PostgreSQL database:

```bash
npx prisma migrate dev --name init
```

Run a manual report for all users:

```bash
npm run report
```

## Required scripts

- `npm run dev` — starts local development server
- `npm run build` — generates Prisma client and builds Next.js
- `npm run start` — starts Next.js using `process.env.PORT` when available
- `npm run prisma:migrate` — deploys Prisma migrations
- `npm run report` — runs reports for all connected users

## Railway deployment

1. Create a Railway project.
2. Add PostgreSQL to the project.
3. Add the environment variables from `.env.example`.
4. Deploy the app from GitHub.
5. Run the Prisma migration command:
   ```bash
   npm run prisma:migrate
   ```
6. Open the Railway app URL.

## OAuth setup

In Google Cloud Console:

1. Create OAuth credentials for a web application.
2. Add the app URL callback to authorized redirect URIs.
3. Enable Gmail API.
4. Request only these scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/gmail.readonly`

## Security notes

- Gmail tokens are never exposed to the frontend.
- Gmail access tokens are never logged.
- `.env` is ignored by git.
- Gmail access is readonly.
- Full email bodies are sent to OpenAI for analysis but are not saved permanently in the database.
