# AWS Full-Stack Learning Project

A full-stack web application built to practice and demonstrate real-world AWS cloud development. The app manages a list of users and integrates multiple AWS services end to end.

---

## What This App Does

- Create, read, update, and delete users
- Store data in PostgreSQL (local or AWS RDS)
- Trigger async email notifications via AWS SQS + Lambda
- Send real emails via AWS SES
- Serve the frontend via AWS S3 + CloudFront

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript |
| Local API | NestJS (Node.js) |
| Cloud API | AWS Lambda + API Gateway |
| Database | PostgreSQL (local or AWS RDS) |
| Async queue | AWS SQS |
| Email | AWS SES |
| Frontend hosting | AWS S3 + CloudFront |
| Monitoring | AWS CloudWatch |
| Infrastructure | Serverless Framework |

---

## Project Structure

```
/
├── src/                    NestJS local API
│   ├── app.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── db.ts               DB toggle (local vs RDS)
│   └── main.ts
├── frontend/               React + Vite frontend
│   └── src/
│       ├── api.ts          API toggle (local vs Lambda)
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── Users.tsx
│       │   └── AddUser.tsx
│       └── main.tsx
├── aws-lambda/             AWS Lambda handlers
│   ├── handler.js          All Lambda functions + SQS worker
│   └── serverless.yml      Serverless Framework config
├── .env                    Local env vars (gitignored — never commit this)
└── README.md               This file
```

---

## Environment Toggles

This project is designed to run in multiple configurations without code changes beyond two toggle flags.

### Frontend toggle — `frontend/src/api.ts`

```js
const USE_LAMBDA = false  // true = AWS Lambda, false = local NestJS
```

### Local API toggle — `src/db.ts`

```js
const USE_RDS = false  // true = AWS RDS, false = local PostgreSQL
```

### The 3 usable combinations

| USE_LAMBDA | USE_RDS | What runs |
|---|---|---|
| `false` | `false` | Local NestJS API → Local PostgreSQL |
| `false` | `true` | Local NestJS API → AWS RDS |
| `true` | — | AWS Lambda → AWS RDS (Lambda always uses RDS) |

---

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL (for local DB)
- AWS CLI configured (`aws configure`)
- Serverless Framework (`npm install -g serverless`)

---

## Option A — Run Locally (no AWS required)

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd nest-api
```

### 2. Set up environment variables

Create a `.env` file in the project root (this file is gitignored):

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/nestdb
RDS_URL=postgresql://postgres:yourpassword@your-rds-endpoint:5432/postgres
```

> `RDS_URL` is only needed if you want to connect to AWS RDS from the local API.

### 3. Create the local database

Using pgAdmin or psql:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL
);
```

### 4. Set toggles

In `src/db.ts`:
```js
const USE_RDS = false;
```

In `frontend/src/api.ts`:
```js
const USE_LAMBDA = false;
```

### 5. Install dependencies and run

```bash
# Install API dependencies
npm install

# Start local NestJS API
npm run start:dev

# In a new terminal — install and start frontend
cd frontend
npm install
npm run dev
```

App runs at:
- API → `http://localhost:3000`
- Frontend → `http://localhost:5173`

---

## Option B — Deploy to AWS

### AWS Services you need to set up

| Service | Purpose | Notes |
|---|---|---|
| RDS (PostgreSQL) | Database | Enable public access, open port 5432 in security group |
| S3 | Frontend hosting | Enable static website hosting, make bucket public |
| CloudFront | HTTPS CDN for frontend | Point to S3 website endpoint |
| SES | Email sending | Verify sender domain, request production access |
| Lambda + API Gateway | Backend API | Deployed via Serverless Framework |
| SQS | Async email queue | Created automatically by Serverless Framework |
| CloudWatch | Logs and monitoring | Created automatically |

---

### Step 1 — Set up RDS

1. Create a PostgreSQL RDS instance in AWS
2. Enable **Public accessibility**
3. Add inbound rule to security group: `PostgreSQL TCP 5432 0.0.0.0/0`
4. Connect via pgAdmin and run:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL
);
```

---

### Step 2 — Set up SES (email sending)

1. Go to **AWS SES → Verified identities → Create identity**
2. Verify your sender email address (click the link AWS sends you)
3. Verify your sending domain (add CNAME DNS records to your domain registrar)
4. Go to **SES → Account dashboard → Request production access**
   - Mail type: Transactional
   - Website URL: your CloudFront URL
   - Describe your use case honestly
5. Wait 24-48h for AWS approval

> Until production access is granted, SES only sends to verified email addresses (sandbox mode).

---

### Step 3 — Deploy Lambda + API Gateway

```powershell
cd aws-lambda
npm install

# Set your environment variables (never hardcode these)
$env:DB_URL="postgresql://user:password@your-rds-endpoint:5432/postgres"
$env:SENDER_EMAIL="your-verified-sender@yourdomain.com"

serverless deploy
```

Note the API Gateway endpoint URL from the output — you'll need it for the frontend.

---

### Step 4 — Update frontend API endpoint

In `frontend/src/api.ts`, update `LAMBDA_BASE` with your API Gateway URL:

```js
const LAMBDA_BASE = 'https://YOUR-API-ID.execute-api.YOUR-REGION.amazonaws.com/users';
```

Set the toggle:
```js
const USE_LAMBDA = true;
```

---

### Step 5 — Deploy frontend to S3

1. Create an S3 bucket (e.g. `my-users-app`)
2. Enable **Static website hosting**
3. Set **Error document** to `index.html` (required for client-side routing)
4. Make bucket publicly accessible

```bash
cd frontend
npm run build
aws s3 sync .\dist s3://your-bucket-name
```

---

### Step 6 — Set up CloudFront

1. Go to **CloudFront → Create distribution**
2. Origin domain: your S3 website endpoint (e.g. `my-users-app.s3-website.eu-west-2.amazonaws.com`)
3. Protocol: HTTP only
4. Viewer protocol policy: Redirect HTTP to HTTPS
5. After creation, add error pages: `403` and `404` → `/index.html` → response `200`

Your CloudFront URL (`https://xxxx.cloudfront.net`) is your shareable app URL.

---

## Async Email Flow

When a user is created, updated, or deleted:

```
Lambda (API) → SQS (delayed) → Worker Lambda → SES → Email
```

| Event | Delay | Email |
|---|---|---|
| User created | 1 minute | Welcome email |
| User updated | 1 minute | Update notification |
| User deleted | 3 minutes | Goodbye email |

---

## Debugging Branches

This repo includes 7 branches, each containing a single realistic production bug.
Use them to practice debugging across different AWS layers.

| Branch | Layer |
|---|---|
| `error1` | Frontend |
| `error2` | Frontend / API config |
| `error3` | Lambda configuration |
| `error4` | API Gateway |
| `error5` | Database |
| `error6` | IAM permissions |
| `error7` | SQS |

Each branch has a `README-debug.md` with deployment instructions and debugging hints — but no spoilers.

### How to use a debug branch

```bash
git checkout error1
# Follow README-debug.md to deploy and test
# Find and fix the bug
# Compare with master to verify your fix
git diff master
```

---

## Security — Important

- **Never commit `.env`** — it is gitignored, keep it that way
- **Never hardcode credentials** in `handler.js`, `serverless.yml`, or any source file
- **Always pass secrets at deploy time** via environment variables:
  ```powershell
  $env:DB_URL="..."
  $env:SENDER_EMAIL="..."
  serverless deploy
  ```
- **Rotate your RDS password** if you ever accidentally expose it
- **Review IAM permissions** — follow least privilege in production

---

## CloudWatch — Monitoring

All Lambda functions log to CloudWatch automatically.

| Log group | What it shows |
|---|---|
| `/aws/lambda/users-api-dev-getUsers` | Incoming requests, DB errors |
| `/aws/lambda/users-api-dev-createUser` | User creation, SQS queue confirmation |
| `/aws/lambda/users-api-dev-worker` | Email processing, SES responses |

---

## Local API vs Lambda — Quick Reference

| | Local API | AWS Lambda |
|---|---|---|
| Start | `npm run start:dev` | `serverless deploy` |
| Logs | Terminal | CloudWatch |
| DB | Local PostgreSQL or RDS | RDS only |
| URL | `http://localhost:3000` | API Gateway URL |
| Cost | Free | AWS free tier |
