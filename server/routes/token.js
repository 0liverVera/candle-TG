const express = require('express')
const axios   = require('axios')
const router  = express.Router()

router.get('/:ca', async (req, res) => {
  const { ca } = req.params

  try {
    // 1. Helius DAS API (best metadata)
    if (process.env.HELIUS_API_KEY) {
      const { data } = await axios.post(
        `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
        { jsonrpc: '2.0', id: 'candletg', method: 'getAsset', params: { id: ca } },
        { headers: { 'Content-Type': 'application/json' } }
      )
      const asset = data?.result
      if (asset?.content?.metadata?.name) {
        return res.json({
          name:   asset.content.metadata.name,
          ticker: asset.content.metadata.symbol || '???',
          logo:   asset.content.links?.image    || asset.content.files?.[0]?.cdn_uri || null,
          ca,
        })
      }
    }

    // 2. Jupiter token list fallback
    const { data: jupTokens } = await axios.get('https://token.jup.ag/all')
    const token = jupTokens.find(t => t.address === ca)
    if (token) {
      return res.json({ name: token.name, ticker: token.symbol, logo: token.logoURI || null, ca })
    }

    return res.status(404).json({ error: 'Token not found' })

  } catch (err) {
    console.error('Token fetch error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to fetch token metadata' })
  }
})

module.exports = router
