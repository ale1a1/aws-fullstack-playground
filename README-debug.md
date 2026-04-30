# Debug Exercise — error6

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
3. Wait a few minutes and check if the welcome email arrives
4. Delete a user and wait

## Debugging Guidance
- Check CloudWatch logs for the createUser and deleteUser Lambdas
- Look for AccessDenied or permission errors in the logs
- Check the Lambda IAM role in AWS Console
  Lambda → functions → users-api-dev-createUser → Configuration → Permissions
- Check SQS — are messages being queued or failing silently?
- Check the IAM policy attached to the Lambda execution role
