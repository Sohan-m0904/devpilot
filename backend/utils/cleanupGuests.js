import fs from "fs";
import path from "path";
import { supabase } from "../supabaseClient.js";

const UPLOADS_DIR = path.resolve("uploads");

/**
 * Deletes guest projects (user_id = null) older than X hours.
 */
export async function cleanupGuestProjects(maxAgeHours = 6) {
  try {
    console.log(`🧹 Running guest cleanup... (older than ${maxAgeHours}h)`);

    // 1️⃣ Find old guest projects
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

    const { data: oldGuests, error } = await supabase
      .from("projects")
      .select("id, extract_path, name, created_at")
      .is("user_id", null)
      .lt("created_at", cutoff);

    if (error) throw error;
    if (!oldGuests || oldGuests.length === 0) {
      console.log("✅ No old guest projects to clean up.");
      return;
    }

    console.log(`🧾 Found ${oldGuests.length} guest projects to delete:`);

    // 2️⃣ Delete each guest folder from local disk and DB
    for (const proj of oldGuests) {
      try {
        if (proj.extract_path && fs.existsSync(proj.extract_path)) {
          fs.rmSync(proj.extract_path, { recursive: true, force: true });
          console.log(`🗑️ Deleted folder: ${proj.extract_path}`);
        }

        const { error: delError } = await supabase
          .from("projects")
          .delete()
          .eq("id", proj.id);

        if (delError) console.error(`❌ DB delete failed for ${proj.id}:`, delError.message);
        else console.log(`✅ Removed project '${proj.name}' (${proj.id}) from DB`);
      } catch (innerErr) {
        console.error(`⚠️ Failed to delete guest project ${proj.id}:`, innerErr.message);
      }
    }

    console.log("✅ Guest cleanup complete.");
  } catch (err) {
    console.error("❌ Guest cleanup failed:", err.message);
  }
}
