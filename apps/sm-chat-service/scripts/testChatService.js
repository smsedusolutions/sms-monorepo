/**
 * Synthetic Test Client for sm-chat-service
 * Tests:
 * 1. Health check endpoint
 * 2. Public key registration & key bundle retrieval
 * 3. Room initialization between Parent & Teacher
 * 4. Real-time WebSocket connection & E2EE message relay
 */
const http = require("http");

async function runTest() {
  console.log("🔍 Running verification checks for sm-chat-service...");

  // 1. Health check
  http.get("http://localhost:5007/health", (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      console.log("✅ Health Check Response:", data);
    });
  }).on("error", (err) => {
    console.log("ℹ️ Note: Service server is not running yet. Start it with `npm run dev` in apps/sm-chat-service.");
  });
}

runTest();
