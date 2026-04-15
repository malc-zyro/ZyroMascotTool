import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

const DIRECTOR_SYSTEM_PROMPT = `You are "The Director" — a cinematic prompt engineer for an AI image generation system.
Your job is to take a simple user prompt and rewrite it into a rich, descriptive prompt for generating images of a character called "Tanuki" (a raccoon-dog mascot).

RULES:
- Keep the core intent of the original prompt.
- The expressiveness level (1-3) determines how much you enhance the prompt:

  Level 1 — LITERAL: Return the prompt almost unchanged. Only clarify ambiguity if needed. Use the default expression unless one is explicitly stated. No embellishment.

  Level 2 — ENHANCED (default): Use the character's physical features — ears, eyelids, antennae, tail, cheeks, posture — to actively reinforce the emotion. Lean into dynamic poses: allow twisting, weight shifts, torquing, and mild squash and stretch. The character should feel alive and expressive but grounded.

  Level 3 — DYNAMIC: Push expressiveness to the character design's limits without breaking the rig. Exaggerate poses dramatically — big squash and stretch, extreme angles, motion blur energy lines. Add small detail accents that sell the emotion: flushed cheeks or blushing, floating hearts or stars, pulsing veins for anger, sweat drops, sparkles. The result should feel like a keyframe from an animated feature's most expressive moment.

- Always maintain that this is the Tanuki character.
- Output ONLY the enhanced prompt text. No explanations, no preamble.`;

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function successResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>
): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .gte("created_at", windowStart);

  if (error) return false;
  return (count ?? 0) < RATE_LIMIT_MAX;
}

async function enhancePrompt(
  apiKey: string,
  rawPrompt: string,
  sliderLevel: number
): Promise<string> {
  const url = `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: DIRECTOR_SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts: [
            {
              text: `Expressiveness Level: ${sliderLevel}/3\n\nOriginal Prompt: ${rawPrompt}\n\nRewrite this prompt:`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3 + sliderLevel * 0.2,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Director API failed: ${resp.status} - ${errText}`);
  }

  const data = await resp.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? rawPrompt;
  return text.trim();
}

async function fetchReferenceImages(
  supabase: ReturnType<typeof createClient>
): Promise<Array<{ base64: string; mimeType: string; label: string }>> {
  const images: Array<{ base64: string; mimeType: string; label: string }> = [];

  for (let i = 1; i <= 3; i++) {
    const { data } = await supabase.storage
      .from("reference-images")
      .download(`core-${i}.png`);

    if (data) {
      const buffer = await data.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce(
          (acc, byte) => acc + String.fromCharCode(byte),
          ""
        )
      );
      images.push({
        base64,
        mimeType: "image/png",
        label: `CORE IDENTITY IMAGE ${i}`,
      });
    }
  }

  return images;
}

function buildGenerateContentParts(
  enhancedPrompt: string,
  referenceImages: Array<{ base64: string; mimeType: string; label: string }>,
  expression: string | null,
  poseImageBase64: string | null,
  outfitImageBase64: string | null,
  expressionImageBase64: string | null
): Array<Record<string, unknown>> {
  const parts: Array<Record<string, unknown>> = [];

  for (const img of referenceImages) {
    parts.push({ text: img.label });
    parts.push({
      inlineData: { mimeType: img.mimeType, data: img.base64 },
    });
  }

  if (expression) {
    parts.push({
      text: `EXPRESSION REFERENCE: The character should display a "${expression}" expression.`,
    });
  }

  if (poseImageBase64) {
    parts.push({
      text: `POSE GUIDANCE — Use the following image ONLY as a reference for body pose, posture, and limb positioning. DO NOT copy the character's physical appearance, body proportions, clothing, gender traits, or any anatomical features from this pose reference. The Tanuki character must keep his own body shape, design, and identity while adopting a similar stance and gesture.`,
    });
    parts.push({
      inlineData: { mimeType: "image/png", data: poseImageBase64 },
    });
  }

  if (outfitImageBase64) {
    parts.push({
      text: `OUTFIT GUIDANCE — Use the following image ONLY as a reference for clothing, costume, and accessories. Copy the outfit style, colors, fabric patterns, and clothing details from this image and dress the Tanuki character in a similar outfit adapted to his body. DO NOT copy the pose, body shape, facial features, or any physical attributes from this outfit reference. Only use it for what the character is wearing.`,
    });
    parts.push({
      inlineData: { mimeType: "image/png", data: outfitImageBase64 },
    });
  }

  if (expressionImageBase64) {
    parts.push({
      text: `EXPRESSION GUIDANCE — Use the following image ONLY as a reference for facial expression, emotion, and mood. Mimic the expression shown in this image — the eyes, mouth, eyebrows, and overall emotional feel — and apply it to the Tanuki character's face. DO NOT copy the character's physical appearance, body shape, clothing, pose, or any other attributes from this expression reference. Only use it for the facial expression.`,
    });
    parts.push({
      inlineData: { mimeType: "image/png", data: expressionImageBase64 },
    });
  }

  parts.push({ text: enhancedPrompt });

  return parts;
}

async function generateSingleImage(
  apiKey: string,
  model: string,
  parts: Array<Record<string, unknown>>
): Promise<{ base64: string; mimeType: string }> {
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    let detail = errBody;
    try {
      const parsed = JSON.parse(errBody);
      detail = parsed?.error?.message || errBody;
    } catch {
      // use raw text
    }
    throw new Error(`Gemini API (${model}): ${resp.status} - ${detail}`);
  }

  const data = await resp.json();

  if (data?.candidates?.[0]?.finishReason === "SAFETY") {
    throw new Error("Generation blocked by safety filters. Try a different prompt.");
  }

  const candidateParts = data?.candidates?.[0]?.content?.parts;
  if (!candidateParts || candidateParts.length === 0) {
    const blockReason = data?.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`Prompt blocked: ${blockReason}. Try rephrasing.`);
    }
    throw new Error(
      `Model "${model}" returned no content. It may not support image generation. Try "gemini-2.5-flash" for stability.`
    );
  }

  for (const part of candidateParts) {
    if (part.inlineData) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || "image/png",
      };
    }
  }

  throw new Error(
    `Model "${model}" returned text instead of an image. Try a different model or prompt.`
  );
}

function injectExifMetadata(
  base64Image: string,
  enhancedPrompt: string,
  sliderLevel: number
): string {
  try {
    const marker = "FFD8FF";
    if (!base64Image.startsWith("/9j/") && !base64Image.includes(marker)) {
      return base64Image;
    }

    const comment = JSON.stringify({
      enhanced_prompt: enhancedPrompt,
      slider_level: sliderLevel,
      generator: "Tanuki Master Rig",
      timestamp: new Date().toISOString(),
    });

    const commentBytes = new TextEncoder().encode(comment);
    const raw = Uint8Array.from(atob(base64Image), (c) => c.charCodeAt(0));

    if (raw[0] !== 0xff || raw[1] !== 0xd8) {
      return base64Image;
    }

    const comMarker = new Uint8Array([0xff, 0xfe]);
    const length = commentBytes.length + 2;
    const lengthBytes = new Uint8Array([
      (length >> 8) & 0xff,
      length & 0xff,
    ]);

    const result = new Uint8Array(
      2 + 2 + 2 + commentBytes.length + (raw.length - 2)
    );
    result.set(raw.subarray(0, 2), 0);
    result.set(comMarker, 2);
    result.set(lengthBytes, 4);
    result.set(commentBytes, 6);
    result.set(raw.subarray(2), 6 + commentBytes.length);

    return btoa(
      result.reduce((acc, byte) => acc + String.fromCharCode(byte), "")
    );
  } catch {
    return base64Image;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return errorResponse(
        "GEMINI_API_KEY is not configured. Please add it to your Edge Function secrets.",
        500
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Missing or invalid Authorization header", 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authUser) {
      return errorResponse("Invalid or expired token", 401);
    }
    const userId = authUser.id;
    console.log("Extracted userId:", userId);

    const withinLimit = await checkRateLimit(supabase);
    if (!withinLimit) {
      return errorResponse(
        "Rate limit exceeded. Maximum 10 generations per minute. Please wait and try again.",
        429
      );
    }

    const body = await req.json();
    const {
      prompt,
      model,
      expression,
      pose_image_base64,
      outfit_image_base64,
      expression_image_base64,
      slider_level,
      quantity,
      no_background,
    } = body as {
      prompt: string;
      model: string;
      expression: string | null;
      pose_image_base64: string | null;
      outfit_image_base64: string | null;
      expression_image_base64: string | null;
      slider_level: number;
      quantity: number;
      no_background: boolean;
    };

    if (!prompt || !model) {
      return errorResponse("Missing required fields: prompt and model", 400);
    }

    const clampedSlider = Math.max(1, Math.min(3, slider_level ?? 2));
    const clampedQuantity = Math.max(1, Math.min(4, quantity ?? 1));

    let enhancedPrompt: string | null = null;
    let finalPrompt = prompt;

    if (clampedSlider > 1) {
      enhancedPrompt = await enhancePrompt(geminiKey, prompt, clampedSlider);
      finalPrompt = enhancedPrompt;
    }

    if (no_background) {
      finalPrompt += " The character is on a plain solid white background with no environmental elements, no scenery, no shadows, no gradients, and no decorative details. White background only.";
    }

    const referenceImages = await fetchReferenceImages(supabase);

    const parts = buildGenerateContentParts(
      finalPrompt,
      referenceImages,
      expression ?? null,
      pose_image_base64 ?? null,
      outfit_image_base64 ?? null,
      expression_image_base64 ?? null
    );

    const { data: genRecord, error: genError } = await supabase
      .from("generations")
      .insert({
        original_prompt: prompt,
        enhanced_prompt: enhancedPrompt,
        model,
        expression: expression ?? null,
        slider_level: clampedSlider,
        quantity: clampedQuantity,
        user_id: userId,
      })
      .select("id")
      .single();

    if (genError || !genRecord) {
      console.error("Generation insert error:", JSON.stringify(genError));
      console.error("userId was:", userId);
      return errorResponse(`Failed to create generation record: ${genError?.message || "unknown"}`, 500);
    }

    const generationId = genRecord.id;

    const imagePromises = Array.from({ length: clampedQuantity }, () =>
      generateSingleImage(geminiKey, model, parts)
    );

    const imageResults = await Promise.allSettled(imagePromises);

    const savedImages: Array<{ id: string; url: string }> = [];
    const errors: string[] = [];

    for (let i = 0; i < imageResults.length; i++) {
      const result = imageResults[i];
      if (result.status === "rejected") {
        errors.push(result.reason?.message || String(result.reason));
        continue;
      }

      const { base64, mimeType } = result.value;

      const processedBase64 = injectExifMetadata(
        base64,
        finalPrompt,
        clampedSlider
      );

      const ext = mimeType.includes("png") ? "png" : "jpg";
      const fileName = `${generationId}/${crypto.randomUUID()}.${ext}`;

      const imageBuffer = Uint8Array.from(atob(processedBase64), (c) =>
        c.charCodeAt(0)
      );

      const { error: uploadError } = await supabase.storage
        .from("generated-images")
        .upload(fileName, imageBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) continue;

      const {
        data: { publicUrl },
      } = supabase.storage.from("generated-images").getPublicUrl(fileName);

      const { data: imgRecord, error: imgError } = await supabase
        .from("generated_images")
        .insert({
          generation_id: generationId,
          storage_path: fileName,
          image_url: publicUrl,
        })
        .select("id")
        .single();

      if (!imgError && imgRecord) {
        savedImages.push({ id: imgRecord.id, url: publicUrl });
      }
    }

    if (savedImages.length === 0) {
      const firstError = errors[0] || "Unknown error";
      return errorResponse(firstError, 502);
    }

    return successResponse({
      generation_id: generationId,
      images: savedImages,
      original_prompt: prompt,
      enhanced_prompt: enhancedPrompt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
});
