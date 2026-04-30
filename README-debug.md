# Debug Exercise — error2

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
- Check the browser Network tab — look at the request URLs
- Check the browser Console for errors
- Verify the API Gateway endpoint in the AWS console
- Compare the endpoint being called vs the one deployed
