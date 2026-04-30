# Debug Exercise — error7

## Deploy Backend
```powershell
cd aws-lambda
$env:DB_URL="your-rds-connection-string"
$env:SENDER_EMAIL="your-verified-email"
serverless deploy
```

## Deploy Frontend
```bash
cd frontend
npm run build
aws s3 sync .\dist s3://nestjs-fe
```

## How to Test
1. Open the app
2. Add a new user
3. Wait a few minutes — check if the welcome email arrives
4. Check SQS and CloudWatch

## Debugging Guidance
- Add a user and check CloudWatch logs for createUser — did the message get queued?
- Check SQS → users-events-queue → Monitoring — are messages piling up?
- Check Lambda → users-api-dev-worker → Configuration → Triggers
  Is the SQS trigger correctly pointing to the right queue?
- Compare the queue ARN in the trigger vs the actual queue ARN in SQS
- Check CloudWatch for the worker Lambda — are there any invocations at all?
