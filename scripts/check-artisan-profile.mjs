/**
 * Run with:  node scripts/check-artisan-bookings.mjs
 *
 * Logs in as a tasker, then hits GET /api/profile/artisan/me and prints
 * the raw JSON response so you can see the exact field names the backend returns.
 *
 * Fill in your tasker email + password below before running.
 */

const BASE_URL = "https://api.xn--kraftig-g1a.com";

// ── 1. Fill in a real tasker account ──────────────────────────────────────────
const EMAIL    = "legendola2020@gmail.com";
const PASSWORD = "Test@123";
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // Step 1: Login to get an access token
  console.log("🔐 Logging in as tasker...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  const loginData = await loginRes.json();

  if (!loginRes.ok) {
    console.error("❌ Login failed:", loginData);
    process.exit(1);
  }

  const accessToken = loginData.accessToken;
  console.log("✅ Logged in. Token received.\n");

  // Step 2: Fetch artisan bookings
  console.log("📦 Fetching GET /api/profile/artisan/me...\n");
  const bookingsRes = await fetch(`${BASE_URL}/api/profile/artisan/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const bookingsData = await bookingsRes.json();

  if (!bookingsRes.ok) {
    console.error("❌ Bookings fetch failed:", bookingsData);
    process.exit(1);
  }

  console.log("✅ Response status:", bookingsRes.status);
  console.log("📋 Full response:\n");
  console.log(JSON.stringify(bookingsData, null, 2));

  // If it's an array, show a summary of field names from first item
  if (Array.isArray(bookingsData) && bookingsData.length > 0) {
    console.log("\n🔑 Fields in first booking object:");
    console.log(Object.keys(bookingsData[0]));
  } else if (bookingsData?.data && Array.isArray(bookingsData.data) && bookingsData.data.length > 0) {
    // handle { data: [...] } wrapper
    console.log("\n🔑 Fields in first booking object (from data[]):");
    console.log(Object.keys(bookingsData.data[0]));
  } else {
    console.log("\nℹ️  Response is empty or not an array — check full output above.");
  }
}

main();
