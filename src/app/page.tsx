import Link from "next/link";

import { Suspense } from "react";
import AuthShowcase from "./_components/auth";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
        </h1>
        <p className="text-4xl italic text-white">
          Now with Passkey Authentication
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="https://github.com/rickh94/t3passkey"
            target="_blank"
          >
            <h3 className="text-2xl font-bold">View the Code →</h3>
            <div className="text-lg">
              Take a look at how this works on drizzle or prisma on different
              branches.
            </div>
          </Link>
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="https://webauthn.guide/"
            target="_blank"
          >
            <h3 className="text-2xl font-bold">Documentation →</h3>
            <div className="text-lg">
              Read more about WebAuthn passwordless authentication
            </div>
          </Link>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthShowcase />
        </Suspense>
      </div>
    </main>
  );
}
