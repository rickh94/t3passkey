"use client";
import { signIn } from "next-auth/react";
import { type ChangeEvent, type KeyboardEventHandler, useState } from "react";
import directApi from "~/trpc/direct";
import { startAuthentication } from "@simplewebauthn/browser";

export default function SignInComponent() {
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState(false);

  // sign in with email
  async function signInWithEmail() {
    await signIn("email", { email });
  }

  async function handleSignIn() {
    try {
      await signInWithWebauthn();
      console.log("signin complete");
    } catch (error) {
      console.log(error);
      await signInWithEmail();
    }
  }

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter") {
      void handleSignIn();
    }
  };

  function updateEmail(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    setIsValid(event.target.value.includes("@"));
  }

  async function signInWithWebauthn() {
    const options = await directApi.webauthn.startAuthentication.query(email);
    if (!options) {
      alert("error getting options");
    }
    const credential = await startAuthentication(options);

    await signIn("webauthn", {
      id: credential.id,
      rawId: credential.rawId,
      type: credential.type,
      clientDataJSON: credential.response.clientDataJSON,
      authenticatorData: credential.response.authenticatorData,
      userHandle: credential.response.userHandle,
      clientExtensionResults: credential.clientExtensionResults,
      signature: credential.response.signature,
    });
  }

  return (
    <>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex w-full flex-col gap-4 sm:w-72"
      >
        <div>
          <h1 className="text-4xl font-bold text-white">Log In</h1>
          <p className="py-2 text-white">Type your email to get started</p>
        </div>
        <input
          type="email"
          id="email"
          name="email"
          autoComplete="home email"
          placeholder="Enter your email"
          value={email}
          onChange={updateEmail}
          onKeyDown={handleKeyDown}
          className="focusable rounded-xl bg-white/10 px-4 py-2 font-semibold text-white placeholder-white/50 transition duration-200 focus:bg-white/20"
        />
        <button
          disabled={!isValid}
          onClick={handleSignIn}
          type="button"
          className={`focusable rounded-xl bg-white/10 px-4 py-2 font-semibold text-white transition duration-200 ${
            isValid ? "bg-white/10 shadow hover:bg-white/20" : "bg-white/5"
          }`}
        >
          <span className={isValid ? "" : "blur"}>Sign in</span>
        </button>
      </form>
    </>
  );
}
