const { Client } = require('pg');

// Creates a new DB client per invocation — correct pattern for Lambda
// (Lambda is stateless; persistent connections can cause issues)
const createClient = () => new Client({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*"
};

const ok = (data) => ({ statusCode: 200, headers: HEADERS, body: JSON.stringify(data) });
const err500 = () => ({ statusCode: 500, headers: HEADERS, body: JSON.stringify({ message: "Internal server error" }) });
const err404 = (msg) => ({ statusCode: 404, headers: HEADERS, body: JSON.stringify({ message: msg }) });

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
    return { statusCode: 201, headers: HEADERS, body: JSON.stringify(result.rows[0]) };
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
    return ok(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    return err500();
  } finally {
    await client.end();
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
