# Staging-only social discovery

This checkout belongs to Sites project `appgprj_6a991d219bb08191928ce054eb63f039`.
Do not deploy it with the production Worker configuration from the parent directory.
The live site and its D1 database are not part of this change.

## Scope

- Instagram, Twitch and TikTok profiles; Spotify artist URLs only.
- Source links from saved YouTube descriptions, optionally refreshed using the existing YouTube API key.
- MusicBrainz public release search `lang:bel` plus artist URL relationships, with >1 second between requests.
- No paid services or new credentials. This is link discovery, not comprehensive platform-wide search.
- MusicBrainz release metadata language does not prove performance language; source links do not prove account ownership or language either. All candidates require human verification.
- The first admin visit each UTC day starts one batch; subsequent batches can be requested manually. There is no background scheduler.
- Cursor rotation, a database lease, source failure reporting, identity deduplication, retained rejection history.
- No scraping of login-gated platform pages, search CAPTCHA bypass, automatic acceptance, or fabricated follower counts.

## Moderation

Discovery writes only `social_candidates`. The owner must check the account, confirm Belarusian content, edit the title/description if needed, then accept. Server-side confirmation and a database constraint both enforce the language confirmation. Approval and catalog insertion use an atomic D1 batch. Spotify confirmation concerns Belarusian-language works; other platforms concern both the author/account and its content.

## Verification

`node tests/social-discovery.test.mjs` tests URL restrictions, duplicates, no auto-publication, authorization, origin checks, mandatory confirmation, the database constraint, repeated approvals, rejected candidates, and concurrency locking against an in-memory SQLite database.

`node tests/social-discovery.test.mjs --live` additionally exercises public MusicBrainz requests; all moderation in this test remains in memory. Fixture accounts are never uploaded.

Sources: https://musicbrainz.org/doc/MusicBrainz_API and https://musicbrainz.org/doc/MusicBrainz_API/Search
