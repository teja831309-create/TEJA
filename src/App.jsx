import { useEffect, useRef, useState } from 'react'
import './App.css'

async function readAIStream(response, onText) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let completeText = ''

  function processLine(line) {
    if (!line.startsWith('data:')) return

    const data = line.slice(5).trim()

    if (!data || data === '[DONE]') return

    try {
      const parsed = JSON.parse(data)

      const chunk =
        parsed.response ||
        parsed.choices?.[0]?.delta?.content ||
        parsed.choices?.[0]?.message?.content ||
        parsed.output_text ||
        ''

      if (typeof chunk === 'string' && chunk) {
        completeText += chunk
        onText(completeText)
      }
    } catch {
      // Ignore incomplete or invalid SSE events.
    }
  }

  while (true) {
    const { value, done } = await reader.read()

    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      processLine(line.trim())
    }
  }

  buffer += decoder.decode()

  if (buffer.trim()) {
    processLine(buffer.trim())
  }

  return completeText
}

const languages = [
  ['English (India)', 'en-IN'],
  ['English (US)', 'en-US'],
  ['Hindi', 'hi-IN'],
  ['Telugu', 'te-IN'],
  ['Tamil', 'ta-IN'],
  ['Kannada', 'kn-IN'],
  ['Malayalam', 'ml-IN'],
  ['Bengali', 'bn-IN'],
  ['Marathi', 'mr-IN'],
  ['Gujarati', 'gu-IN'],
  ['Urdu', 'ur-IN'],
  ['Spanish', 'es-ES'],
  ['French', 'fr-FR'],
  ['German', 'de-DE'],
  ['Arabic', 'ar-SA'],
  ['Chinese', 'zh-CN'],
  ['Japanese', 'ja-JP'],
  ['Korean', 'ko-KR'],
  ['Portuguese', 'pt-BR'],
  ['Russian', 'ru-RU']
]

const initialMessage = {
  role: 'model',
  text: 'Hello! I am TEJA AI STUDIO. Ask me anything, upload a photo, or use your voice. How can I help you today?'
}

export default function App() {
  const [page, setPage] = useState('AI Chat')
  const [messages, setMessages] = useState([initialMessage])
  const [message, setMessage] = useState('')
  const [image, setImage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState(false)
  const [language, setLanguage] = useState('en-IN')
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [health, setHealth] = useState('checking')
  const [autoSpeak, setAutoSpeak] = useState(false)
  const fileRef = useRef(null)
  const recognitionRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setHealth(data.status === 'ok' ? 'online' : 'offline')
      .catch(() => setHealth('offline'))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  function newChat() {
    window.speechSynthesis?.cancel()
    setMessages([initialMessage])
    setMessage('')
    setImage(null)
    setError('')
    setPage('AI Chat')
  }

  function chooseImage(file) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG or WEBP image.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be smaller than 8 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      setImage({
        preview: result,
        data: result.split(',')[1],
        mimeType: file.type
      })
      setError('')
    }
    reader.onerror = () => setError('Could not read this image.')
    reader.readAsDataURL(file)
  }

  
async function sendMessage() {
  const question = message.trim()

  if ((!question && !image) || busy) return

  const userMessage = {
    role: 'user',
    text: question || 'Please describe this image.',
    preview: image?.preview
  }

  const previousHistory = messages
    .filter(m => ['user', 'model'].includes(m.role))
    .slice(-12)
    .map(m => ({ role: m.role, text: m.text }))

  const currentImage = image

  setMessages(old => [
    ...old,
    userMessage,
    { role: 'model', text: '', sources: [] }
  ])

  setMessage('')
  setBusy(true)
  setError('')
  setImage(null)

  function updateAnswer(text) {
    setMessages(old => {
      const updated = [...old]
      const last = updated.length - 1

      updated[last] = {
        ...updated[last],
        text
      }

      return updated
    })
  }

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage.text,
        history: previousHistory,
        image: currentImage
          ? {
              data: currentImage.data,
              mimeType: currentImage.mimeType
            }
          : undefined,
        search
      })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || `Server error: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('Streaming is unavailable.')
    }

    let answer = ''

    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      answer = await readAIStream(response, updateAnswer)
    } else {
      const data = await response.json()
      answer = data.text || ''
    }

    if (!answer.trim()) {
      throw new Error('AI returned an empty response.')
    }

    updateAnswer(answer)

    if (autoSpeak) speak(answer)

  } catch (err) {
    setError(err.message || 'Could not connect to TEJA AI.')

    updateAnswer(
      'I could not complete that request. Please check the server connection and try again.'
    )

  } finally {
    setBusy(false)
  }
}


    const userMessage = {
      role: 'user',
      text: question || 'Please describe this image.',
      preview: image?.preview
    }

    const previousHistory = messages
      .filter(m => ['user', 'model'].includes(m.role))
      .slice(-20)
      .map(m => ({ role: m.role, text: m.text }))

    setMessages(old => [...old, userMessage])
    setMessage('')
    setBusy(true)
    setError('')

    const currentImage = image
    setImage(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          history: previousHistory,
          image: currentImage
            ? { data: currentImage.data, mimeType: currentImage.mimeType }
            : undefined,
          search
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      const answer = {
        role: 'model',
        text: data.text || 'No answer received.',
        sources: Array.isArray(data.sources) ? data.sources : []
      }

      setMessages(old => [...old, answer])

      if (autoSpeak) speak(answer.text)
    } catch (err) {
      setError(err.message || 'Could not connect to TEJA AI.')
      setMessages(old => [
        ...old,
        {
          role: 'model',
          text: 'I could not complete that request. Please check the server connection and try again.'
        }
      ])
    } finally {
      setBusy(false)
    }
  }

  function startVoice() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!Speech) {
      setError('Speech recognition is unavailable in this browser. Try Chrome.')
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const recognition = new Speech()
    recognition.lang = language
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = event => {
      setListening(false)
      setError(`Voice error: ${event.error}`)
    }
    recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')
      setMessage(transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      setError('Speech playback is unavailable in this browser.')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language
    utterance.rate = 0.96
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel()
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✦</div>
          <div>
            <strong>TEJA AI</strong>
            <small>STUDIO</small>
          </div>
        </div>

        <button className="new-chat" onClick={newChat}>＋ New chat</button>

        <div className="nav-label">WORKSPACE</div>
        {['AI Chat', 'Camera & Vision', 'Research'].map(item => (
          <button
            key={item}
            className={`nav-item ${page === item ? 'active' : ''}`}
            onClick={() => {
              setPage(item)
              if (item === 'Research') setSearch(true)
            }}
          >
            {item === 'AI Chat' ? '◈' : item === 'Camera & Vision' ? '▧' : '◎'}
            <span>{item}</span>
          </button>
        ))}

        <div className="sidebar-bottom">
          <span className={`status-dot ${health}`} />
          {health === 'online' ? 'Backend online' : health === 'checking' ? 'Connecting...' : 'Backend offline'}
          <small>Powered by Google Gemini</small>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand">✦ TEJA AI STUDIO</div>
          <span className="workspace-tag">PERSONAL AI WORKSPACE</span>
          <button className="icon-button" onClick={newChat} title="New chat">＋</button>
        </header>

        <section className="content">
          {page === 'Camera & Vision' && (
            <div className="feature-heading">
              <span className="eyebrow">VISUAL INTELLIGENCE</span>
              <h1>Camera & Vision</h1>
              <p>Upload a photo or capture one, then ask Gemini to understand it.</p>
              <button className="primary" onClick={() => fileRef.current?.click()}>
                ＋ Choose photo or camera
              </button>
            </div>
          )}

          {page === 'Research' && (
            <div className="feature-heading">
              <span className="eyebrow">WEB-GROUNDED AI</span>
              <h1>Research mode</h1>
              <p>Ask a question with Google Search grounding enabled. Available sources are shown with the answer.</p>
            </div>
          )}

          {page === 'AI Chat' && messages.length === 1 && (
            <div className="welcome">
              <div className="welcome-symbol">✦</div>
              <span className="eyebrow">YOUR AI WORKSPACE</span>
              <h1>What can I help you with?</h1>
              <p>Ask questions, explore ideas, understand images and create something new.</p>
              <div className="suggestions">
                {[
                  'Explain a difficult topic simply',
                  'Help me build an Android app',
                  'Write and debug some code',
                  'Research a topic with sources'
                ].map(item => (
                  <button key={item} onClick={() => setMessage(item)}>{item} ↗</button>
                ))}
              </div>
            </div>
          )}

          <div className="chat-area">
            {messages.map((item, index) => (
              <article className={`message ${item.role}`} key={index}>
                <div className="message-avatar">
                  {item.role === 'user' ? 'Y' : '✦'}
                </div>
                <div className="message-body">
                  <div className="message-name">
                    {item.role === 'user' ? 'You' : 'TEJA AI'}
                  </div>
                  {item.preview && (
                    <img className="photo-preview" src={item.preview} alt="Uploaded image" />
                  )}
                  <p>{item.text}</p>

                  {item.sources?.length > 0 && (
                    <div className="sources">
                      <strong>Sources</strong>
                      {item.sources.map((source, i) => (
                        <a
                          key={i}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.title || 'Open source'} ↗
                        </a>
                      ))}
                    </div>
                  )}

                  {item.role === 'model' && index !== 0 && (
                    <div className="message-actions">
                      <button onClick={() => speak(item.text)}>🔊 Listen</button>
                      <button onClick={() => navigator.clipboard?.writeText(item.text)}>Copy</button>
                    </div>
                  )}
                </div>
              </article>
            ))}
            {busy && (
              <div className="loading-row">
                <span className="loader" />
                TEJA AI is thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError('')}>Dismiss</button>
            </div>
          )}

          {image && (
            <div className="attachment-preview">
              <img src={image.preview} alt="Selected attachment" />
              <span>Image ready to send</span>
              <button onClick={() => setImage(null)}>✕</button>
            </div>
          )}

          <div className="composer">
            <textarea
              value={message}
              onChange={event => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message TEJA AI..."
              rows={2}
              disabled={busy}
            />

            <div className="composer-tools">
              <div className="tool-group">
                <button onClick={() => fileRef.current?.click()} title="Attach image">＋ Image</button>
                <button
                  className={listening ? 'recording' : ''}
                  onClick={startVoice}
                  title="Voice input"
                >
                  {listening ? '■ Stop' : '🎙 Voice'}
                </button>
                <select
                  aria-label="Voice language"
                  value={language}
                  onChange={event => setLanguage(event.target.value)}
                >
                  {languages.map(([name, code]) => (
                    <option value={code} key={code}>{name}</option>
                  ))}
                </select>
                <label className="search-toggle">
                  <input
                    type="checkbox"
                    checked={search}
                    onChange={event => setSearch(event.target.checked)}
                  />
                  Web search
                </label>
                <label className="search-toggle">
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={event => setAutoSpeak(event.target.checked)}
                  />
                  Auto voice
                </label>
              </div>
              <button className="send-button" onClick={sendMessage} disabled={busy || (!message.trim() && !image)}>
                {busy ? 'Thinking...' : 'Send ↑'}
              </button>
            </div>
            <div className="composer-note">
              AI can make mistakes. Verify important information.
              <button onClick={stopSpeaking}>Stop voice</button>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            hidden
            onChange={event => {
              chooseImage(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </section>
      </main>
    </div>
  )
}
