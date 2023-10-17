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
    <div>
      <main>
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="home email"
            placeholder="Enter your email"
            value={email}
            onChange={updateEmail}
            onKeyDown={handleKeyDown}
          />
          <button disabled={!isValid} onClick={handleSignIn} type="button">
            Sign in
          </button>
        </form>
      </main>
    </div>
  );
}
