const express = require('express')
const axios   = require('axios')
const { Api } = require('telegram')
const router  = express.Router()

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

// Full admin rights helper
function fullAdmin() {
  return new Api.ChatAdminRights({
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
  })
}

// Mod bot rights (no addAdmins)
function modAdmin() {
  return new Api.ChatAdminRights({
    changeInfo:     false,
    postMessages:   false,
    editMessages:   false,
    deleteMessages: true,
    banUsers:       true,
    inviteUsers:    true,
    pinMessages:    true,
    addAdmins:      false,
    anonymous:      false,
    manageCall:     false,
    other:          true,
  })
}

// Upload image from URL, return uploaded file object
async function uploadImageFromUrl(client, url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 10000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  const buf  = Buffer.from(res.data)
  const file = await client.uploadFile({ file: buf, workers: 3 })
  return file
}

// POST /build  { ca, chain, username }
router.post('/', async (req, res) => {
  const { ca, chain = 'Solana', username = '' } = req.body
  if (!ca) return res.status(400).json({ error: 'CA is required' })

  const steps = []
  const log   = msg => { steps.push(msg); console.log(msg) }
  let client  = null

  try {
    // ── 1. Fetch token metadata ───────────────────────────────────
    log('Fetching token data...')
    let token = { name: 'Token', ticker: 'TKN', logo: null, ca }
    try {
      const { data } = await axios.get(
        `http://localhost:${process.env.PORT || 3001}/token/${ca}`
      )
      token = data
      log(`Token data fetched — ${token.name} ($${token.ticker})`)
    } catch {
      log('Token metadata unavailable — continuing with CA')
    }

    client = await getClient()
    log('Connected to Telegram')

    const groupName   = `${token.name} | $${token.ticker}`
    const description = `${token.name} ($${token.ticker}) Official Community\nCA: ${ca}`

    // ── 2. Create the community group (supergroup) ────────────────
    log('Creating Telegram group...')
    const groupResult = await client.invoke(
      new Api.channels.CreateChannel({
        title:     groupName,
        about:     description,
        megagroup: true,
        broadcast: false,
      })
    )
    const group     = groupResult.chats[0]
    const groupPeer = new Api.InputChannel({
      channelId:  group.id,
      accessHash: group.accessHash,
    })
    log('Telegram group created')

    // ── 3. Set group profile photo from token logo ────────────────
    if (token.logo) {
      try {
        const file = await uploadImageFromUrl(client, token.logo)
        await client.invoke(
          new Api.channels.EditPhoto({
            channel: groupPeer,
            photo:   new Api.InputChatUploadedPhoto({ file }),
          })
        )
        log('Token logo set as group photo')
      } catch (e) {
        log('Group photo upload skipped')
        console.error('Photo error:', e.message)
      }
    }

    // ── 4. Add Safeguard to the group ─────────────────────────────
    log('Configuring Safeguard verification gate...')
    let safeguardEntity = null
    try {
      safeguardEntity = await client.getEntity('SafeguardRobot')
      await client.invoke(
        new Api.channels.InviteToChannel({ channel: groupPeer, users: [safeguardEntity] })
      )
      await client.invoke(
        new Api.channels.EditAdmin({
          channel:     groupPeer,
          userId:      safeguardEntity,
          adminRights: modAdmin(),
          rank:        'Verification',
        })
      )
      log('Safeguard gate active')
    } catch (e) {
      log('Safeguard: could not add automatically')
      console.error('Safeguard error:', e.message)
    }

    // ── 5. Add Rose Bot to the group ──────────────────────────────
    log('Installing mod bots...')
    try {
      const rose = await client.getEntity('MissRose_bot')
      await client.invoke(
        new Api.channels.InviteToChannel({ channel: groupPeer, users: [rose] })
      )
      await client.invoke(
        new Api.channels.EditAdmin({
          channel:     groupPeer,
          userId:      rose,
          adminRights: modAdmin(),
          rank:        'Moderator',
        })
      )
      log('Mod bots installed')
    } catch (e) {
      log('Rose Bot: could not add automatically')
      console.error('Rose Bot error:', e.message)
    }

    // ── 6. Add user as full admin to the group ────────────────────
    let userEntity = null
    if (username) {
      try {
        userEntity = await client.getEntity(username.replace('@', ''))
        await client.invoke(
          new Api.channels.InviteToChannel({ channel: groupPeer, users: [userEntity] })
        )
        await client.invoke(
          new Api.channels.EditAdmin({
            channel:     groupPeer,
            userId:      userEntity,
            adminRights: fullAdmin(),
            rank:        'Founder',
          })
        )
        log('You have been added as group admin')
      } catch (e) {
        log(`Could not add ${username} — join via invite link`)
        console.error('Add user error:', e.message)
      }
    }

    // ── 7. Create announcement channel ────────────────────────────
    log('Setting welcome message...')
    const channelResult = await client.invoke(
      new Api.channels.CreateChannel({
        title:     `${token.name} | $${token.ticker} ANN`,
        about:     `Official announcements for ${token.name} ($${token.ticker})`,
        megagroup: false,
        broadcast: true,
      })
    )
    const channel     = channelResult.chats[0]
    const channelPeer = new Api.InputChannel({
      channelId:  channel.id,
      accessHash: channel.accessHash,
    })

    // Set channel photo too
    if (token.logo) {
      try {
        const file = await uploadImageFromUrl(client, token.logo)
        await client.invoke(
          new Api.channels.EditPhoto({
            channel: channelPeer,
            photo:   new Api.InputChatUploadedPhoto({ file }),
          })
        )
      } catch {}
    }

    // Generate group invite link
    const groupInvite = await client.invoke(
      new Api.messages.ExportChatInvite({ peer: groupPeer })
    )

    // Safeguard verify link for the group
    const safeguardLink = safeguardEntity
      ? `https://t.me/SafeguardRobot?start=verify_${group.id}`
      : groupInvite.link

    // Send banner + verify button to channel
    const welcomeCaption =
      `🕯 *Welcome to ${token.name}* \\($${token.ticker}\\)\n\n` +
      `CA: \`${ca}\`\n\n` +
      `Click below to verify and join the community\\.`

    const verifyButton = new Api.ReplyInlineMarkup({
      rows: [
        new Api.KeyboardButtonRow({
          buttons: [
            new Api.KeyboardButtonUrl({
              text: '✅ Verify & Join',
              url:  safeguardLink,
            }),
          ],
        }),
      ],
    })

    if (token.logo) {
      try {
        const imgFile = await uploadImageFromUrl(client, token.logo)
        await client.sendFile(channelPeer, {
          file:        imgFile,
          caption:     welcomeCaption,
          parseMode:   'md',
          buttons:     verifyButton,
          forceDocument: false,
        })
      } catch {
        // Fallback: text-only message
        await client.sendMessage(channelPeer, {
          message:   welcomeCaption,
          parseMode: 'md',
          buttons:   verifyButton,
        })
      }
    } else {
      await client.sendMessage(channelPeer, {
        message:   welcomeCaption,
        parseMode: 'md',
        buttons:   verifyButton,
      })
    }
    log('Welcome message set')

    // ── 8. Add user as admin to channel too ───────────────────────
    if (userEntity) {
      try {
        await client.invoke(
          new Api.channels.InviteToChannel({ channel: channelPeer, users: [userEntity] })
        )
        await client.invoke(
          new Api.channels.EditAdmin({
            channel:     channelPeer,
            userId:      userEntity,
            adminRights: fullAdmin(),
            rank:        'Founder',
          })
        )
      } catch (e) {
        console.error('Add user to channel error:', e.message)
      }
    }

    // Channel invite link
    const channelInvite = await client.invoke(
      new Api.messages.ExportChatInvite({ peer: channelPeer })
    )

    log('Generating invite link...')
    log('Engagement network ready')

    // ── 9. Leave both (your account disappears) ───────────────────
    try {
      await client.invoke(new Api.channels.LeaveChannel({ channel: groupPeer }))
    } catch (e) { console.error('Leave group error:', e.message) }

    try {
      await client.invoke(new Api.channels.LeaveChannel({ channel: channelPeer }))
    } catch (e) { console.error('Leave channel error:', e.message) }

    await client.disconnect()

    return res.json({
      status:       'success',
      token,
      inviteLink:   channelInvite.link,   // share the channel link
      groupLink:    groupInvite.link,
      steps,
    })

  } catch (err) {
    console.error('Build error:', err.message)
    if (client) await client.disconnect().catch(() => {})
    res.status(500).json({ error: err.message, steps })
  }
})

module.exports = router
