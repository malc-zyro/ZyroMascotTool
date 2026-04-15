import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: expiredImages, error: fetchError } = await supabase
      .from("generated_images")
      .select("id, storage_path, generation_id")
      .eq("starred", false)
      .lt("created_at", cutoff);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!expiredImages || expiredImages.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired images to clean up", deleted: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const storagePaths = expiredImages
      .map((img) => img.storage_path)
      .filter((p) => p && p.length > 0);

    if (storagePaths.length > 0) {
      await supabase.storage.from("generated-images").remove(storagePaths);
    }

    const imageIds = expiredImages.map((img) => img.id);
    const { error: deleteError } = await supabase
      .from("generated_images")
      .delete()
      .in("id", imageIds);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const affectedGenerationIds = [
      ...new Set(expiredImages.map((img) => img.generation_id)),
    ];

    let orphanedDeleted = 0;
    for (const genId of affectedGenerationIds) {
      const { count } = await supabase
        .from("generated_images")
        .select("id", { count: "exact", head: true })
        .eq("generation_id", genId);

      if (count === 0) {
        await supabase.from("generations").delete().eq("id", genId);
        orphanedDeleted++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Cleanup complete",
        images_deleted: imageIds.length,
        storage_files_removed: storagePaths.length,
        orphaned_generations_deleted: orphanedDeleted,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
