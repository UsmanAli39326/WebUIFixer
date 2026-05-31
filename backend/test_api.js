const http = require("http");

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log("--- Starting API Tests ---\n");

  // 1. Register Admin
  console.log("1. Registering Admin...");
  const adminReg = await request("POST", "/api/auth/register", {
    name: "Admin User",
    email: "admin@test.com",
    password: "123",
    role: "admin",
  });
  console.log("Admin Register:", adminReg.status, adminReg.data);

  // 2. Register Normal User
  console.log("\n2. Registering Normal User...");
  const userReg = await request("POST", "/api/auth/register", {
    name: "Regular User",
    email: "user@test.com",
    password: "123",
  });
  console.log("User Register:", userReg.status, userReg.data);

  // 3. Login Admin
  console.log("\n3. Logging in Admin...");
  const adminLogin = await request("POST", "/api/auth/login", {
    email: "admin@test.com",
    password: "123",
  });
  const adminToken = adminLogin.data.token;
  console.log("Admin Token Received:", !!adminToken);

  // 4. Admin fetch users
  console.log("\n4. Admin fetching all users...");
  const usersList = await request("GET", "/api/user/admin/users", null, adminToken);
  console.log("Users List:", usersList.status, usersList.data);

  // 5. Login Normal User
  console.log("\n5. Logging in User...");
  const userLogin = await request("POST", "/api/auth/login", {
    email: "user@test.com",
    password: "123",
  });
  const userToken = userLogin.data.token;

  // 6. User update profile
  console.log("\n6. User updating profile...");
  const profileUpdate = await request("PUT", "/api/user/profile", {
    bio: "I build amazing web templates!",
    website: "https://mytemplates.com"
  }, userToken);
  console.log("Profile Update:", profileUpdate.status, profileUpdate.data);

  // 7. Marketplace Upload (This triggers AI Analysis!)
  console.log("\n7. Uploading Template to Marketplace (Running AI Analysis on example.com)...");
  const uploadRes = await request("POST", "/api/marketplace/upload", {
    title: "Awesome UI Kit",
    url: "https://example.com",
    price: 49.99
  }, userToken);
  console.log("Upload Status:", uploadRes.status);
  console.log("Upload Message:", uploadRes.data.message);
  console.log("Template Score:", uploadRes.data.template?.score);

  // 8. Fetch Marketplace templates
  console.log("\n8. Fetching Marketplace templates...");
  const templatesRes = await request("GET", "/api/marketplace/templates");
  console.log("Templates List:", templatesRes.status, templatesRes.data);

  console.log("\n--- Tests Complete ---");
}

// Give the servers a few seconds to fully spin up before running tests
setTimeout(runTests, 2000);
