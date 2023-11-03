import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { TRPCError } from "@trpc/server";
import base64url from "base64url";
import { z } from "zod";
import { domain, getChallenge, rpID, saveChallenge } from "~/lib/webauthn";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const webauthnRouter = createTRPCRouter({
  handlePreRegister: protectedProcedure.query(async ({ ctx }) => {
    const id = ctx.session.user?.id;
    if (!id) {
      throw new TRPCError({
        message: "Invalid user",
        code: "BAD_REQUEST",
      });
    }
    const user = await ctx.db.user.findUnique({
      where: {
        id,
      },
    });
    if (!user) {
      throw new TRPCError({
        message: "User does not exist",
        code: "BAD_REQUEST",
      });
    }
    const credentials = await ctx.db.credential.findMany({
      where: {
        userId: user.id,
      },
    });
    if (!rpID) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Missing rpID",
      });
    }

    if (!ctx.session.user.email) {
      throw new TRPCError({
        message: "User does not have associated email",
        code: "BAD_REQUEST",
      });
    }

    const options = await generateRegistrationOptions({
      rpID,
      rpName: "T3 Passkeys",
      userID: user.id,
      userName: ctx.session.user.email,
      userDisplayName: ctx.session.user.name || ctx.session.user.email,
      attestationType: "none",
      authenticatorSelection: {
        userVerification: "required",
      },
    });
    options.excludeCredentials = credentials.map((c) => ({
      id: c.credentialID,
      type: "public-key",
      transports: JSON.parse(c.transports),
    }));

    try {
      await saveChallenge({
        userID: user.id,
        challenge: options.challenge,
      });
    } catch (err) {
      throw new TRPCError({
        message: "Error saving challenge",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
    return options;
  }),

  handleRegister: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        rawId: z.string(),
        response: z.object({
          clientDataJSON: z.string(),
          attestationObject: z.string(),
          authenticatorData: z.string().optional(),
          transports: z
            .array(
              z.enum([
                "ble",
                "cable",
                "hybrid",
                "internal",
                "nfc",
                "smart-card",
                "usb",
              ]),
            )
            .optional(),
          publicKeyAlgorithm: z.number().optional(),
          publicKey: z.string().optional(),
        }),
        authenticatorAttachment: z
          .enum(["cross-platform", "platform"])
          .optional(),
        clientExtensionResults: z.object({
          appid: z.boolean().optional(),
          credProps: z
            .object({
              rk: z.boolean().optional(),
            })
            .optional(),
          hmacCreateSecret: z.boolean().optional(),
        }),
        type: z.enum(["public-key"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = ctx.session.user?.id;
      if (!id) {
        throw new TRPCError({
          message: "User does not have associated email",
          code: "BAD_REQUEST",
        });
      }
      const user = await ctx.db.user.findUnique({
        where: {
          id,
        },
      });
      if (!user) {
        throw new TRPCError({
          message: "User does not exist",
          code: "BAD_REQUEST",
        });
      }

      const challenge = await getChallenge(user.id);
      if (!challenge) {
        throw new TRPCError({
          message: "Could not get challenge for user",
          code: "BAD_REQUEST",
        });
      }

      const { verified, registrationInfo } = await verifyRegistrationResponse({
        response: input,
        expectedRPID: rpID,
        expectedOrigin: domain,
        expectedChallenge: challenge,
      });

      if (!verified || !registrationInfo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not verify registration",
        });
      }

      const transports = input.response.transports ?? ["internal"];
      await ctx.db.credential.create({
        data: {
          credentialID: input.id,
          credentialPublicKey: registrationInfo.credentialPublicKey as Buffer,
          userId: user.id,
          counter: registrationInfo.counter,
          transports: JSON.stringify(transports),
        },
      });
    }),

  startAuthentication: publicProcedure
    .input(z.string().email())
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: {
          email: input,
        },
      });

      if (!user || !user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid user",
        });
      }
      const credentials = await ctx.db.credential.findMany({
        where: {
          userId: user.id,
        },
      });

      if (!rpID) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Missing rpID",
        });
      }

      const options = await generateAuthenticationOptions({
        rpID,
        userVerification: "required",
        allowCredentials: credentials.map((c) => ({
          id: base64url.toBuffer(c.credentialID),
          type: "public-key",
          transports: JSON.parse(c.transports),
        })),
      });

      try {
        await saveChallenge({
          userID: user.id,
          challenge: options.challenge,
        });
      } catch (err) {
        throw new TRPCError({
          message: "Error saving challenge",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
      return options;
    }),
});
