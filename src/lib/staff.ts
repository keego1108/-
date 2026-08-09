import { getSupabaseClient } from "@/lib/supabase";

export interface StaffMember {
  membershipId: string;
  userId: string;
  email: string | null;
  role: string;
  createdAt: string;
}

export async function listStaffMembers(restaurantId: string): Promise<StaffMember[]> {
  const admin = getSupabaseClient();
  if (!admin) return [];

  const { data: memberships, error } = await admin
    .from("restaurant_members")
    .select("id, user_id, role, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at");
  if (error) throw error;
  if (!memberships || memberships.length === 0) return [];

  const members = await Promise.all(
    memberships.map(async (m) => {
      const { data } = await admin.auth.admin.getUserById(m.user_id);
      return {
        membershipId: m.id,
        userId: m.user_id,
        email: data.user?.email ?? null,
        role: m.role,
        createdAt: m.created_at,
      };
    })
  );

  return members;
}

// 既にアカウントがある場合は招待メールの代わりにその場でメンバー追加する。
export async function inviteStaffMember(
  restaurantId: string,
  email: string
): Promise<{ status: "invited" | "added_existing" }> {
  const admin = getSupabaseClient();
  if (!admin) throw new Error("Supabaseが未設定です");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${appUrl}/auth/callback` }
  );

  let userId: string;
  let status: "invited" | "added_existing" = "invited";

  if (inviteError) {
    // すでにアカウントが存在する場合はここに来る。メールアドレスから既存ユーザーを探す。
    const { data: list, error: listError } = await admin.auth.admin.listUsers();
    if (listError) throw listError;
    const existing = list.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (!existing) throw inviteError;
    userId = existing.id;
    status = "added_existing";
  } else {
    userId = invited.user.id;
  }

  const { error: memberError } = await admin.from("restaurant_members").insert({
    restaurant_id: restaurantId,
    user_id: userId,
    role: "staff",
  });
  // 既にこの店舗のメンバーだった場合はunique制約違反になるので、分かりやすいメッセージにする。
  if (memberError) {
    if (memberError.code === "23505") {
      throw new Error("このメールアドレスはすでにこの店舗のメンバーです");
    }
    throw memberError;
  }

  return { status };
}

export async function removeStaffMember(
  restaurantId: string,
  membershipId: string
): Promise<void> {
  const admin = getSupabaseClient();
  if (!admin) throw new Error("Supabaseが未設定です");

  // オーナーは削除できないようにする（誤操作でオーナー不在にならないため）。
  const { data: membership, error: fetchError } = await admin
    .from("restaurant_members")
    .select("role")
    .eq("id", membershipId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!membership) return;
  if (membership.role === "owner") {
    throw new Error("オーナーは削除できません");
  }

  const { error } = await admin
    .from("restaurant_members")
    .delete()
    .eq("id", membershipId)
    .eq("restaurant_id", restaurantId);
  if (error) throw error;
}
