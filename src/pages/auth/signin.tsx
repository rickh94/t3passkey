import { signIn, useSession } from "next-auth/react";
import {
  type ChangeEvent,
  type KeyboardEventHandler,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/router";
import directApi from "~/utils/directApi";
import { startAuthentication } from "@simplewebauthn/browser";
import { PageLayout } from "~/components/layout";

export default function SignInComponent() {
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState(false);

  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  });

  // sign in with email
  async function signInWithEmail() {
    await signIn("email", { email });
  }

  async function handleSignIn() {
    try {
      await signInWithWebauthn();
    } catch (error) {
      console.log(error);
      await signInWithEmail();
    }
  }

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter") {
      handleSignIn();
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

    await signIn("credentials", {
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
    <PageLayout>
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
          className="rounded-full border-slate-200 bg-white/10 px-4 py-2 text-white shadow focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#2e026d]"
        />
        <button
          disabled={!isValid}
          onClick={handleSignIn}
          type="button"
          className={`w-full rounded-full px-10 py-3 font-semibold text-white transition ${isValid ? "bg-white/20 shadow hover:bg-white/20" : "bg-slate-100/20"
            }`}
        >
          Sign in
        </button>
      </form>
    </PageLayout>
  );
}
// TODO: restyle this
