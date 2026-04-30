# Debug Exercise — error5

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
3. Check the response in the Network tab

## Debugging Guidance
- Check CloudWatch logs for the getUsers Lambda
- Look for database error messages in the logs
- Connect to the RDS database using pgAdmin and inspect the schema
- Verify the table names match what the code is querying
