import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";
import RegistrationComponent from "./registration";
import { api } from "~/trpc/server";
import { Suspense } from "react";

export default async function AuthShowcase() {
  const session = await getServerAuthSession();

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-center text-2xl text-white">
          {session && <span>Logged in as {session.user?.email}</span>}
        </p>
        <Link
          href={session ? "/api/auth/signout" : "/api/auth/signin"}
          className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
        >
          {session ? "Sign out" : "Sign in"}
        </Link>
        {session && (
          <Suspense fallback={<div className="text-white">Loading...</div>}>
            <PasskeyManagement />
          </Suspense>
        )}
      </div>
    </div>
  );
}

async function PasskeyManagement() {
  const registrationData = await api.webauthn.handlePreRegister.query();
  return <RegistrationComponent webauthnData={registrationData} />;
}
