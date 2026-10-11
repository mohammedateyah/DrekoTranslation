# Dreko Translation

An independent Arabic-first Electron desktop app built with HTML, CSS, and JavaScript. Firebase Authentication and Cloud Firestore provide the shared catalogue and artwork. Discord OAuth verifies that each desktop user belongs to the Dreko community before the app opens.

The Discord server (guild) ID is `766985465323716649`. The bot has been verified as able to read that guild. This ID is enforced in `firebase-client.js`, `firestore.rules`, `storage.rules`, and `auth-server/.env`. Deploy the updated Firestore rules before using artwork uploads.

The desktop app publishes Discord Rich Presence through the same public Discord application ID used for sign-in. Keep Discord's desktop **Activity Privacy → Share your detected activities with others** enabled to display it. The activity includes a **تحميل التطبيق** button linking to `https://dreko8u.web.app`; it appears while the Discord desktop client is running.

## Discord sign-in service

Discord client secrets, the bot token, and Firebase Admin credentials are server-only. Never add them to this Electron project, `discord-auth-config.json`, a release, or a message to someone helping with the setup.

1. In the Discord Developer Portal, create or select the Discord application and add this OAuth2 redirect URL to its OAuth2 settings:

   ```text
   https://dreko-discord-auth.netlify.app/discord/callback
   ```

   The client ID and client secret belong in the backend's private environment only. The normal sign-in needs the `identify` OAuth scope. Optional automatic joining additionally needs the `guilds.join` scope; keep it disabled unless the bot is in the server and has the permissions required by Discord.
2. Invite the bot belonging to that application to the target server. The bot token is used only by the backend to verify server membership. Without automatic joining, configure a permanent or non-expiring server invitation for users who need to join.
3. Deploy `auth-server` as a separate Netlify site. The site [`dreko-discord-auth`](https://app.netlify.com/projects/dreko-discord-auth) is already created and its initial production deployment is live at `https://dreko-discord-auth.netlify.app`. The included `netlify.toml` and Function adapt the existing Express routes; OAuth state and short-lived sessions are stored in Firestore so sign-in continues to work across serverless invocations. The Netlify ignore list excludes local environment files and service-account keys.
4. In the Netlify site's **Project configuration → Environment variables**, add the following variables. Paste the Firebase service-account JSON directly into its variable value in Netlify; never paste it into chat, a source file, or a terminal command.

   ```powershell
   PUBLIC_ORIGIN=https://dreko-discord-auth.netlify.app
   DISCORD_CLIENT_ID=1555960188467683328
   DISCORD_CLIENT_SECRET=<set privately in Netlify>
   DISCORD_REDIRECT_URI=https://dreko-discord-auth.netlify.app/discord/callback
   DISCORD_BOT_TOKEN=<set privately in Netlify>
   DISCORD_GUILD_ID=766985465323716649
   DISCORD_GUILD_NAME=DREKO SPACE
   DISCORD_INVITE_URL=<your permanent Discord invite URL>
   DISCORD_AUTO_JOIN=false
   FIREBASE_PROJECT_ID=drekotranslation
   FIREBASE_SERVICE_ACCOUNT_JSON=<paste service-account JSON privately in Netlify>
   OAUTH_SESSION_STORE=firestore
   ```

   Store the client secret, bot token, and Firebase service-account JSON as **sensitive/secret** values. Because credentials were exposed in the earlier setup conversation, rotate the Discord client secret and bot token, create a replacement Firebase service-account key, and revoke the old credentials before entering values in any hosting provider. Do not reuse the old values from `auth-server/.env` or `firebase-service-account.json`. The replacement service account must belong to `drekotranslation` and be allowed to create Firebase Authentication custom tokens. Firestore Admin uses the service account and bypasses Firestore client rules; do not loosen the client rules for the OAuth session collections.
5. Add `https://dreko-discord-auth.netlify.app/discord/callback` to the Discord application's OAuth2 redirect URLs. The callback path is handled by the Netlify rewrite.

   ```powershell
   https://dreko-discord-auth.netlify.app/healthz
   ```

   The health endpoint must report `ready: true`. After production deploys are available, trigger a new production deploy to load environment changes. Then set `serverUrl` in [`discord-auth-config.json`](./discord-auth-config.json) to `https://dreko-discord-auth.netlify.app` and rebuild the desktop installer. `http://localhost:53178` is only for local development and is rejected by packaged builds. Netlify production deploys for this team may be paused if its monthly credit allowance is exhausted.
6. For local testing only, you may configure `GOOGLE_APPLICATION_CREDENTIALS` in the ignored local `auth-server/.env` to point to a Firebase service-account JSON file. Never commit or distribute that key.

## Cloudflare Workers alternative

The Cloudflare Worker implementation lives in `auth-server/cloudflare-worker.mjs`. It uses D1 for one-time OAuth states, short-lived sessions, and request limits; Firebase custom tokens are signed with a server-only service-account key using Web Crypto, while Firebase ID tokens are verified against Google's signing keys. Client Firestore rules remain unchanged.

1. The existing Cloudflare Worker is `dreko-discord-auth` at `https://dreko-discord-auth.drekosteam.workers.dev`; `auth-server/wrangler.toml` targets this exact Worker and its existing D1 database. The D1 migration has already been applied.
2. Public Worker variables are defined in `auth-server/wrangler.toml`: `PUBLIC_ORIGIN`, `DISCORD_CLIENT_ID`, `DISCORD_REDIRECT_URI`, `DISCORD_GUILD_ID`, `DISCORD_GUILD_NAME`, `DISCORD_INVITE_URL`, `DISCORD_AUTO_JOIN=false`, and `FIREBASE_PROJECT_ID`. Keep the redirect URL exactly `https://dreko-discord-auth.drekosteam.workers.dev/discord/callback`.
3. Add that exact callback URL to the Discord application's OAuth2 redirect URLs.
4. After rotating any credentials exposed in chat, add `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, and `FIREBASE_SERVICE_ACCOUNT_JSON` as encrypted Worker secrets in Cloudflare. The Firebase JSON must belong to `drekotranslation` and allow Firebase Authentication custom-token signing. Never commit `.dev.vars`, `.env`, or credential files.
5. Deploy with `npm run cf:deploy` after setting all three replacement secrets. Verify `/healthz` reports `ready: true` and `/v1/desktop/config` contains no setup issues. Only then change the desktop app's `discord-auth-config.json` to the Worker origin and build a new installer. Keep the existing Netlify endpoint until this verification passes.

## Windows application updates

The assisted Windows installer asks the user to choose Arabic or English before the setup pages. It continues in the selected language and applies that language on the first app launch; the in-app language switch remains available afterward.

The **Updates** navigation link checks GitHub Releases for a newer installed-app version. The public release repository is `mohammedateyah/DrekoTranslation`; Discord authentication and application updates use separate services.

1. Deploy the updated Cloudflare Worker from `auth-server` with `npm run cf:deploy`. Its `/updates/` compatibility route serves release metadata for already-installed version 1.0.0 and redirects installer downloads to GitHub Releases.
2. Increase `version` in `package.json`, commit the changes, and push a matching version tag such as `v1.0.2`.
3. The `Publish Windows release` GitHub Actions workflow builds the NSIS installer and publishes it with `latest.yml` and any blockmap files. The tag must exactly match the version in `package.json`; GitHub's built-in workflow token is used for publishing.
4. Confirm the GitHub release is published. New installs and versions built with the GitHub publisher check GitHub directly; version 1.0.0 continues using the Worker compatibility route until it installs the first GitHub-based update.

Update checks require an installed, packaged Windows app. Development builds intentionally do not download or install updates. The first GitHub release must have a version newer than 1.0.0 so existing installations can upgrade.

For local desktop testing, register the exact Discord redirect URI `http://localhost:53178/callback` in the Discord Developer Portal. Configure the local auth service with that URI and port, and set `serverUrl` in `discord-auth-config.json` to `http://localhost:53178`. Discord only accepts redirect URIs registered for the application; hosted deployments should instead register and use their HTTPS callback URL.

The backend stores short-lived OAuth sessions in memory. Users must restart sign-in if the service restarts or the five-minute sign-in session expires. With automatic joining disabled, a non-member sees the invitation link and a retry action. Automatic joining is optional and is controlled by `DISCORD_AUTO_JOIN=true` on the server.

## Firebase setup and access rules

Create the project's Cloud Firestore database and default Cloud Storage bucket. After confirming that the configured guild ID is correct, deploy the included rules using the Firebase CLI and your authorized Google account:

```powershell
firebase deploy --only firestore:rules,storage --project drekotranslation
```

These rules require a Firebase custom token issued by the Discord auth service and a short-lived Discord membership lease for **all** translation and cover reads. The app renews that lease only after the backend confirms the user's current server membership; enabled administrators alone can access drafts or change catalogue data. Artwork is compressed to WebP and stored in the Firestore `translationCovers` collection so uploads work on the Firebase Spark plan without Firebase Storage billing.

To grant dashboard access, create a document in the Firestore `administrators` collection whose document ID is `discord_DISCORD_USER_ID` (the literal prefix `discord_` followed by the administrator's numeric Discord user ID). Add this boolean field:

```text
enabled: true
```

Do not reuse an older email/password Firebase UID document as an administrator record. The desktop client no longer accepts email/password sign-in; an administrator first signs in through Discord and must have the matching enabled document.

## Finding game artwork

The translation editor can search artwork in this order: IGDB, TheGamesDB, then SteamGridDB. It falls through to the next provider when the current provider has no usable artwork. Selected artwork and local uploads are compressed to WebP (up to 300 KiB) and stored in Firestore, avoiding a Firebase Storage bucket and its billing requirement. Deploy the current `firestore.rules` before saving artwork; only administrators can write cover documents, and players can read a cover only while its translation is published.

The desktop main process reads the project-root `.env` file on startup. Configure provider credentials there; keys are not entered in the editor:

```dotenv
IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
THEGAMESDB_API_KEY=
STEAMGRIDDB_API_KEY=
```

The local `.env` file is ignored by Git and explicitly excluded from installer contents. Use `.env.example` as the empty template; never put real credentials in that template or commit the local `.env` file. For a packaged deployment, configure a private server-side image proxy rather than embedding provider keys in an installer. The selected image is validated and downloaded by the desktop process before it is uploaded with the translation.

- IGDB: Twitch Developer application Client ID and Client Secret from the [Twitch Developer Console](https://dev.twitch.tv/console/apps).
- TheGamesDB: API key from [TheGamesDB](https://thegamesdb.net/).
- SteamGridDB: API key from [SteamGridDB](https://www.steamgriddb.com/profile).

## Run and build on Windows

1. Install Node.js 22.12 or newer.
2. From this project folder, run `npm install`.
3. Start the desktop app with `npm start` or double-click `Start Dreko Translation.bat`.
4. For local development, start the backend separately with its own private `auth-server/.env` and set the public app config to `http://127.0.0.1:8787`. A packaged test build accepts that local endpoint only when launched with `--allow-local-auth-server`; normal packaged launches require HTTPS. Do not ship or distribute a local-server test build.
5. Once the auth service is deployed and `discord-auth-config.json` contains its HTTPS origin, build a Windows installer with `npm run dist`; an unpacked app can be built with `npm run build:dir`.

The app checks the stored Firebase session and asks the backend to re-verify current server membership at sign-in and periodically while open. Membership leases expire after six minutes, so Firebase rules deny access if a client skips those checks. On sign-out or membership loss, the app hides the catalogue and clears its live Firestore subscription. Firebase rules remain the security boundary even if someone bypasses the desktop UI.

After Discord membership is verified, the app saves the account's Discord ID, name, avatar, guild, account type, premium expiry, creation time, and last login time under `accounts/{firebaseUid}` in Cloud Firestore. Users can only read and update their own profile fields; an enabled administrator can list account profiles and update only their plan. The app checks `administrators/{firebaseUid}` and only displays the admin entry when that document has `enabled: true`.

Deploy the updated `firestore.rules` before testing sign-in with account saving enabled. The rules are not deployed automatically by the desktop app.

The administrator dashboard's **Accounts** page searches registered accounts and grants standard or premium access for 30, 90, 180, or 365 days, or permanently. Premium is treated as standard once `premiumExpiresAt` has passed; expired plans display as standard when the profile or accounts page is rendered. Deploy the revised `firestore.rules` before using account listing or changing plans. The desktop client does not deploy rules automatically.

Translation records can include a direct HTTPS `translationUrl` for a ZIP package. When a player selects a game folder and installs a translation, the app downloads the ZIP, checks its paths and size, extracts it, backs up files that would be replaced, and reports download and copy progress. The ZIP should contain files laid out as they belong in the game folder, rather than placing them under an extra wrapper folder. The player can remove the translation later to restore the backed-up files; removal stops if an installed file has changed since installation.

An optional direct HTTPS `installerProgramUrl` can point to a Windows `.exe` required by a translation. The app downloads it only after installing the ZIP, verifies that it is a Windows executable, and asks the player for explicit confirmation before running it. Only use installer programs from a source you trust. If it is cancelled or reports failure, Dreko attempts to roll back the ZIP installation. Installer programs can make additional changes outside the files tracked by Dreko, so those changes cannot always be automatically undone.

The translation editor's **package version** is optional display metadata. Both the ZIP URL and optional installer URL must be direct HTTPS file downloads, not web pages or cloud-drive preview pages. Updated `firestore.rules` allow the two metadata fields to be omitted on older records; deploy the current rules before administrators save records containing them.

Deploy the updated `firestore.rules` when publishing the translation URL field or the game request flow, since Firestore validates those documents.

The **My games** request flow and administrator **Translation requests** page require the latest `firestore.rules`. Players can create requests only for their verified Discord account; an account can have only one pending request, and requests matching a published translation by Steam app ID or Arabic/English title are rejected. Archiving a request as complete also creates a public-safe `translationAvailability/{steamAppId}` marker, preventing new requests for that game even when its translation is not yet published. The admin request list backfills these markers for previously archived requests. Administrators can review requests, archive a request after adding its translation, restore archived requests to pending, or delete requests. Restoring an archived request is blocked while that account has another pending request; its availability marker is removed only if no other archived request exists for the same Steam app ID. The lock records in `translationRequestLocks` keep the per-account limit consistent across clients. Request cards show Steam artwork and the requester's Discord avatar, loaded from the request or the matching saved account profile. Legacy pending requests without a lock can still be archived without overwriting another active request lock. Deploy the included Firestore rules before using these workflows; the app does not deploy rules automatically. Steam game detection currently covers Steam libraries configured on the Windows PC.

## Features

- Discord-only desktop access gated on current membership in the configured server.
- Arabic/English layouts, search, sorting, category filters, animated artwork, and dark/light themes.
- The **My games** button switches the existing library grid to fully installed Steam games across configured Steam libraries; selecting a game opens only the request confirmation. Translation requests are stored in Cloud Firestore under `translationRequests` and are readable by administrators and the requesting account.
- Administrators can search pending and archived translation requests, mark a game as translated, restore an archived request, or delete it.
- Administrators can mark each translation as premium; **Dreko translations** filters the catalogue to those marked entries.
- A private administrator dashboard for managing Firestore translations and shared Firestore artwork.
- A sandboxed Electron renderer, context isolation, trusted-window IPC, restricted external links, and a restrictive Content Security Policy.

## Checks

Run `npm test` for the local database and Discord membership tests. Run `npm run build:app` to bundle the renderer. In `auth-server`, run `npm test` for the isolated backend tests and `npm audit --omit=dev` to check its production dependencies.
