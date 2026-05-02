const express = require('express')
const axios   = require('axios')
const router  = express.Router()

// Fetch Solana token metadata by CA
// Uses Jupiter price API (no key needed) + Helius for full metadata
router.get('/:ca', async (req, res) => {
  const { ca } = req.params

  try {
    // 1. Try Helius DAS API first (richest metadata)
    if (process.env.HELIUS_API_KEY) {
      const helius = await axios.post(
        `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
        {
          jsonrpc: '2.0',
          id: 'candletg',
          method: 'getAsset',
          params: { id: ca },
        }
      )
      const asset = helius.data?.result
      if (asset) {
        return res.json({
          name:    asset.content?.metadata?.name    || 'Unknown',
          ticker:  asset.content?.metadata?.symbol  || '???',
          logo:    asset.content?.links?.image      || null,
          ca,
        })
      }
    }

    // 2. Fallback: Jupiter token list
    const jupList = await axios.get(
      `https://token.jup.ag/all`
    )
    const token = jupList.data.find(t => t.address === ca)
    if (token) {
      return res.json({
        name:   token.name,
        ticker: token.symbol,
        logo:   token.logoURI || null,
        ca,
      })
    }

    // 3. Fallback: Birdeye public endpoint (no key)
    const bird = await axios.get(
      `https://public-api.birdeye.so/public/tokenlist?address=${ca}`,
      { headers: { 'X-Chain': 'solana' } }
    )
    const bToken = bird.data?.data?.tokens?.[0]
    if (bToken) {
      return res.json({
        name:   bToken.name,
        ticker: bToken.symbol,
        logo:   bToken.logoURI || null,
        ca,
      })
    }

    return res.status(404).json({ error: 'Token not found' })

  } catch (err) {
    console.error('Token fetch error:', err.message)
    res.status(500).json({ error: 'Failed to fetch token metadata' })
  }
})

module.exports = router
