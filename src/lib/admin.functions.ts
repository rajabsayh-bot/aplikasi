import { createServerFn } from "@tanstack/react-start";

const ADMIN_EMAIL = "admin@komunitaskita.app";
const ADMIN_PASSWORD = "Akun77@@";

/**
 * Idempotently ensure the admin account exists and has admin role.
 * Returns the admin email so the client can sign in with it.
 */
export const ensureAdminUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Try to find existing user
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) throw new Error(listErr.message);

  let user = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);

  if (!user) {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Admin", username: "admin" },
    });
    if (createErr) throw new Error(createErr.message);
    user = created.user!;
  } else {
    // Ensure password is set to the known one (idempotent)
    await supabaseAdmin.auth.admin.updateUserById(user.id, { password: ADMIN_PASSWORD });
  }

  // Ensure profile row exists
  await supabaseAdmin.from("profiles").upsert(
    { id: user.id, username: "admin", full_name: "Admin Komunitas" },
    { onConflict: "id" },
  );

  // Ensure admin role
  await supabaseAdmin.from("user_roles").upsert(
    { user_id: user.id, role: "admin" },
    { onConflict: "user_id,role" },
  );

  return { email: ADMIN_EMAIL };
});
