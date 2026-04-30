# Debug Exercise — error1

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
2. Try adding a new user
3. Check the users list

## Debugging Guidance
- Use the browser Network tab to inspect request payloads
- Check what the API receives vs what it expects
- Check CloudWatch logs for the createUser Lambda
- Compare the request body with the API contract
