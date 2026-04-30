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
├── .env                    Your local secrets — gitignored, never committed
├── .env.example            Template showing every variable you need to set
└── README.md               This file
```

---

## Environment Variables

All secrets live in a single `.env` file at the project root. **This file is gitignored and must never be committed.**

### Step 1 — Create your `.env`

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

Then open `.env` and set:

```
# Local PostgreSQL — only needed for Option A (local dev)
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/nestdb

# AWS RDS — only needed if connecting local API to RDS, or for Lambda deploy
RDS_URL=postgresql://postgres:yourpassword@your-rds-endpoint.rds.amazonaws.com:5432/postgres

# SES sender email — only needed for Lambda deploy (email notifications)
SENDER_EMAIL=your-verified-sender@yourdomain.com
```

> You do not need all three at once. See which ones each option requires below.

---

## Two Code Toggles

The entire local-vs-AWS switch is controlled by two lines of code. You do not need to change anything else.

### Toggle 1 — Which database does the local API use?

File: `src/db.ts`

```js
const USE_RDS = false   // false = local PostgreSQL, true = AWS RDS
```

### Toggle 2 — Which API does the frontend call?

File: `frontend/src/api.ts`

```js
const USE_LAMBDA = false   // false = local NestJS on :3000, true = AWS Lambda
```

Also in `frontend/src/api.ts` — replace this with your API Gateway URL after deploying Lambda:

```js
const LAMBDA_BASE = 'https://YOUR-API-ID.execute-api.YOUR-REGION.amazonaws.com/users';
```

### The 3 valid combinations

| USE_LAMBDA | USE_RDS | What runs | Env vars needed |
|---|---|---|---|
| `false` | `false` | Local NestJS → Local PostgreSQL | `DATABASE_URL` |
| `false` | `true` | Local NestJS → AWS RDS | `RDS_URL` |
| `true` | — | AWS Lambda → AWS RDS | `RDS_URL`, `SENDER_EMAIL` (at deploy time) |

---

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL installed locally (for Option A)
- AWS CLI installed and configured: run `aws configure` and enter your AWS Access Key ID, Secret Access Key, and region
- Serverless Framework: `npm install -g serverless` (for Lambda deploy)

---

## Option A — Run Fully Locally (no AWS required)

**Env vars needed:** `DATABASE_URL` in `.env`

**Toggles:** `USE_LAMBDA = false`, `USE_RDS = false`

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd nest-api
```

### 2. Create your `.env`

```bash
cp .env.example .env
```

Edit `.env` — you only need this line for local dev:

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/nestdb
```

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

`src/db.ts`:
```js
const USE_RDS = false;
```

`frontend/src/api.ts`:
```js
const USE_LAMBDA = false;
```

### 5. Install and run

```bash
# Root — install NestJS API dependencies
npm install

# Start the local API
npm run start:dev
```

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

App is running at:
- API → `http://localhost:3000`
- Frontend → `http://localhost:5173`

---

## Option B — Deploy to AWS

This deploys the full stack: Lambda + API Gateway backend, RDS database, SES email, S3 + CloudFront frontend.

**Env vars needed:** `RDS_URL` and `SENDER_EMAIL` in `.env`

### AWS services to set up first

| Service | Purpose | Notes |
|---|---|---|
| RDS (PostgreSQL) | Database | Enable public access, open port 5432 in security group |
| SES | Email sending | Verify sender email and domain |
| Lambda + API Gateway | Backend API | Deployed automatically via Serverless Framework |
| SQS | Async email queue | Created automatically by Serverless Framework |
| S3 | Frontend hosting | Enable static website hosting |
| CloudFront | HTTPS CDN | Points to S3 website endpoint |
| CloudWatch | Logs | Created automatically |

---

### Step 1 — Set up RDS

1. Create a PostgreSQL RDS instance in the AWS Console
2. Enable **Public accessibility**
3. Add an inbound rule to its security group: `PostgreSQL / TCP / 5432 / 0.0.0.0/0`
4. Once created, copy the **Endpoint** from RDS → your instance → Connectivity & security
5. Add it to your `.env`:

```
RDS_URL=postgresql://postgres:yourpassword@your-endpoint.rds.amazonaws.com:5432/postgres
```

6. Connect via pgAdmin and create the table:

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
2. Verify the email address you want to send from (AWS sends you a confirmation link)
3. Add that address to your `.env`:

```
SENDER_EMAIL=your-verified-sender@yourdomain.com
```

4. Optionally verify your full domain (add the CNAME records AWS gives you to your DNS provider)
5. To send to any recipient (not just verified addresses), go to **SES → Account dashboard → Request production access**

> In sandbox mode SES only sends to addresses you have verified. Production access takes 24-48h.

---

### Step 3 — Deploy Lambda + API Gateway

The Lambda functions read `DB_URL` and `SENDER_EMAIL` from environment variables passed at deploy time — **not** from your `.env` file directly. Pass them on the command line:

**macOS / Linux / Git Bash:**
```bash
cd aws-lambda
npm install
DB_URL="$(grep RDS_URL ../.env | cut -d= -f2-)" \
SENDER_EMAIL="$(grep SENDER_EMAIL ../.env | cut -d= -f2-)" \
serverless deploy
```

**Windows PowerShell:**
```powershell
cd aws-lambda
npm install
$env:DB_URL = "postgresql://postgres:yourpassword@your-endpoint.rds.amazonaws.com:5432/postgres"
$env:SENDER_EMAIL = "your-verified-sender@yourdomain.com"
serverless deploy
```

After deploy, the terminal prints your **API Gateway URL** — it looks like:
```
endpoint: https://abc123xyz.execute-api.eu-west-2.amazonaws.com
```

Copy it — you need it in the next step.

---

### Step 4 — Wire the frontend to your Lambda

Open `frontend/src/api.ts` and make two changes:

```js
const USE_LAMBDA = true;   // switch from local to Lambda

const LAMBDA_BASE = 'https://YOUR-API-ID.execute-api.YOUR-REGION.amazonaws.com/users';
//                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                            Replace with your actual API Gateway URL + /users
```

---

### Step 5 — Deploy frontend to S3

1. Create an S3 bucket (e.g. `my-users-app`)
2. Enable **Static website hosting** under the bucket's Properties tab
3. Set **Error document** to `index.html` (required — the app uses client-side routing)
4. Under Permissions, make the bucket publicly accessible

```bash
cd frontend
npm run build
aws s3 sync ./dist s3://your-bucket-name
```

---

### Step 6 — Set up CloudFront

1. Go to **CloudFront → Create distribution**
2. **Origin domain**: paste your S3 *website* endpoint (e.g. `my-users-app.s3-website.eu-west-2.amazonaws.com`) — not the S3 bucket ARN
3. **Origin protocol**: HTTP only
4. **Viewer protocol policy**: Redirect HTTP to HTTPS
5. After creation, go to **Error pages** and add two rules:
   - HTTP error code `403` → Response page `/index.html` → HTTP response code `200`
   - HTTP error code `404` → Response page `/index.html` → HTTP response code `200`

Your CloudFront URL (`https://xxxx.cloudfront.net`) is your shareable public app URL.

---

## Async Email Flow

When a user is created, updated, or deleted, the Lambda puts a delayed message on SQS. A worker Lambda picks it up and sends a real email via SES.

```
Lambda (API) → SQS (delayed) → Worker Lambda → SES → Email
```

| Event | Delay | Email sent |
|---|---|---|
| User created | 1 minute | Welcome email |
| User updated | 1 minute | Update notification |
| User deleted | 3 minutes | Goodbye email |

---

## Debugging Branches

This repo includes 7 branches, each containing a single realistic production bug. Use them to practice debugging across different AWS layers.

**Before using a debug branch, deploy the working app from `master` first so you have a baseline.**

| Branch | Bug layer |
|---|---|
| `error1` | Frontend |
| `error2` | Frontend / API config |
| `error3` | Lambda configuration |
| `error4` | API Gateway |
| `error5` | Database |
| `error6` | IAM permissions |
| `error7` | SQS |

Each branch has a `README-debug.md` with deployment instructions and debugging hints — no spoilers.

### How to use a debug branch

```bash
# Switch to a bug branch
git checkout error1

# Update frontend/src/api.ts with your API Gateway URL and set USE_LAMBDA = true
# Deploy Lambda (same as Step 3 above)
# Rebuild and re-upload the frontend (same as Steps 4-5 above)

# Reproduce the bug, find it, fix it
# Compare your fix against master
git diff master -- frontend/src/api.ts
```

---

## Security

- **Never commit `.env`** — it is gitignored. Use `.env.example` as the template.
- **Never hardcode credentials** in `handler.js`, `serverless.yml`, or any source file
- **Always pass secrets at deploy time** via environment variables (see Step 3)
- **Rotate your RDS password** if you ever accidentally expose it
- **Review IAM permissions** — follow least privilege in production

---

## CloudWatch — Monitoring

All Lambda functions log to CloudWatch automatically. To view logs: **AWS Console → CloudWatch → Log groups**.

| Log group | What it shows |
|---|---|
| `/aws/lambda/users-api-dev-getUsers` | Incoming requests, DB errors |
| `/aws/lambda/users-api-dev-createUser` | User creation, SQS message confirmation |
| `/aws/lambda/users-api-dev-worker` | Email processing, SES responses |

---

## Local vs Lambda — Quick Reference

| | Local (Option A) | AWS (Option B) |
|---|---|---|
| Start API | `npm run start:dev` | `serverless deploy` |
| Logs | Terminal | CloudWatch |
| Database | Local PostgreSQL | AWS RDS |
| Frontend URL | `http://localhost:5173` | CloudFront URL |
| Cost | Free | AWS free tier |
