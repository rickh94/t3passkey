import redis from "~/server/redis";

import { db } from "~/server/db";

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
