import { startRegistration } from "@simplewebauthn/browser";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { PageLayout } from "~/components/layout";

import { api } from "~/utils/api";

function RegistrationComponent() {
  const { data: webauthnData, isLoading: registrationOptionsLoading } =
    api.webauthn.handlePreRegister.useQuery();
  const {
    mutate,
    isLoading: registrationLoading,
    isSuccess: registrationSuccess,
    isError: registrationError,
  } = api.webauthn.handleRegister.useMutation();

  async function registerWebauthn() {
    if (!webauthnData) return;
    console.log(webauthnData);

    try {
      const registrationResponse = await startRegistration(webauthnData);
      mutate(registrationResponse);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={registerWebauthn}
          disabled={registrationOptionsLoading}
          className={`rounded-full px-10 py-3 font-semibold text-white no-underline transition ${
            registrationOptionsLoading
              ? "bg-slate-500/10"
              : "bg-white/10 shadow hover:bg-white/20"
          }`}
        >
          {registrationOptionsLoading || registrationLoading
            ? "Please Wait"
            : "Register a Passkey"}
        </button>
      </div>
      {registrationSuccess && (
        <p>
          Successfully registered a passkey. You can now log in using only this
          device!
        </p>
      )}
      {registrationError && (
        <p>Could not register your passkey, please try again.</p>
      )}
    </>
  );
}

export default function Home() {
  const { data: sessionData } = useSession();

  return (
    <>
      <PageLayout>
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
        </h1>
        <p className="text-4xl italic text-white">
          Now with Passkey Authentication
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
            href="https://create.t3.gg/en/usage/first-steps"
            target="_blank"
          >
            <h3 className="text-2xl font-bold">First Steps →</h3>
            <div className="text-lg">
              Just the basics - Everything you need to know to set up your
              database and authentication.
            </div>
          </Link>
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
            href="https://create.t3.gg/en/introduction"
            target="_blank"
          >
            <h3 className="text-2xl font-bold">Documentation →</h3>
            <div className="text-lg">
              Learn more about Create T3 App, the libraries it uses, and how to
              deploy it.
            </div>
          </Link>
        </div>
        <div className="flex flex-col items-center gap-2 text-lg text-white">
          <p>
            I've added Passkey/Fido2/WebAuthn biometric authentication to the t3
            stack!
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 text-white">
          <AuthShowcase />
          {sessionData && <RegistrationComponent />}
        </div>
      </PageLayout>
    </>
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        type="button"
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}
