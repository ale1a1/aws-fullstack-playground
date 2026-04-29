exports.getUsers = async (event) => {
  console.log("Incoming event:", event);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify([
      { id: 1, name: "Alice Johnson", email: "alice@example.com" },
      { id: 2, name: "Bob Smith", email: "bob@example.com" },
      { id: 3, name: "Carol White", email: "carol@example.com" },
      { id: 4, name: "David Brown", email: "david@example.com" },
      { id: 5, name: "Eva Martinez", email: "eva@example.com" },
      { id: 6, name: "Frank Lee", email: "frank@example.com" },
      { id: 7, name: "Grace Kim", email: "grace@example.com" }
    ])
  };
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
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      message: `User ${userId} deleted`
    })
  };
};
