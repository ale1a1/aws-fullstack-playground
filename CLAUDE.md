# Nest API — Learning Project

## Purpose
Practice NestJS with AWS services. Tools in scope:
- NestJS, PostgreSQL, Docker, pgAdmin, Postman
- AWS: S3, Lambda, API Gateway, SQS, CloudWatch

---

## Architecture

```
Frontend (React/Vite)
  └── api.ts  ← USE_LAMBDA toggle here
        ├── true  → AWS API Gateway → Lambda → RDS (PostgreSQL on AWS)
        └── false → Local NestJS API (localhost:3000) → USE_RDS toggle in db.ts
                        ├── true  → AWS RDS
                        └── false → Local PostgreSQL (Docker)
```

---

## Environment Toggles

### Frontend — which API to call
File: `frontend/src/api.ts`
```
USE_LAMBDA = true   → AWS API Gateway + Lambda + RDS
USE_LAMBDA = false  → Local NestJS on localhost:3000
```

### Local NestJS — which DB to use
File: `src/db.ts`
```
USE_RDS = true    → AWS RDS PostgreSQL
USE_RDS = false   → Local PostgreSQL (localhost:5432/nestdb)
```

### The 3 usable combinations
| USE_LAMBDA | USE_RDS | Stack |
|---|---|---|
| false | false | Local API → Local DB |
| false | true  | Local API → RDS |
| true  | —     | Lambda → RDS (Lambda always uses RDS) |

---

## Environment Variables (`.env` — gitignored)
```
DATABASE_URL   Local PostgreSQL connection string
RDS_URL        AWS RDS connection string
```

Lambda env vars are set at deploy time via `serverless.yml` and injected as `process.env.DB_URL`.

---

## Project Structure
```
/
├── src/                  NestJS API (local)
│   ├── app.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── db.ts             DB connection + USE_RDS toggle
│   └── main.ts
├── frontend/             React + Vite frontend
│   └── src/
│       ├── api.ts        API calls + USE_LAMBDA toggle
│       └── main.tsx
├── aws-lambda/           AWS Lambda functions
│   ├── handler.js        Lambda handlers (getUsers, deleteUser)
│   └── serverless.yml    Serverless Framework config
├── .env                  Local env vars (gitignored)
└── CLAUDE.md             This file
```

---

## Running Locally
```bash
# Start NestJS API
npm run start:dev

# Start Frontend
cd frontend && npm run dev

# Local app runs at:
#   API  → http://localhost:3000
#   FE   → http://localhost:5173
```

---

## Deploying

### Lambda (AWS)
```powershell
cd aws-lambda
$env:DB_URL="postgresql://postgres:password@your-rds-endpoint:5432/postgres"
serverless deploy                        # full deploy
serverless deploy function -f getUsers  # single function
```

### Frontend (S3)
```bash
cd frontend
npm run build
aws s3 sync .\dist s3://nestjs-fe
```

---

## Planned Features
- **AWS SQS** — when a user is created, push a message to an SQS queue. A Lambda consumer picks it up after a 5-minute delay and sends a welcome email.
- **CloudWatch** — logging and monitoring for Lambda functions.
- **Debugging branches** — 8-10 branches each containing a deliberate bug to practice debugging across the full stack.

---

## AWS Resources
| Resource | Name/ID |
|---|---|
| Lambda functions | `users-api-dev-getUsers`, `users-api-dev-deleteUser` |
| API Gateway | `2hofv3uwna.execute-api.eu-west-2.amazonaws.com/dev` |
| S3 bucket (FE) | `nestjs-fe` |
| RDS instance | `users-db1.cshuki2gk2sv.us-east-1.rds.amazonaws.com` |
| RDS region | `us-east-1` (note: Lambda is in `eu-west-2` — consider migrating RDS) |
