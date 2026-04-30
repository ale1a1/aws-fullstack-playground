const { Client } = require('pg');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

// Creates a new DB client per invocation — correct pattern for Lambda
// (Lambda is stateless; persistent connections can cause issues)
const createClient = () => new Client({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

const sqs = new SQSClient({});
const ses = new SESClient({ region: 'eu-west-2' });

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*"
};

const ok = (data) => ({ statusCode: 200, headers: HEADERS, body: JSON.stringify(data) });
const err500 = () => ({ statusCode: 500, headers: HEADERS, body: JSON.stringify({ message: "Internal server error" }) });
const err404 = (msg) => ({ statusCode: 404, headers: HEADERS, body: JSON.stringify({ message: msg }) });

// Sends a message to SQS with a delay
const sendToQueue = (type, payload, delaySeconds) =>
  sqs.send(new SendMessageCommand({
    QueueUrl: process.env.QUEUE_URL,
    MessageBody: JSON.stringify({ type, ...payload }),
    DelaySeconds: delaySeconds
  }));

// Sends a real email via SES
const sendEmail = (to, subject, body) =>
  ses.send(new SendEmailCommand({
    Source: process.env.SENDER_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Text: { Data: body } }
    }
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

    // Queue welcome email — 1 minute delay
    await sendToQueue('USER_CREATED', { user }, 60);
    console.log(`SQS: queued USER_CREATED for ${email} (delay: 1 min)`);

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

    // Fetch old user before updating so we have the old email
    await client.connect();
    const oldResult = await client.query('SELECT * FROM users WHERE id = $1', [event.pathParameters.id]);
    if (oldResult.rows.length === 0) return err404(`User ${event.pathParameters.id} not found`);
    const oldUser = oldResult.rows[0];

    const result = await client.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
      [name, email, event.pathParameters.id]
    );
    const updatedUser = result.rows[0];

    const emailChanged = oldUser.email !== email;

    // Queue update notification — 1 minute delay
    await sendToQueue('USER_UPDATED', { oldUser, updatedUser, emailChanged }, 60);
    console.log(`SQS: queued USER_UPDATED for ${email} (delay: 1 min)`);

    return ok(updatedUser);
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

    // Queue goodbye email — 3 minute delay
    await sendToQueue('USER_DELETED', { user }, 180);
    console.log(`SQS: queued USER_DELETED for ${user.email} (delay: 3 min)`);

    return ok(user);
  } catch (err) {
    console.error("Database error:", err);
    return err500();
  } finally {
    await client.end();
  }
};

// Worker Lambda — triggered automatically by SQS
// Sends real emails via SES based on message type
exports.worker = async (event) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    console.log("Processing message:", message);

    if (message.type === 'USER_CREATED') {
      const { user } = message;
      await sendEmail(
        user.email,
        'Welcome to the Register Users App!',
        `Hi ${user.name},\n\nWelcome to the Register Users App!\n\nWe're glad to have you on board.\n\nSee you soon!`
      );
      console.log(`📧 Welcome email sent to ${user.email}`);
    }

    if (message.type === 'USER_DELETED') {
      const { user } = message;
      await sendEmail(
        user.email,
        'You have been removed from the Register Users App',
        `Hi ${user.name},\n\nYou have been removed from the Register Users App.\n\nWe are sorry to see you go!\n\nHope to see you again.`
      );
      console.log(`📧 Goodbye email sent to ${user.email}`);
    }

    if (message.type === 'USER_UPDATED') {
      const { oldUser, updatedUser, emailChanged } = message;

      if (emailChanged) {
        // Notify old email that a new email was linked
        await sendEmail(
          oldUser.email,
          'Your account email has been changed',
          `Hi ${updatedUser.name},\n\nThis is a notification that your account is now linked to a new email address: ${updatedUser.email}.\n\nIf you did not request this change, please contact support.`
        );
        console.log(`📧 Email change notification sent to old email: ${oldUser.email}`);

        // Notify new email that it is now linked to the account
        await sendEmail(
          updatedUser.email,
          'Your email has been linked to an account',
          `Hi ${updatedUser.name},\n\nThis email address (${updatedUser.email}) is now linked to your account in the Register Users App.\n\nIf you did not request this, please contact support.`
        );
        console.log(`📧 Email change confirmation sent to new email: ${updatedUser.email}`);
      } else {
        // Name or other fields changed — notify on current email
        await sendEmail(
          updatedUser.email,
          'Your account has been updated',
          `Hi ${updatedUser.name},\n\nYour account details have been updated:\n\n- Name: ${updatedUser.name}\n- Email: ${updatedUser.email}\n\nIf you did not make these changes, please contact support.`
        );
        console.log(`📧 Update notification sent to ${updatedUser.email}`);
      }
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
