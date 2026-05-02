const express = require('express')
const axios   = require('axios')
const router  = express.Router()

const BOT_TOKEN = process.env.BOT_TOKEN
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`

// POST /build  { ca, chain }
// Full pipeline: fetch token → create group → configure → return invite link
router.post('/', async (req, res) => {
  const { ca, chain = 'Solana' } = req.body
  if (!ca) return res.status(400).json({ error: 'CA is required' })

  const steps = []
  const log   = msg => { steps.push(msg); console.log(msg) }

  try {
    // ── Step 1: Fetch token metadata ──────────────────────────────
    log('Fetching token data...')
    let token = { name: 'Unknown', ticker: 'TKN', logo: null, ca }

    try {
      const meta = await axios.get(
        `http://localhost:${process.env.PORT || 3001}/token/${ca}`
      )
      token = meta.data
      log(`Token data fetched — ${token.name} ($${token.ticker})`)
    } catch {
      log('Token metadata not found — using CA as identifier')
    }

    // ── Steps 2–9: Telegram group creation ───────────────────────
    // Requires GramJS user session (TG_API_ID + TG_API_HASH + TG_SESSION)
    // Bot API alone cannot create groups — this is a Telegram platform limitation
    if (!process.env.TG_API_ID || !process.env.TG_API_HASH || !process.env.TG_SESSION) {
      log('Telegram group creation — awaiting credentials (TG_API_ID, TG_API_HASH, TG_SESSION)')
      return res.status(202).json({
        status: 'partial',
        message: 'Token metadata works. Group creation needs TG_API_ID + TG_API_HASH + TG_SESSION.',
        token,
        steps,
        needsSetup: ['TG_API_ID', 'TG_API_HASH', 'TG_SESSION'],
      })
    }

    // ── Full flow (runs once GramJS creds are configured) ────────
    const { TelegramClient } = require('telegram')
    const { StringSession }  = require('telegram/sessions')

    const client = new TelegramClient(
      new StringSession(process.env.TG_SESSION),
      parseInt(process.env.TG_API_ID),
      process.env.TG_API_HASH,
      { connectionRetries: 3 }
    )
    await client.connect()
    log('Connected to Telegram')

    // Create group
    log('Creating Telegram group...')
    const groupName = `${token.name} | $${token.ticker}`
    const result = await client.invoke(
      new (require('telegram/tl').Api.messages.CreateChat)({
        users: [],
        title: groupName,
      })
    )
    const chatId = result.chats[0].id
    log('Telegram group created')

    // Set description
    log('Setting group description...')
    await client.invoke(
      new (require('telegram/tl').Api.messages.EditChatAbout)({
        peer: chatId,
        about: `${token.name} ($${token.ticker}) — Official Community\nCA: ${ca}`,
      })
    )

    // Upload logo as group photo if available
    if (token.logo) {
      try {
        log('Uploading token logo...')
        const imgRes  = await axios.get(token.logo, { responseType: 'arraybuffer' })
        const file    = await client.uploadFile({
          file: Buffer.from(imgRes.data),
          workers: 1,
        })
        await client.invoke(
          new (require('telegram/tl').Api.messages.EditChatPhoto)({
            chatId,
            photo: new (require('telegram/tl').Api.InputChatUploadedPhoto)({ file }),
          })
        )
        log('Token logo set as group photo')
      } catch {
        log('Logo upload skipped — image unavailable')
      }
    }

    // Add Safeguard bot
    log('Adding Safeguard verification gate...')
    try {
      await client.invoke(
        new (require('telegram/tl').Api.messages.AddChatUser)({
          chatId,
          userId: 'SafeguardRobot',
          fwdLimit: 0,
        })
      )
      log('Safeguard gate active')
    } catch {
      log('Safeguard: add manually after group creation')
    }

    // Add Rose Bot
    log('Adding Rose moderation bot...')
    try {
      await client.invoke(
        new (require('telegram/tl').Api.messages.AddChatUser)({
          chatId,
          userId: 'MissRose_bot',
          fwdLimit: 0,
        })
      )
      log('Mod bots installed')
    } catch {
      log('Rose Bot: add manually after group creation')
    }

    // Set pinned welcome message via bot
    log('Setting welcome message...')
    const welcomeText =
      `👋 Welcome to ${token.name} ($${token.ticker})!\n\n` +
      `📋 CA: \`${ca}\`\n` +
      `🌐 Website: coming soon\n` +
      `🐦 Twitter: coming soon\n` +
      `📈 Chart: coming soon\n\n` +
      `✅ Please verify with Safeguard to chat.`

    const sent = await client.sendMessage(chatId, { message: welcomeText, parseMode: 'md' })
    await client.invoke(
      new (require('telegram/tl').Api.messages.UpdatePinnedMessage)({
        peer: chatId,
        id: sent.id,
      })
    )
    log('Welcome message set')

    // Generate invite link
    log('Generating invite link...')
    const inviteResult = await client.invoke(
      new (require('telegram/tl').Api.messages.ExportChatInvite)({ peer: chatId })
    )
    const inviteLink = inviteResult.link
    log('Engagement network ready')

    await client.disconnect()

    return res.json({
      status: 'success',
      token,
      inviteLink,
      steps,
    })

  } catch (err) {
    console.error('Build error:', err.message)
    res.status(500).json({ error: err.message, steps })
  }
})

module.exports = router
