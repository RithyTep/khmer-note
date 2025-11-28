import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HomeClient } from "@/components/HomeClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return <HomeClient user={session.user} initialProjectId={id} />;
}
