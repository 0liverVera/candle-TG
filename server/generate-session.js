require('dotenv').config()
const { TelegramClient } = require('telegram')
const { StringSession }  = require('telegram/sessions')
const input              = require('input')

const apiId   = parseInt(process.env.TG_API_ID)
const apiHash = process.env.TG_API_HASH

if (!apiId || !apiHash) {
  console.error('ERROR: Add TG_API_ID and TG_API_HASH to your .env file first')
  process.exit(1)
}

;(async () => {
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 3,
  })

  await client.start({
    phoneNumber:  async () => await input.text('Your Telegram phone number (with country code, e.g. +49...): '),
    password:     async () => await input.text('2FA password (leave blank if none): '),
    phoneCode:    async () => await input.text('Code Telegram sent you: '),
    onError:      err => console.error(err),
  })

  const session = client.session.save()
  console.log('\n✅ Session string generated. Copy this into your .env as TG_SESSION=\n')
  console.log(session)
  console.log()
  await client.disconnect()
  process.exit(0)
})()
