import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type AnySQLiteDatabase } from "@auth/drizzle-adapter/lib/utils";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
  type Session,
  type RequestInternal,
} from "next-auth";

import { env } from "~/env.mjs";
import { db } from "~/server/db";
import { sqliteTable } from "drizzle-orm/sqlite-core";

import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";

import { domain, getChallenge, rpID } from "~/server/webauthn";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { type JWT } from "next-auth/jwt";
import { type AuthenticationResponseJSON } from "@simplewebauthn/typescript-types";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

// TODO: verify user exists somewhere in here

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, token }: { session: Session; token: JWT }) => {
      if (token?.id && typeof token?.id === "string") {
        session = {
          ...session,
          user: {
            ...session.user,
            id: token.id,
          },
        };
      }
      return session;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
  },
  adapter: DrizzleAdapter(db as unknown as AnySQLiteDatabase, sqliteTable),
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      id: "webauthn",
      name: "webauthn",
      credentials: {},
      async authorize(_cred, req) {
        const response = getWebauthnBody(req as RequestInternal);

        const authenticator = await db.query.credentials.findFirst({
          where: (credentials, { eq }) =>
            eq(credentials.credentialID, response.id),
        });

        if (!authenticator) {
          console.log("authenticator not found");
          return null;
        }
        const expectedChallenge = await getChallenge(authenticator.userId);
        if (!expectedChallenge) {
          return null;
        }

        try {
          const { verified, authenticationInfo } =
            await verifyAuthenticationResponse({
              response,
              expectedChallenge,
              expectedOrigin: domain,
              expectedRPID: rpID,
              authenticator: {
                credentialPublicKey:
                  authenticator.credentialPublicKey as Buffer,
                counter: authenticator.counter,
                credentialID: Buffer.from(
                  authenticator.credentialID,
                  "base64url",
                ),
              },
            });
          if (!verified || !authenticationInfo) {
            console.log("failed to verify");
            return null;
          }

          const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, authenticator.userId),
          });
          if (!user) {
            console.log("user not found");
            return null;
          }
          return user;
        } catch (err) {
          console.log(err);
          return null;
        }
      },
    }),

    EmailProvider({
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: env.EMAIL_SERVER_PORT,
        auth: {
          user: env.EMAIL_SERVER_USER,
          pass: env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
};

function getWebauthnBody(req: RequestInternal): AuthenticationResponseJSON {
  if (!req.body) {
    throw new Error("Missing body");
  }
  const {
    id,
    rawId,
    type,
    clientDataJSON,
    authenticatorData,
    signature,
    userHandle,
    clientExtensionResults,
  } = req.body;

  if (!id || typeof id !== "string") {
    throw new Error("Missing id");
  }

  if (!rawId || typeof rawId !== "string") {
    console.log("missing rawId");
    throw new Error("Missing rawId");
  }
  if (!type || typeof type !== "string" || type !== "public-key") {
    console.log("missing type");
    throw new Error("Missing type");
  }
  if (!clientDataJSON || typeof clientDataJSON !== "string") {
    console.log("missing clientDataJSON");
    throw new Error("Missing clientDataJSON");
  }
  if (!authenticatorData || typeof authenticatorData !== "string") {
    console.log("missing authenticatorData");
    throw new Error("Missing authenticatorData");
  }
  if (!signature || typeof signature !== "string") {
    console.log("missing signature");
    throw new Error("Missing signature");
  }
  if (!userHandle || typeof userHandle !== "string") {
    console.log("missing userHandle");
    throw new Error("Missing userHandle");
  }
  if (!clientExtensionResults) {
    console.log("missing clientExtensionResults");
    throw new Error("Missing clientExtensionResults");
  }

  return {
    id,
    rawId,
    type,
    response: {
      clientDataJSON,
      authenticatorData,
      signature,
      userHandle,
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    clientExtensionResults,
  };
}

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => {
  return getServerSession(authOptions);
};
