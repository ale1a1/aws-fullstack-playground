# Debug Exercise — error3

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
2. Try loading the users list
3. Try all CRUD operations

## Debugging Guidance
- Check CloudWatch logs for Lambda errors
- Look for database connection errors
- Check the Lambda environment variables in AWS Console
  Lambda → functions → users-api-dev-getUsers → Configuration → Environment variables
- Compare environment variable names with what the code expects
