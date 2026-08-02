const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const { POST } = require("../app/api/ai/chat/route.ts");
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
    const requestUrl = `http://localhost:3000/api/ai/chat`;
    
    const req = new NextRequest(requestUrl, {
      method: "POST",
      headers: {
        cookie: `accessToken=${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: "What should I work on next?" })
    });

    console.log("Sending mock POST to:", requestUrl);
    const res = await POST(req);
    const status = res.status;
    
    console.log("Response Status:", status);
    
    if (res.headers.get("content-type")?.includes("application/json")) {
      const body = await res.json();
      console.log("JSON Response Body:", JSON.stringify(body, null, 2));
    } else {
      console.log("Response is stream. Reading stream chunks...");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        console.log("CHUNK:", decoder.decode(value));
      }
    }

  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    process.exit(0);
  }
}

test();
