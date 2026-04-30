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

exports.getUsers = async (event) => {
  console.log("Incoming event:", event);

  const client = createClient();

  try {
    await client.connect();
    const result = await client.query('SELECT * FROM users');

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify(result.rows)
    };
  } catch (err) {
    console.error("Database error:", err);

    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ message: "Internal server error" })
    };
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

exports.deleteUser = async (event) => {
  console.log("DELETE event:", event);

  const userId = event.pathParameters?.id;

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ message: `User ${userId} deleted` })
  };
};
