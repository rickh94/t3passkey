import { getServerAuthSession } from "~/server/auth";
import SignInComponent from "./form";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const session = await getServerAuthSession();
  if (session?.user?.id) {
    return redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <SignInComponent />
      </div>
    </main>
  );
}
