import { supabase } from "./utils/supabaseClient.js";

console.log("🔍 Testing Supabase connection...");

try {
  const { data, error } = await supabase.from("projects").select("*").limit(1);

  if (error) {
    console.error("❌ Supabase returned error:", error.message);
  } else {
    console.log("✅ Supabase connected successfully. Rows:", data);
  }
} catch (err) {
  console.error("💥 Supabase crashed:", err.message);
}
