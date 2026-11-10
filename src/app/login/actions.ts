"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function read(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(read(formData));
  if (error) redirect("/login?fel=inloggning");
  redirect("/app");
}

export async function signup(formData: FormData) {
  const { email, password } = read(formData);
  if (password.length < 8) redirect("/login?mode=signup&fel=losenord");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) redirect("/login?mode=signup&fel=registrering");
  if (!data.session) redirect("/login?info=bekrafta");
  redirect("/app");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
