import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };
const allowedOrigins = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") || "https://scaleuptech.org")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

function cors(origin: string | null) {
  const allowed = origin && allowedOrigins.has(origin) ? origin : "";
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
    "vary": "Origin",
  };
}

function response(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...jsonHeaders, ...cors(origin) },
  });
}

function clean(value: unknown, max = 160) {
  return String(value ?? "")
    .trim()
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .slice(0, max);
}

function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function source(value: unknown) {
  return clean(value, 80).replace(/[^a-zA-Z0-9_.\- ]/g, "");
}

async function networkHash(req: Request) {
  const secret = Deno.env.get("IP_HASH_SECRET");
  const address = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!secret || !address) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(address),
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (origin && !allowedOrigins.has(origin)) {
    return response({ error: "origin_not_allowed" }, 403, origin);
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (req.method !== "POST") {
    return response({ error: "method_not_allowed" }, 405, origin);
  }

  const length = Number(req.headers.get("content-length") || "0");
  if (length > 12_000) {
    return response({ error: "payload_too_large" }, 413, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return response({ error: "invalid_json" }, 400, origin);
  }

  // Honeypot: acknowledge bots without storing their payload.
  if (clean(body.website, 200)) {
    return response({ accepted: true }, 202, origin);
  }

  const name = clean(body.name, 100);
  const email = clean(body.email, 254).toLowerCase();
  const company = clean(body.company, 120);
  const teamSize = clean(body.teamSize, 40);
  const locale = body.locale === "ar" ? "ar" : "en";
  const consent = body.consent === true;

  if (name.length < 2 || !validEmail(email) || !consent) {
    return response({ error: "invalid_submission" }, 400, origin);
  }

  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url = Deno.env.get("SUPABASE_URL");

  if (!url || !secretKey) {
    return response({ error: "service_unavailable" }, 503, origin);
  }

  const admin = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const hash = await networkHash(req);
  if (hash) {
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count, error: countError } = await admin
      .from("early_access")
      .select("id", { count: "exact", head: true })
      .eq("network_hash", hash)
      .gte("created_at", since);
    if (countError) {
      console.error("rate_limit_check_failed", countError.code);
      return response({ error: "service_unavailable" }, 503, origin);
    }
    if ((count || 0) >= 5) {
      return response({ error: "rate_limited" }, 429, origin);
    }
  }

  const record = {
    name,
    email,
    company: company || null,
    team_size: teamSize || null,
    locale,
    consent: true,
    consented_at: new Date().toISOString(),
    source: source(body.source) || null,
    medium: source(body.medium) || null,
    campaign: source(body.campaign) || null,
    network_hash: hash,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from("early_access")
    .upsert(record, { onConflict: "email" });

  if (error) {
    console.error("early_access_upsert_failed", error.code);
    return response({ error: "storage_failed" }, 500, origin);
  }

  return response({ accepted: true }, 201, origin);
});
