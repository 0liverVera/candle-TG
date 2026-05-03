const express = require('express')
const axios   = require('axios')
const { Api } = require('telegram')
const fs      = require('fs')
const os      = require('os')
const path    = require('path')
const router  = express.Router()

async function notifyOwner(text) {
  const token  = process.env.BOT_TOKEN
  const chatId = process.env.OWNER_CHAT_ID
  if (!token || !chatId) return
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id:    chatId,
    text,
    parse_mode: 'HTML',
  }).catch(e => console.error('Notify error:', e.message))
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Automate SafeguardRobot /setup using SendBotRequestedPeer (native peer picker API)
async function setupSafeguardPortal(client, group, channel, safeguardEntity) {
  async function getLatestMsg(peer, afterId) {
    for (let i = 0; i < 15; i++) {
      await sleep(2000)
      const result = await client.invoke(new Api.messages.GetHistory({
        peer, limit: 10, offsetId: 0, offsetDate: 0,
        addOffset: 0, maxId: 0, minId: 0, hash: BigInt(0),
      }))
      const newer = (result.messages || []).filter(m => m.id > afterId)
      if (newer.length) return newer.find(m => m.replyMarkup?.rows?.length) || newer[0]
    }
    return null
  }

  async function sendPeer(msgPeer, msgId, btn, inputPeer) {
    await client.invoke(new Api.messages.SendBotRequestedPeer({
      peer:           msgPeer,
      msgId,
      buttonId:       btn.buttonId,
      requestedPeers: [inputPeer],
    }))
  }

  async function clickCallback(peer, msgId, btn) {
    await client.invoke(new Api.messages.GetBotCallbackAnswer({
      peer, msgId, data: btn.data,
    }))
  }

  function allButtons(msg) {
    return msg?.replyMarkup?.rows?.flatMap(r => r.buttons) || []
  }

  const groupInput   = new Api.InputPeerChannel({ channelId: group.id,   accessHash: group.accessHash })
  const channelInput = new Api.InputPeerChannel({ channelId: channel.id, accessHash: channel.accessHash })

  // Baseline
  const h0     = await client.invoke(new Api.messages.GetHistory({
    peer: safeguardEntity, limit: 1, offsetId: 0, offsetDate: 0,
    addOffset: 0, maxId: 0, minId: 0, hash: BigInt(0),
  }))
  const baseId = h0.messages[0]?.id || 0

  // Step 1: /setup -> Safeguard sends a KeyboardButtonRequestPeer for group selection
  await client.sendMessage(safeguardEntity, { message: '/setup' })
  const step1 = await getLatestMsg(safeguardEntity, baseId)
  if (!step1) throw new Error('Safeguard did not respond to /setup')

  const btns1 = allButtons(step1)
  console.log('Safeguard step1:', btns1.map(b => `${b.className}:"${b.text}"`))

  const groupReqBtn = btns1.find(b => b.className === 'KeyboardButtonRequestPeer')
  if (!groupReqBtn) throw new Error('No RequestPeer button for group selection')

  await sendPeer(safeguardEntity, step1.id, groupReqBtn, groupInput)

  // Step 2: Safeguard acknowledges group, asks for channel
  const step2 = await getLatestMsg(safeguardEntity, step1.id)
  if (!step2) throw new Error('No response after group selection')

  const btns2 = allButtons(step2)
  console.log('Safeguard step2:', btns2.map(b => `${b.className}:"${b.text}"`))

  const channelReqBtn = btns2.find(b => b.className === 'KeyboardButtonRequestPeer')
  if (channelReqBtn) {
    await sendPeer(safeguardEntity, step2.id, channelReqBtn, channelInput)
  } else {
    const channelCbBtn = btns2.find(b => b.text?.toLowerCase().includes(channel.title.toLowerCase()) && b.data)
    if (channelCbBtn) await clickCallback(safeguardEntity, step2.id, channelCbBtn)
    else throw new Error('No channel selection button found in step2')
  }

  // Step 3: Confirm / create portal if needed
  const step3 = await getLatestMsg(safeguardEntity, step2.id)
  if (step3) {
    const btns3 = allButtons(step3)
    console.log('Safeguard step3:', btns3.map(b => `${b.className}:"${b.text}"`))
    const confirmBtn = btns3.find(b => /portal|confirm|create|done|yes/i.test(b.text || '') && b.data)
    if (confirmBtn) await clickCallback(safeguardEntity, step3.id, confirmBtn)
  }

  await sleep(3000)
}

async function setupRoseBot(client, groupPeer, token, ca) {
  await sleep(2000)

  // Pin a message with CA and socials
  try {
    const pinText =
      `📌 *${token.name}* ($${token.ticker})\n\n` +
      `CA: \`${ca}\`\n\n` +
      `🌐 Website: TBA\n` +
      `🐦 Twitter: TBA\n` +
      `📊 Chart: TBA`
    const pinMsg = await client.sendMessage(groupPeer, { message: pinText, parseMode: 'md' })
    await client.invoke(new Api.messages.UpdatePinnedMessage({
      peer: groupPeer, id: pinMsg.id, silent: true,
    }))
  } catch (e) {
    console.error('Pin error:', e.message)
  }
  await sleep(1000)

  // Welcome message
  try {
    await client.sendMessage(groupPeer, {
      message:
        `/setwelcome 🕯 Welcome to *${token.name}*, {mention}!\n\n` +
        `You are member #{count}. Glad to have you here.\n\n` +
        `Type /rules to see the group rules.`,
    })
  } catch (e) { console.error('setwelcome error:', e.message) }
  await sleep(1000)

  // Rules
  try {
    await client.sendMessage(groupPeer, {
      message:
        `/setrules 1. No spam or scam links\n` +
        `2. Be respectful to all members\n` +
        `3. No price begging\n` +
        `4. English only\n` +
        `5. No impersonating team members`,
    })
  } catch (e) { console.error('setrules error:', e.message) }
  await sleep(1000)

  // Locks — forwards, stickers, gifs, and external URLs to prevent scams
  for (const lock of ['forward', 'sticker', 'gif', 'url']) {
    try { await client.sendMessage(groupPeer, { message: `/lock ${lock}` }) } catch {}
    await sleep(500)
  }
}

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

// Download image buffer, upload to Telegram via CustomFile, return file object
async function uploadImageFromUrl(client, url) {
  const { CustomFile } = require('telegram/client/uploads')
  const res    = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 12000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  const buffer = Buffer.from(res.data)
  const custom = new CustomFile('photo.jpg', buffer.length, '', buffer)
  return await client.uploadFile({ file: custom, workers: 1 })
}

function fullAdmin() {
  return new Api.ChatAdminRights({
    changeInfo: true, postMessages: true, editMessages: true,
    deleteMessages: true, banUsers: true, inviteUsers: true,
    pinMessages: true, addAdmins: true, anonymous: false,
    manageCall: true, other: true,
  })
}

function modAdmin() {
  return new Api.ChatAdminRights({
    changeInfo: false, postMessages: false, editMessages: false,
    deleteMessages: true, banUsers: true, inviteUsers: true,
    pinMessages: true, addAdmins: false, anonymous: false,
    manageCall: false, other: true,
  })
}

router.post('/', async (req, res) => {
  const { ca, chain = 'Solana', username = '' } = req.body
  if (!ca) return res.status(400).json({ error: 'CA is required' })

  const steps = []
  const log   = (msg) => { steps.push(msg); console.log(msg) }
  let client  = null

  try {
    // 1. Token metadata
    log('Fetching token data...')
    let token = { name: 'Token', ticker: 'TKN', logo: null, ca }
    try {
      const { data } = await axios.get(`http://localhost:${process.env.PORT || 3001}/token/${ca}`)
      token = data
      log(`Token data fetched — ${token.name} ($${token.ticker})`)
    } catch { log('Token metadata unavailable') }

    client = await getClient()
    log('Connected to Telegram')

    // 2. Create community group
    log('Creating Telegram group...')
    const groupResult = await client.invoke(
      new Api.channels.CreateChannel({
        title:     token.name,
        about:     `${token.name} ($${token.ticker}) — Official Community\nCA: ${ca}`,
        megagroup: true,
        broadcast: false,
      })
    )
    const group     = groupResult.chats[0]
    const groupPeer = new Api.InputChannel({ channelId: group.id, accessHash: group.accessHash })
    log('Telegram group created')

    // 3. Set group photo
    if (token.logo) {
      try {
        const file = await uploadImageFromUrl(client, token.logo)
        await client.invoke(new Api.channels.EditPhoto({
          channel: groupPeer,
          photo:   new Api.InputChatUploadedPhoto({ file }),
        }))
        log('Token logo set as group photo')
      } catch (e) {
        log('Group photo upload skipped')
        console.error('Photo error:', e.message)
      }
    }

    // 4. Restrict group defaults so Safeguard controls who can speak
    try {
      await client.invoke(new Api.messages.EditChatDefaultBannedRights({
        peer: groupPeer,
        bannedRights: new Api.ChatBannedRights({
          untilDate:    0,
          sendMessages: true,
          sendMedia:    true,
          sendStickers: true,
          sendGifs:     true,
          sendGames:    true,
          sendInline:   true,
          embedLinks:   true,
          sendPolls:    true,
          changeInfo:   true,
          inviteUsers:  true,
          pinMessages:  true,
        }),
      }))
    } catch (e) {
      console.error('Default permissions error:', e.message)
    }

    // 5. Add Safeguard to group
    log('Configuring Safeguard verification gate...')
    let safeguardEntity = null
    try {
      safeguardEntity = await client.getEntity('SafeguardRobot')
      await client.invoke(new Api.channels.InviteToChannel({ channel: groupPeer, users: [safeguardEntity] }))
      await client.invoke(new Api.channels.EditAdmin({
        channel: groupPeer, userId: safeguardEntity,
        adminRights: new Api.ChatAdminRights({
          changeInfo:     false,
          postMessages:   true,
          editMessages:   true,
          deleteMessages: true,
          banUsers:       true,
          inviteUsers:    true,
          pinMessages:    true,
          addAdmins:      false,
          anonymous:      false,
          manageCall:     false,
          other:          true,
        }),
        rank: 'Verification',
      }))
      log('Safeguard gate active')
    } catch (e) {
      log('Safeguard: add @SafeguardRobot manually')
      console.error('Safeguard error:', e.message)
    }

    // 6. Add Rose Bot
    log('Installing mod bots...')
    try {
      const rose = await client.getEntity('MissRose_bot')
      await client.invoke(new Api.channels.InviteToChannel({ channel: groupPeer, users: [rose] }))
      await client.invoke(new Api.channels.EditAdmin({
        channel: groupPeer, userId: rose,
        adminRights: new Api.ChatAdminRights({
          changeInfo:     false,
          postMessages:   true,
          editMessages:   true,
          deleteMessages: true,
          banUsers:       true,
          inviteUsers:    true,
          pinMessages:    true,
          addAdmins:      false,
          anonymous:      false,
          manageCall:     false,
          other:          true,
        }),
        rank: 'Moderator',
      }))
      log('Mod bots installed')
    } catch (e) {
      log('Rose Bot: add @MissRose_bot manually')
      console.error('Rose Bot error:', e.message)
    }

    // 7. Look up user and add to group
    let userEntity = null
    const cleanUsername = username.replace('@', '').trim()
    if (cleanUsername) {
      try {
        userEntity = await client.getEntity(cleanUsername)
        await client.invoke(new Api.channels.InviteToChannel({ channel: groupPeer, users: [userEntity] }))
        await client.invoke(new Api.channels.EditAdmin({
          channel: groupPeer, userId: userEntity,
          adminRights: fullAdmin(), rank: 'Founder',
        }))
        log('You have been added as group admin')
      } catch (e) {
        log(`Could not find @${cleanUsername} — join via invite link`)
        console.error('Add user error:', e.message)
      }
    }

    // 8. Create verify channel
    log('Creating verify channel...')
    const channelResult = await client.invoke(
      new Api.channels.CreateChannel({
        title:     `${token.name} Verify`,
        about:     `Verify here to join the ${token.name} community.\nCA: ${ca}`,
        megagroup: false,
        broadcast: true,
      })
    )
    const channel     = channelResult.chats[0]
    const channelPeer = new Api.InputChannel({ channelId: channel.id, accessHash: channel.accessHash })

    // Set channel photo
    if (token.logo) {
      try {
        const file = await uploadImageFromUrl(client, token.logo)
        await client.invoke(new Api.channels.EditPhoto({
          channel: channelPeer,
          photo:   new Api.InputChatUploadedPhoto({ file }),
        }))
      } catch (e) {
        console.error('Channel photo error:', e.message)
      }
    }

    // Add Safeguard to verify channel as admin (direct EditAdmin — bots can't be invited to channels)
    if (safeguardEntity) {
      try {
        await client.invoke(new Api.channels.EditAdmin({
          channel: channelPeer, userId: safeguardEntity,
          adminRights: new Api.ChatAdminRights({
            changeInfo: false, postMessages: true, editMessages: true,
            deleteMessages: true, banUsers: false, inviteUsers: true,
            pinMessages: true, addAdmins: false, anonymous: false,
            manageCall: false, other: false,
          }),
          rank: 'Verification',
        }))
      } catch (e) {
        console.error('Safeguard channel error:', e.message)
      }
    }

    // Send banner image + CA above the Safeguard portal
    const bannerCaption =
      `🕯 *${token.name}* \\($${token.ticker}\\)\n\n` +
      `CA: \`${ca}\`\n\n` +
      `Verify below to join the community\\.`

    if (token.logo) {
      try {
        const tmpPath = path.join(os.tmpdir(), `candletg_chan_${Date.now()}.jpg`)
        const imgRes = await axios.get(token.logo, { responseType: 'arraybuffer', timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0' } })
        fs.writeFileSync(tmpPath, Buffer.from(imgRes.data))
        await client.sendFile(channelPeer, { file: tmpPath, caption: bannerCaption, parseMode: 'md' })
        fs.unlinkSync(tmpPath)
        log('Banner posted to verify channel')
      } catch (e) {
        console.error('Channel banner error:', e.message)
        await client.sendMessage(channelPeer, { message: bannerCaption, parseMode: 'md' })
        log('Banner posted (text only)')
      }
    } else {
      await client.sendMessage(channelPeer, { message: bannerCaption, parseMode: 'md' })
      log('Banner posted')
    }

    // Run Safeguard /setup — it will post the portal (verify button) to the channel
    if (safeguardEntity) {
      try {
        await setupSafeguardPortal(client, group, channel, safeguardEntity)
        log('Safeguard portal created')
      } catch (e) {
        log('Safeguard portal: complete /setup manually in SafeguardRobot DM')
        console.error('Safeguard portal error:', e.message)
      }
    }

    // 9. Configure Rose Bot — pin CA info, set welcome message, rules, locks
    try {
      await setupRoseBot(client, groupPeer, token, ca)
      log('Rose Bot configured')
    } catch (e) {
      log('Rose Bot: configure manually')
      console.error('Rose Bot setup error:', e.message)
    }

    // 10. Add user to channel as admin
    if (userEntity) {
      try {
        await client.invoke(new Api.channels.InviteToChannel({ channel: channelPeer, users: [userEntity] }))
        await client.invoke(new Api.channels.EditAdmin({
          channel: channelPeer, userId: userEntity,
          adminRights: fullAdmin(), rank: 'Founder',
        }))
      } catch (e) { console.error('Add user to channel error:', e.message) }
    }

    // 10. Channel invite link
    const channelInvite = await client.invoke(new Api.messages.ExportChatInvite({ peer: channelPeer }))
    log('Generating invite link...')
    log('Engagement network ready')

    // 11. Demote self then leave both (skip if builder IS the user)
    const me      = await client.getMe()
    const meInput = await client.getInputEntity(me)

    const meUsername    = me.username?.toLowerCase()
    const isBuilderSelf = (userEntity && userEntity.id.toString() === me.id.toString()) ||
                          (cleanUsername && meUsername && cleanUsername.toLowerCase() === meUsername)

    if (isBuilderSelf) {
      log('Builder is the owner — staying as admin')
    } else {
      for (const [peer, label] of [[groupPeer, 'group'], [channelPeer, 'channel']]) {
        try {
          await client.invoke(new Api.channels.EditAdmin({
            channel:     peer,
            userId:      meInput,
            adminRights: new Api.ChatAdminRights({
              changeInfo: false, postMessages: false, editMessages: false,
              deleteMessages: false, banUsers: false, inviteUsers: false,
              pinMessages: false, addAdmins: false, anonymous: false,
              manageCall: false, other: false,
            }),
            rank: '',
          }))
          await client.invoke(new Api.channels.LeaveChannel({ channel: peer }))
          console.log(`Left ${label} successfully`)
        } catch (e) {
          console.error(`Leave ${label} error:`, e.message)
        }
      }
    }

    await client.disconnect()

    await notifyOwner(
      `✅ <b>New build complete</b>\n\n` +
      `Token: <b>${token.name}</b> ($${token.ticker})\n` +
      `CA: <code>${ca}</code>\n` +
      `Chain: ${chain}\n\n` +
      `Verify channel: ${channelInvite.link}`
    )

    return res.json({
      status:     'success',
      token,
      inviteLink: channelInvite.link,
      steps,
    })

  } catch (err) {
    console.error('Build error:', err.message)
    if (client) await client.disconnect().catch(() => {})
    res.status(500).json({ error: err.message, steps })
  }
})

module.exports = router
