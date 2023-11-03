"use client";

import { type PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/typescript-types";
import { api } from "~/trpc/react";
import { startRegistration } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function RegistrationComponent({
  webauthnData,
}: {
  webauthnData: PublicKeyCredentialCreationOptionsJSON;
}) {
  const [hasRegistered, setHasRegistered] = useState(false);
  const { mutate, isLoading: registrationLoading } =
    api.webauthn.handleRegister.useMutation();

  const router = useRouter();

  async function registerWebauthn() {
    if (!webauthnData) return;

    try {
      const registrationResponse = await startRegistration(webauthnData);
      mutate(registrationResponse, {
        onSuccess: () => {
          toast.success("Passkey Registered!");
          router.refresh();
          setHasRegistered(true);
        },
        onError: () => {
          toast.error("Could not register passkey");
        },
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <p className="text-center text-base text-white">
        Now that you’re signed in, you can save a passkey to sign in faster in
        the future
      </p>
      <button
        type="button"
        onClick={registerWebauthn}
        disabled={registrationLoading}
        className="rounded-full bg-white/10 px-8 py-4 font-semibold text-white transition duration-200 hover:bg-white/20"
      >
        {registrationLoading ? "Registering..." : "Register a Passkey"}
      </button>
      {hasRegistered && (
        <p className="text-center text-base text-white">
          Now sign out to try signing in with your new passkey.{" "}
        </p>
      )}
    </>
  );
}
