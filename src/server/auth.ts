import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
  type Session,
} from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";

import { env } from "~/env.mjs";
import { db } from "~/server/db";
import { domain, getChallenge, rpID } from "~/lib/webauthn";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { JWT } from "next-auth/jwt";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      // ...other properties
      // role: UserRole;
    };
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

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
  adapter: PrismaAdapter(db),
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "webauthn",
      credentials: {},
      async authorize(_cred, req) {
        if (!req.body) return null;
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

        const response = {
          id,
          rawId,
          type,
          response: {
            clientDataJSON,
            authenticatorData,
            signature,
            userHandle,
          },
          clientExtensionResults,
        };
        // console.log("response", response);

        const authenticator = await db.credential.findFirst({
          where: {
            credentialID: response.id,
          },
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

          return await db.user.findFirst({
            where: {
              id: authenticator.userId,
            },
          });
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
    signIn: "/auth/signin",
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
