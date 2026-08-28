import { importPKCS8, SignJWT } from "jose";

export interface Env {
  GDRIVE_SERVICE_ACCOUNT_JSON: string; // The full JSON string provided by Google
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Helper to get Google OAuth token using jose
async function getGoogleToken(env: Env): Promise<string> {
  const credentials = JSON.parse(env.GDRIVE_SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);

  const privateKey = await importPKCS8(credentials.private_key, "RS256");

  const jwt = await new SignJWT({
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/drive",
    aud: credentials.token_uri,
    exp: now + 3600,
    iat: now,
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .sign(privateKey);

  const response = await fetch(credentials.token_uri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data: any = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get Google token: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      // Endpoint 1: Generate an upload URL for the frontend
      if (url.pathname === "/get-upload-url" && request.method === "POST") {
        const { fileName, contentType } = (await request.json()) as {
          fileName?: string;
          contentType?: string;
        };

        if (!fileName) {
          return new Response(JSON.stringify({ error: "fileName is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const token = await getGoogleToken(env);

        // Start a resumable upload session
        const driveResponse = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Upload-Content-Type": contentType || "application/octet-stream",
          },
          body: JSON.stringify({
            name: fileName,
          }),
        });

        if (!driveResponse.ok) {
            const errorText = await driveResponse.text();
            throw new Error(`Drive API Error during init: ${errorText}`);
        }

        // The session URI is returned in the 'Location' header
        const uploadUrl = driveResponse.headers.get("Location");

        if (!uploadUrl) {
            throw new Error("Failed to retrieve upload URL from Google Drive.");
        }

        return new Response(JSON.stringify({ signedUrl: uploadUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Endpoint 2: Make the uploaded file publicly readable
      if (url.pathname === "/make-public" && request.method === "POST") {
          const { fileId } = (await request.json()) as { fileId?: string };

          if (!fileId) {
            return new Response(JSON.stringify({ error: "fileId is required" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const token = await getGoogleToken(env);

          const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
              method: "POST",
              headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  role: "reader",
                  type: "anyone"
              })
          });

          if (!driveResponse.ok) {
              const errorText = await driveResponse.text();
              throw new Error(`Drive API Error setting permissions: ${errorText}`);
          }

          return new Response(JSON.stringify({ success: true }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
          });
      }

      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error: any) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  },
};
