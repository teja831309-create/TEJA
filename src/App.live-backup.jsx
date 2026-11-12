import { useState } from 'react'
import './App.css'

const pages = [
  'AI Chat', 'Website Builder', 'AI Image Studio',
  'Camera & Vision', 'Code Studio', 'App Builder',
  'Game Studio', 'Research', 'Documents'
]

export default function App() {
  const [page, setPage] = useState('AI Chat')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    { role: 'TEJA AI', text: 'Welcome to TEJA AI STUDIO! What would you like to create today?' }
  ])
  const [prompt, setPrompt] = useState('')
  const [website, setWebsite] = useState('')
  const [image, setImage] = useState('')

  function send() {
    if (!message.trim()) return
    setMessages(old => [...old,
      { role: 'You', text: message },
      { role: 'TEJA AI', text: 'Your request is ready! Connect an AI service to enable real AI responses.' }
    ])
    setMessage('')
  }

  function voice() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Speech) {
      alert('Voice recognition is not supported. Try Chrome.')
      return
    }
    const recognition = new Speech()
    recognition.lang = 'en-IN'
    recognition.onresult = e => setMessage(e.results[0][0].transcript)
    recognition.start()
  }

  function speak(text) {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      speechSynthesis.speak(new SpeechSynthesisUtterance(text))
    }
  }

  function generateWebsite() {
    const safe = prompt.replace(/[&<>"']/g, '')
    const html = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>My Website</title>
<style>
body{font-family:Arial;background:#10152a;color:white;padding:50px}
h1{font-size:45px}button{padding:15px;background:#7865ff;color:white;border:0;border-radius:10px}
</style></head><body><h1>Welcome</h1><p>${safe}</p><button>Get Started</button></body></html>`
    setWebsite(html)
  }

  function downloadWebsite() {
    const blob = new Blob([website], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'teja-website.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>✦ TEJA AI STUDIO</h2>
        <button onClick={() => {
          setPage('AI Chat')
          setMessages([{ role: 'TEJA AI', text: 'New conversation started!' }])
        }}>＋ New Chat</button>
        <p className="nav-title">WORKSPACE</p>
        {pages.map(p => (
          <button key={p} className={`nav-item ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
        ))}
        <small>Your ideas. Your studio.</small>
      </aside>

      <main className="main-area">
        <header>✦ TEJA AI STUDIO <span>● Workspace</span></header>
        <section className="content">
          <h1>{page}</h1>
          <p className="subtitle">Welcome to your creative AI workspace.</p>

          {page === 'AI Chat' && <>
            <div className="chat-area">
              {messages.map((m, i) => (
                <div className="message" key={i}>
                  <b>{m.role}</b>
                  <p>{m.text}</p>
                  {m.role === 'TEJA AI' && <button onClick={() => speak(m.text)}>🔊 Listen</button>}
                </div>
              ))}
            </div>
            <div className="composer">
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message TEJA AI STUDIO..." />
              <div>
                <button onClick={voice}>🎙 Voice</button>
                <button className="primary" onClick={send}>Send ↑</button>
              </div>
            </div>
          </>}

          {page === 'Website Builder' && <div className="panel">
            <h2>Create your website</h2>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe your website..." />
            <button className="primary" onClick={generateWebsite}>✦ Generate website</button>
            {website && <>
              <h3>Preview</h3>
              <iframe title="Website preview" srcDoc={website} />
              <button onClick={downloadWebsite}>Download HTML ↓</button>
            </>}
          </div>}

          {page === 'AI Image Studio' && <div className="panel">
            <h2>AI Image Studio</h2>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe the image you want..." />
            <p>Image generation will be enabled after connecting an image AI service.</p>
          </div>}

          {page === 'Camera & Vision' && <div className="panel">
            <h2>Camera and Gallery</h2>
            <p>Capture a photo or choose an image.</p>
            <input type="file" accept="image/*" capture="environment" onChange={e => {
              const f = e.target.files?.[0]
              if (f) setImage(URL.createObjectURL(f))
            }} />
            {image && <img className="photo-preview" src={image} alt="Selected photo" />}
            <p>Image understanding requires a connected vision AI service.</p>
          </div>}

          {['Code Studio', 'App Builder', 'Game Studio', 'Research', 'Documents'].includes(page) && <div className="panel">
            <h2>{page} workspace</h2>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={`Describe what you want to create in ${page}...`} />
            <p>This workspace is ready for its next development stage.</p>
          </div>}

          <footer>TEJA AI STUDIO · Built for creativity</footer>
        </section>
      </main>
    </div>
  )
}
