import redis from "~/server/redis";

if (!process.env.NEXTAUTH_URL && !process.env.VERCEL_URL) {
  throw new Error("NEXTAUTH_URL is not set");
}

export const rpID =
  process.env.VERCEL_URL || process.env.NEXTAUTH_URL?.replace("https://", "");

export const domain = `https://${rpID}`;

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
