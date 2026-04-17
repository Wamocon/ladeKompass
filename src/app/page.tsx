import { redirect } from "next/navigation";

// Root path – redirect to default locale
export default function RootPage() {
  redirect("/de");
}

