const express = require('express')
const axios   = require('axios')
const { Api } = require('telegram')
const router  = express.Router()

const BOT_TOKEN = process.env.BOT_TOKEN

async function getClient() {
  const { TelegramClient } = require('telegram')
  const { StringSession }  = require('telegram/sessions')
  const client = new TelegramClient(
    new StringSession(process.env.TG_SESSION),
    parseInt(process.env.TG_API_ID),
    process.env.TG_API_HASH,
    { connectionRetries: 3 }
  )
  await client.connect()
  return client
}

// POST /build  { ca, chain }
router.post('/', async (req, res) => {
  const { ca, chain = 'Solana', username = '' } = req.body
  if (!ca) return res.status(400).json({ error: 'CA is required' })

  const steps = []
  const log   = msg => { steps.push(msg); console.log(msg) }
  let client  = null

  try {
    // ── Step 1: Token metadata ────────────────────────────────────
    log('Fetching token data...')
    let token = { name: 'Token', ticker: 'TKN', logo: null, ca }
    try {
      const { data } = await axios.get(`http://localhost:${process.env.PORT || 3001}/token/${ca}`)
      token = data
      log(`Token data fetched — ${token.name} ($${token.ticker})`)
    } catch {
      log('Token metadata unavailable — using CA identifier')
    }

    // ── Step 2: Connect & create supergroup ───────────────────────
    client = await getClient()
    log('Connected to Telegram')

    log('Creating Telegram group...')
    const groupName = `${token.name} | $${token.ticker}`
    const createResult = await client.invoke(
      new Api.channels.CreateChannel({
        title:      groupName,
        about:      `${token.name} ($${token.ticker}) — Official Community\nCA: ${ca}`,
        megagroup:  true,
        broadcast:  false,
      })
    )
    const channel = createResult.chats[0]
    const peer    = new Api.InputChannel({
      channelId:  channel.id,
      accessHash: channel.accessHash,
    })
    log('Telegram group created')

    // ── Step 3: Upload token logo as group photo ──────────────────
    if (token.logo) {
      try {
        const imgRes = await axios.get(token.logo, { responseType: 'arraybuffer' })
        const file   = await client.uploadFile({
          file:    Buffer.from(imgRes.data),
          workers: 1,
        })
        await client.invoke(
          new Api.channels.EditPhoto({
            channel: peer,
            photo:   new Api.InputChatUploadedPhoto({ file }),
          })
        )
        log('Token logo set as group photo')
      } catch {
        log('Logo upload skipped')
      }
    }

    // ── Step 4: Add Safeguard bot ─────────────────────────────────
    log('Configuring Safeguard verification gate...')
    try {
      const safeguard = await client.getEntity('SafeguardRobot')
      await client.invoke(
        new Api.channels.InviteToChannel({ channel: peer, users: [safeguard] })
      )
      await client.invoke(
        new Api.channels.EditAdmin({
          channel:  peer,
          userId:   safeguard,
          adminRights: new Api.ChatAdminRights({
            changeInfo:    false,
            postMessages:  false,
            editMessages:  false,
            deleteMessages: true,
            banUsers:      true,
            inviteUsers:   true,
            pinMessages:   false,
            addAdmins:     false,
            anonymous:     false,
            manageCall:    false,
            other:         true,
          }),
          rank: 'Verification',
        })
      )
      log('Safeguard gate active')
    } catch (e) {
      log('Safeguard: add @SafeguardRobot manually as admin')
      console.error('Safeguard error:', e.message)
    }

    // ── Step 5: Add Rose Bot ──────────────────────────────────────
    log('Installing mod bots...')
    try {
      const rose = await client.getEntity('MissRose_bot')
      await client.invoke(
        new Api.channels.InviteToChannel({ channel: peer, users: [rose] })
      )
      await client.invoke(
        new Api.channels.EditAdmin({
          channel:  peer,
          userId:   rose,
          adminRights: new Api.ChatAdminRights({
            changeInfo:    false,
            postMessages:  false,
            editMessages:  false,
            deleteMessages: true,
            banUsers:      true,
            inviteUsers:   true,
            pinMessages:   true,
            addAdmins:     false,
            anonymous:     false,
            manageCall:    false,
            other:         true,
          }),
          rank: 'Moderator',
        })
      )
      log('Mod bots installed')
    } catch (e) {
      log('Rose Bot: add @MissRose_bot manually as admin')
      console.error('Rose Bot error:', e.message)
    }

    // ── Step 6: Pin welcome message ───────────────────────────────
    log('Setting welcome message...')
    const welcomeText =
      `👋 *Welcome to ${token.name} \\($${token.ticker}\\)\\!*\n\n` +
      `📋 CA: \`${ca}\`\n` +
      `🌐 Website: coming soon\n` +
      `🐦 Twitter: coming soon\n` +
      `📈 Chart: coming soon\n\n` +
      `✅ Verify with Safeguard to chat\\.`

    const sent = await client.sendMessage(peer, {
      message:   welcomeText,
      parseMode: 'md',
    })
    await client.invoke(
      new Api.messages.UpdatePinnedMessage({
        peer:   peer,
        id:     sent.id,
        silent: true,
      })
    )
    log('Welcome message set')

    // ── Step 7: Add user as full admin ───────────────────────────
    if (username) {
      log('Adding you as group admin...')
      try {
        const userEntity = await client.getEntity(username.replace('@', ''))
        await client.invoke(
          new Api.channels.InviteToChannel({ channel: peer, users: [userEntity] })
        )
        await client.invoke(
          new Api.channels.EditAdmin({
            channel: peer,
            userId:  userEntity,
            adminRights: new Api.ChatAdminRights({
              changeInfo:     true,
              postMessages:   true,
              editMessages:   true,
              deleteMessages: true,
              banUsers:       true,
              inviteUsers:    true,
              pinMessages:    true,
              addAdmins:      true,
              anonymous:      false,
              manageCall:     true,
              other:          true,
            }),
            rank: 'Founder',
          })
        )
        log('You have been added as admin')
      } catch (e) {
        log(`Could not add ${username} — join via invite link and promote yourself`)
        console.error('Add user error:', e.message)
      }
    }

    // ── Step 8: Export invite link ────────────────────────────────
    log('Generating invite link...')
    const inviteResult = await client.invoke(
      new Api.messages.ExportChatInvite({ peer })
    )

    // ── Step 9: Leave the group ───────────────────────────────────
    log('Finalising — removing setup account...')
    await client.invoke(new Api.channels.LeaveChannel({ channel: peer }))
    log('Engagement network ready')

    await client.disconnect()

    return res.json({
      status:     'success',
      token,
      inviteLink: inviteResult.link,
      steps,
    })

  } catch (err) {
    console.error('Build error:', err.message)
    if (client) await client.disconnect().catch(() => {})
    res.status(500).json({ error: err.message, steps })
  }
})

module.exports = router
