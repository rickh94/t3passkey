# T3 App Template with passkeys

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.
I’ve hacked on Passkey/FIDO2/WebAuthn authentication.

## Passkeys + NextAuth

I’m using a Next Auth Credential provider to authenticate the passkey
credentials. This depends on [simplewebauthn](https://simplewebauthn.dev/). It
has the email provider as a fallback, but you could use something else.

## JWT Sessions

NextAuth does not allow you to use Database sessions with the
CredentialProvider, as far as I can tell. This is not well documented. It simply
fails silently if you do. So I’ve added configuration to use a JWT session and
get the user ID from the JWT.

## Turso

I’m using [Turso](https://turso.tech/). For the database, largely because of
their extremely generous free tier, but you can just swap it out for whatever
making the appropriate changes to the prisma configuration.
