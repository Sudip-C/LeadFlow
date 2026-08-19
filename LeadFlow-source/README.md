# LeadFlow

A polished lead-tracking dashboard for managing prospects, pipeline stages, activities, and deal values in Indian Rupees.

**Live app:** https://leadflow-tracker.sudip-chowdhury001.chatgpt.site

## Features

- Add, view, edit, and delete complete lead records
- Track leads through New, Contacted, Qualified, Proposal, Won, and Lost stages
- Dashboard overview, pipeline view, and recent activity feed
- Search and filter lead records
- Export lead data as CSV
- Indian Rupee (`INR`) deal-value formatting
- Persistent Cloudflare D1 storage
- Clean empty state with no production mock data
- Responsive desktop and mobile interface

## Tech stack

- React 19 and Next.js 16
- TypeScript
- Vinext and Vite
- Cloudflare Workers and D1
- Drizzle ORM
- Tailwind CSS 4

## Run locally

### Requirements

- Node.js 22.13 or newer
- npm

```bash
npm install
npm run dev
```

Open the local URL printed in your terminal.

## Useful commands

```bash
npm run dev       # Start the development server
npm run build     # Create and validate a production build
npm test          # Build and run tests
npm run lint      # Run ESLint
npm run db:generate
```

## Project structure

```text
app/                UI and API routes
db/                 Drizzle database schema and binding
drizzle/            D1 database migrations
public/             Static assets
scripts/            Build and validation helpers
tests/              Automated tests
worker/             Cloudflare Worker entry point
```

## Data

LeadFlow does not seed demonstration leads. A new deployment starts with an empty database, and leads are created through the application interface.

## License

This project is currently provided for portfolio and demonstration purposes.
