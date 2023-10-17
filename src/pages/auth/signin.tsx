import { signIn, useSession } from "next-auth/react";
import {
  type ChangeEvent,
  type KeyboardEventHandler,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/router";
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
    await signInWithEmail();
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
