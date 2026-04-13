import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleEntryPage({ params }: PageProps) {
  const { locale } = await params;

  // Try to determine if user is authenticated
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(`/${locale}/dashboard`);
    }
  } catch {
    // Supabase not yet configured – fall through to guest redirect
  }

  // Guest: redirect to the dashboard
  redirect(`/${locale}/dashboard`);
}
