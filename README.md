[README(1).md](https://github.com/user-attachments/files/31223621/README.1.md)
<div align="center">

# LeadFlow

### A modern lead-management dashboard for focused sales teams

Track prospects, manage your pipeline, monitor deal value, and export clean lead data from one professional workspace.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Open_LeadFlow-ef4b23?style=for-the-badge)](https://leadflow-tracker.sudip-chowdhury001.chatgpt.site)
[![GitHub](https://img.shields.io/badge/GitHub-Sudip--C%2FLeadFlow-111827?style=for-the-badge&logo=github)](https://github.com/Sudip-C/LeadFlow)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers_&_D1-f38020?style=flat-square&logo=cloudflare&logoColor=white)

</div>

## Overview

LeadFlow is a responsive, full-stack lead tracker designed to make day-to-day pipeline management simple. It replaces scattered spreadsheets with a focused dashboard where users can create leads, update every lead detail, move opportunities through sales stages, delete outdated records, and export the latest data as CSV.

The production database starts empty—there is no demonstration or mock lead data in the deployed application.

## Highlights

| Capability | Description |
| --- | --- |
| Lead management | Create, view, edit, and delete complete lead records |
| Sales pipeline | Move opportunities through six clearly defined stages |
| Business metrics | Monitor active pipeline value, won revenue, lead totals, and conversion |
| Search and filters | Find leads and narrow results by pipeline status |
| CSV export | Export filtered results or the complete lead list |
| INR deal values | Display and export monetary values in Indian Rupees |
| Activity view | Review the latest lead and pipeline activity |
| Persistent storage | Store real records in Cloudflare D1 through Drizzle ORM |
| Responsive interface | Use the dashboard across desktop, tablet, and mobile screens |

## Pipeline stages

`New` → `Contacted` → `Qualified` → `Proposal` → `Won`

Opportunities that do not progress can be moved to `Lost` at any time.

## Architecture


## Technology stack

| Layer | Technology |
| --- | --- |
| Interface | React 19, Next.js 16, TypeScript, Tailwind CSS 4 |
| Runtime | Vinext, Vite, Cloudflare Workers |
| Database | Cloudflare D1 / SQLite |
| ORM and migrations | Drizzle ORM, Drizzle Kit |
| Validation | Server-side request validation in the lead API |
| Deployment | ChatGPT Sites on Cloudflare infrastructure |

## Lead data model

Each lead contains:

- Full name
- Work email
- Company
- Deal value in INR
- Pipeline status
- Acquisition source
- Creation timestamp

## API

Lead operations are handled through `/api/leads`.

| Method | Operation |
| --- | --- |
| `GET` | Retrieve all leads, newest first |
| `POST` | Create a lead |
| `PATCH` | Update a status or complete lead record |
| `DELETE` | Permanently delete a lead |

Valid statuses are `New`, `Contacted`, `Qualified`, `Proposal`, `Won`, and `Lost`.

## Getting started

### Requirements

- Node.js 22.13 or newer
- npm
- macOS, Linux, or Windows with WSL/Git Bash for the included shell scripts

### Installation

```bash
git clone https://github.com/Sudip-C/LeadFlow.git
cd LeadFlow
npm install
npm run dev
```

Open the local URL displayed in the terminal.

On Windows PowerShell without WSL or Git Bash, start Vite directly after installation:

```powershell
npx vite
```

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build and validate the production artifact |
| `npm test` | Build the app and run automated tests |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate a new Drizzle migration |
| `npm run validate:artifact` | Validate an existing deployment artifact |

## Project structure

```text
LeadFlow/
├── app/                    # Dashboard UI and API routes
├── db/                     # Database connection and schema
├── drizzle/                # D1 migrations and metadata
├── public/                 # Static assets
├── scripts/                # Build and validation helpers
├── tests/                  # Automated tests
├── worker/                 # Cloudflare Worker entry point
├── .openai/hosting.json    # Hosting and D1 binding configuration
└── package.json
```

## Database and deployment

The deployed version uses a `DB` binding configured in `.openai/hosting.json`. Cloudflare D1 provides durable lead storage without requiring a separate database server or client-side credentials.

To deploy the project outside the current Cloudflare-based environment, replace the D1 connection with a supported database such as PostgreSQL and update the data-access layer accordingly.

## Data handling

- The repository does not contain production lead records.
- No mock leads are inserted during deployment.
- Input is validated by the server before database operations.
- Environment files and private keys are excluded through `.gitignore`.

## Roadmap

- User authentication and isolated workspaces
- Lead notes and follow-up reminders
- Import leads from CSV
- Custom pipeline stages
- Analytics and conversion reports
- Team collaboration and lead assignment

## Author

Created by **Sudip Chowdhury**.

- GitHub: [@Sudip-C](https://github.com/Sudip-C)


## License

No open-source license has been added yet. All rights are reserved by the project owner.
