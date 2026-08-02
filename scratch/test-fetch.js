const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const { GET } = require("../app/api/inbox/route.ts");
const { NextRequest } = require("next/server");
const { signAccessToken } = require("../lib/auth.ts");
const db = require("../lib/db.ts").default;

async function test() {
  try {
    const membership = await db.workspaceMember.findFirst({
      where: { userId: "fc528d74-b22c-41f9-bbe6-cde0cbf0721b" },
      include: { workspace: true }
    });

    if (!membership) {
      console.error("No workspace membership found for Saad");
      process.exit(1);
    }

    const payload = {
      userId: "fc528d74-b22c-41f9-bbe6-cde0cbf0721b",
      email: "saad2@gmail.com",
      name: "Saad",
      workspaceId: membership.workspaceId,
      role: "MEMBER"
    };

    const token = await signAccessToken(payload);

    const aoonUserId = "3ea31f71-2223-4974-b81d-05b3c92742ca";
    const requestUrl = `http://localhost:3000/api/inbox?dmUserId=${aoonUserId}`;
    
    const req = new NextRequest(requestUrl, {
      headers: {
        cookie: `accessToken=${token}`
      }
    });

    console.log("Sending mock GET to:", requestUrl);
    const res = await GET(req);
    const status = res.status;
    const body = await res.json();
    
    console.log("Response Status:", status);
    console.log("Response Body:", JSON.stringify(body, null, 2));

  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    process.exit(0);
  }
}

test();
