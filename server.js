import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '15mb' }))

const apiKey = process.env.GEMINI_API_KEY?.trim()

if (!apiKey) {
  console.error('Missing GEMINI_API_KEY in .env')
  process.exit(1)
}

const ai = new GoogleGenAI({ apiKey })

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'TEJA AI STUDIO',
    model: 'gemini-2.5-flash'
  })
})

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], image, search = false } = req.body

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please enter a message.' })
    }

    if (!Array.isArray(history)) {
      return res.status(400).json({ error: 'Invalid chat history.' })
    }

    const contents = history
      .filter(item =>
        ['user', 'model'].includes(item.role) &&
        typeof item.text === 'string'
      )
      .slice(-30)
      .map(item => ({
        role: item.role,
        parts: [{ text: item.text.slice(0, 12000) }]
      }))

    const parts = [{ text: message.trim().slice(0, 12000) }]

    if (image) {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType) ||
        typeof image.data !== 'string' ||
        image.data.length > 11000000
      ) {
        return res.status(400).json({ error: 'Invalid image.' })
      }

      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data
        }
      })
    }

    contents.push({ role: 'user', parts })

    const config = {
      systemInstruction:
        'You are TEJA AI STUDIO, a helpful and accurate AI assistant. Answer clearly and honestly.'
    }

    if (search === true) {
      config.tools = [{ googleSearch: {} }]
    }

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config
    })

    const sources = []
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || []

    for (const chunk of chunks) {
      const web = chunk.web
      if (web?.uri && web.uri.startsWith('https://')) {
        if (!sources.some(source => source.url === web.uri)) {
          sources.push({
            title: web.title || 'Source',
            url: web.uri
          })
        }
      }
    }

    res.json({
      text: result.text || 'The AI returned an empty response.',
      sources
    })
  } catch (error) {
    console.error('Gemini request failed:', error)
    res.status(500).json({
      error: 'AI request failed. Check API access, quota, model availability and network.'
    })
  }
})

const PORT = Number(process.env.PORT) || 3001

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TEJA AI STUDIO backend running on port ${PORT}`)
})
