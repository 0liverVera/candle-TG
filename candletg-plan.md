# CandleTG — Build Plan

## What This Is

CandleTG is a web tool for memecoin developers. A user pastes a contract address and their Telegram username, and the tool automatically builds a fully configured Telegram community for their token — group, verify channel, bots, branding — in under 60 seconds. No Telegram knowledge required.

---

## Product Flow

1. User visits the site
2. Pastes their contract address (Solana, Ethereum, or Base)
3. Enters their Telegram username
4. Clicks "Build my group"
5. Tool fetches token metadata, builds the Telegram community, adds the user as owner, and returns a single invite link
6. User shares the verify channel link with their community

---

## What Gets Built Per Token

### Verify Channel — `TOKEN NAME Verify`
- Public broadcast channel, the only link that gets shared publicly
- Token logo set as channel photo
- Welcome post: token banner image, contract address, and a "✅ Verify & Join" button
- Button links to SafeguardRobot which gates entry into the group
- SafeguardRobot added as admin

### Community Group — `TOKEN NAME`
- Private supergroup, not linked publicly
- Token logo set as group photo
- Description contains token name, ticker, and CA
- SafeguardRobot added as admin — every new member must pass verification before they can speak
- MissRose_bot added as admin — handles moderation, welcome messages, anti-spam, flood control
- Requesting user added as full admin with Founder rank

### Builder Account Exit
- After everything is configured the builder account removes itself as admin and leaves both the group and the channel
- Neither chat appears on the builder's phone after the build
- The community fully belongs to the requesting user

---

## Verification Flow (End User Journey)

1. New member receives the verify channel link
2. Joins the channel, sees the welcome post with the "Verify & Join" button
3. Clicks the button — opens SafeguardRobot in DM
4. Completes the CAPTCHA challenge
5. SafeguardRobot automatically adds them to the community group
6. Member can now read and send messages in the group

---

## Token Metadata

- Fetch token name, ticker, and logo from chain using the contract address
- Solana: Helius DAS API (primary), Jupiter token list (fallback)
- Ethereum / Base: to be determined
- Used to name the group, set the photo, and personalise the welcome message

---

## Bot Roles

### SafeguardRobot
- Verification gate on every new member entering the group
- CAPTCHA or click-to-verify challenge
- Anti-raid protection — auto-lockdown if too many members join at once
- Added to both the verify channel and the community group

### MissRose_bot
- Welcome message automatically sent to every verified new member
- Anti-spam and flood control
- Word and phrase blacklist
- Admin commands: ban, mute, kick, warn, unban
- Rules display on demand
- Saved replies for common admin responses

---

## Tech Stack

### Frontend
- React + Vite
- Two-column layout: left side has product context and live activity feed, right side has the tool card
- Step-by-step progress indicator while the build runs
- Deployed via GitHub Pages

### Backend
- Node.js + Express
- GramJS (MTProto) — connects to Telegram as a real user account, required because the Bot API cannot create groups
- Token metadata via Helius API and Jupiter
- Deployed on Railway (or similar)

---

## Build Sequence

1. Fetch token metadata from chain
2. Connect to Telegram via MTProto session
3. Create community group — set name, description, photo
4. Add SafeguardRobot to group as admin
5. Add MissRose_bot to group as admin
6. Add requesting user to group as Founder admin
7. Create verify channel — set name, description, photo
8. Add SafeguardRobot to verify channel as admin
9. Post welcome message to verify channel with banner image and verify button
10. Add requesting user to verify channel as Founder admin
11. Builder account demotes itself and leaves both group and channel
12. Return verify channel invite link to user

---

## What Is Out of Scope (For Now)

- Ethereum and Base token metadata lookup
- Pinned message with socials and chart links (manual for now)
- Rose Bot welcome message configuration (must be set manually after build via `/setwelcome`)
- Multi-user accounts / SaaS login
- Payment / billing