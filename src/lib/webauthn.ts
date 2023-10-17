import { env } from "~/env.mjs";
import redis from "~/server/redis";

export const rpID = env.NEXTAUTH_URL.replace("https://", "");
export const domain = `https://${env.NEXTAUTH_URL.replace("https://", "")}`;

// TODO: maybe encrypt challenges
export async function saveChallenge({
  userID,
  challenge,
}: {
  challenge: string;
  userID: string;
}) {
  redis.set(`${userID}-challenge`, challenge, {
    ex: 60 * 5,
  });
}

export async function getChallenge(userID: string): Promise<string | null> {
  const challenge = await redis.get<string | null>(`${userID}-challenge`);
  if (!challenge) {
    return null;
  }
  redis.del(`${userID}-challenge`);
  return challenge;
}
