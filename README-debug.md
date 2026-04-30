# Debug Exercise — error4

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
3. Try adding a new user

## Debugging Guidance
- Check the browser Network tab — look at the HTTP method and status code
- Check the API Gateway routes in AWS Console
  API Gateway → APIs → users-api → Routes
- Compare the route methods with what the frontend is sending
- Check CloudWatch logs for unexpected Lambda invocations
