const { Client } = require('pg');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

// Creates a new DB client per invocation — correct pattern for Lambda
// (Lambda is stateless; persistent connections can cause issues)
const createClient = () => new Client({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

const sqs = new SQSClient({});

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*"
};

const ok = (data) => ({ statusCode: 200, headers: HEADERS, body: JSON.stringify(data) });
const err500 = () => ({ statusCode: 500, headers: HEADERS, body: JSON.stringify({ message: "Internal server error" }) });
const err404 = (msg) => ({ statusCode: 404, headers: HEADERS, body: JSON.stringify({ message: msg }) });

// Sends a message to SQS with a delay
// type: "USER_CREATED" (5 min delay) or "USER_DELETED" (10 min delay)
const sendToQueue = (type, user, delaySeconds) =>
  sqs.send(new SendMessageCommand({
    QueueUrl: process.env.QUEUE_URL,
    MessageBody: JSON.stringify({ type, user }),
    DelaySeconds: delaySeconds
  }));

exports.getUsers = async (event) => {
  console.log("Incoming event:", event);
  const client = createClient();
  try {
    await client.connect();
    const result = await client.query('SELECT * FROM users ORDER BY id');
    return ok(result.rows);
  } catch (err) {
    console.error("Database error:", err);
    return err500();
  } finally {
    await client.end();
  }
};

exports.getUser = async (event) => {
  console.log("Incoming event:", event);
  const client = createClient();
  try {
    await client.connect();
    const result = await client.query('SELECT * FROM users WHERE id = $1', [event.pathParameters.id]);
    if (result.rows.length === 0) return err404(`User ${event.pathParameters.id} not found`);
    return ok(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    return err500();
  } finally {
    await client.end();
  }
};

exports.createUser = async (event) => {
  console.log("Incoming event:", event);
  const client = createClient();
  try {
    const { name, email } = JSON.parse(event.body);
    await client.connect();
    const result = await client.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    const user = result.rows[0];

    // Send welcome email event to SQS with 5 min delay
    await sendToQueue('USER_CREATED', user, 300);
    console.log(`SQS: queued USER_CREATED for ${email} (delay: 5 min)`);

    return { statusCode: 201, headers: HEADERS, body: JSON.stringify(user) };
  } catch (err) {
    console.error("Database error:", err);
    return err500();
  } finally {
    await client.end();
  }
};

exports.updateUser = async (event) => {
  console.log("Incoming event:", event);
  const client = createClient();
  try {
    const { name, email } = JSON.parse(event.body);
    await client.connect();
    const result = await client.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
      [name, email, event.pathParameters.id]
    );
    if (result.rows.length === 0) return err404(`User ${event.pathParameters.id} not found`);
    return ok(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    return err500();
  } finally {
    await client.end();
  }
};

exports.deleteUser = async (event) => {
  console.log("Incoming event:", event);
  const client = createClient();
  try {
    await client.connect();
    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING *', [event.pathParameters.id]);
    if (result.rows.length === 0) return err404(`User ${event.pathParameters.id} not found`);
    const user = result.rows[0];

    // Send goodbye email event to SQS with 10 min delay
    await sendToQueue('USER_DELETED', user, 600);
    console.log(`SQS: queued USER_DELETED for ${user.email} (delay: 10 min)`);

    return ok(user);
  } catch (err) {
    console.error("Database error:", err);
    return err500();
  } finally {
    await client.end();
  }
};

// Worker Lambda — triggered automatically by SQS
// Simulates sending emails based on message type
exports.worker = async (event) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    console.log("Processing message:", message);

    if (message.type === 'USER_CREATED') {
      console.log(`📧 Sending welcome email to ${message.user.email} — "Welcome, ${message.user.name}!"`);
    }

    if (message.type === 'USER_DELETED') {
      console.log(`📧 Sending goodbye email to ${message.user.email} — "Sorry to see you go, ${message.user.name}"`);
    }
  }
};


// replace working method with either one of these methods below to test errors
// exports.getUsers = async () => {
//   console.log("About to crash...");
//   throw new Error("Test error");
// };

// exports.getUsers = async () => {
//   console.log("Running OK");

//   return {
//     statusCode: 200,
//     body: "not json"
//   };
// };
