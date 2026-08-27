import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fileName, contentType } = await req.json();

    if (!fileName) {
      return new Response(JSON.stringify({ error: "fileName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");

    // Fallback logic for local testing without secrets
    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
        console.warn("R2 credentials not set in Deno environment.");
    }

    const s3Client = new S3Client({
      region: "auto",
      endpoint: "https://9dd9f65f2b45d7d473f91154f22e0d8e.r2.cloudflarestorage.com",
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || "YOUR_R2_ACCESS_KEY",
        secretAccessKey: R2_SECRET_ACCESS_KEY || "YOUR_R2_SECRET_KEY",
      },
    });

    const command = new PutObjectCommand({
      Bucket: "sl-learn-bucket",
      Key: fileName,
      ContentType: contentType || "application/octet-stream",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return new Response(JSON.stringify({ signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
