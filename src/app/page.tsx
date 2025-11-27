import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HomeClient } from "@/components/HomeClient";

export default async function Home() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  return <HomeClient user={session.user} />;
}
