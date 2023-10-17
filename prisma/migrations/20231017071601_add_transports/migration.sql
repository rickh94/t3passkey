/*
  Warnings:

  - Added the required column `transports` to the `Credential` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Credential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "credentialId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credetialPublicKey" BLOB NOT NULL,
    "counter" INTEGER NOT NULL,
    "transports" TEXT NOT NULL,
    CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Credential" ("counter", "credentialId", "credetialPublicKey", "id", "userId") SELECT "counter", "credentialId", "credetialPublicKey", "id", "userId" FROM "Credential";
DROP TABLE "Credential";
ALTER TABLE "new_Credential" RENAME TO "Credential";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
