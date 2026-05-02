require('dotenv').config()
const express = require('express')
const cors    = require('cors')

const tokenRoute = require('./routes/token')
const buildRoute = require('./routes/build')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_, res) => res.json({ ok: true }))
app.use('/token', tokenRoute)
app.use('/build', buildRoute)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`CandleTG server running on :${PORT}`))
