import { useState } from 'react'
import './App.css'

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  })[char])
}

function makeWebsite(prompt) {
  const safe = escapeHTML(prompt)
  const title = prompt.trim().split(/\s+/).slice(0, 5).join(' ')
  const safeTitle = escapeHTML(title || 'My Website')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif;background:#0b1020;color:white}
nav{padding:22px 7%;display:flex;justify-content:space-between;
align-items:center;background:#111a30}
nav strong{font-size:22px;color:#a78bfa}
nav a{color:white;text-decoration:none}
.hero{text-align:center;padding:100px 20px 75px;
background:linear-gradient(135deg,#19143d,#101b36)}
h1{font-size:clamp(35px,7vw,65px);margin:0 0 20px}
p{color:#c2c9db;line-height:1.7}
.content{max-width:850px;margin:auto;padding:55px 20px}
.card{background:#17223b;padding:25px;border-radius:15px;
margin:15px 0;border:1px solid #394568}
button{background:#8b5cf6;color:white;border:0;padding:15px 25px;
border-radius:9px;font-weight:bold;cursor:pointer}
footer{text-align:center;padding:35px;background:#10182b;color:#aaa}
</style>
</head>
<body>
<nav><strong>${safeTitle}</strong><a href="#about">About</a></nav>
<section class="hero">
<h1>${safeTitle}</h1>
<p>Welcome to your new website. Created with TEJA AI STUDIO.</p>
<button onclick="document.getElementById('about').scrollIntoView({behavior:'smooth'})">Explore Now</button>
</section>
<section class="content" id="about">
<div class="card"><h2>Your Project</h2><p>${safe}</p></div>
<div class="card"><h2>Discover More</h2><p>Build your ideas into reality. This is your generated website starting point.</p></div>
<div class="card"><h2>Get Started</h2><p>Customize this website with your own content and features.</p></div>
</section>
<footer>Made with TEJA AI STUDIO · 2026</footer>
</body>
</html>`
}

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [platform, setPlatform] = useState('Website')
  const [html, setHtml] = useState('')
  const [status, setStatus] = useState('')
  const [projects, setProjects] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('teja-projects') || '[]')
    } catch {
      return []
    }
  })

  function generate() {
    if (!prompt.trim()) {
      setStatus('Please describe your application first.')
      return
    }

    if (platform !== 'Website') {
      setStatus('The first working generator currently supports websites. Android and game builders are future modules.')
      return
    }

    const result = makeWebsite(prompt)
    setHtml(result)
    setStatus('Website generated successfully! Preview it below.')

    const updated = [
      { name: prompt.trim().slice(0, 45), date: new Date().toLocaleString() },
      ...projects
    ].slice(0, 20)

    setProjects(updated)
    localStorage.setItem('teja-projects', JSON.stringify(updated))
  }

  function download() {
    if (!html) return
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'teja-generated-website.html'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="studio">
      <aside className="sidebar">
        <h2>⚡ TEJA <span>AI</span></h2>
        <p className="muted">YOUR CREATIVE WORKSPACE</p>
        <button className="active">✦ Create project</button>
        <button onClick={() => setStatus(`Saved projects: ${projects.length}`)}>▦ My projects</button>
        <button onClick={() => html && setStatus('Your generated HTML is ready to download.')}>⌘ Code workspace</button>
        <div className="sidebottom">
          <b>TEJA AI STUDIO</b>
          <p>Build your imagination.</p>
          <small>Website Generator 1.1</small>
        </div>
      </aside>

      <main>
        <header>
          <div><b>TEJA AI STUDIO</b><p>APPLICATION BUILDER</p></div>
          <span className="online">● READY</span>
        </header>

        <section className="hero">
          <div className="tag">✦ YOUR CREATION STARTS HERE</div>
          <h1>Imagine it.<br/><span>Build it.</span></h1>
          <p>Turn your ideas into working website projects.</p>

          <div className="builder">
            <label>WHAT DO YOU WANT TO BUILD?</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Example: Create a modern social media website with profiles, posts and messaging..."
            />

            <label>CHOOSE YOUR PLATFORM</label>
            <div className="platforms">
              {['Website', 'Android', 'Game', 'iOS'].map(p =>
                <button key={p}
                  className={platform === p ? 'chosen' : ''}
                  onClick={() => setPlatform(p)}>{p}</button>
              )}
            </div>

            <button className="generate" onClick={generate}>
              ✦ Generate my website →
            </button>
            <small>Local website generator · No API key required</small>
          </div>

          {status && <div className="result" role="status">{status}</div>}
        </section>

        {html && (
          <section className="workspace">
            <h2>🚀 Your generated website</h2>
            <div className="workspace-actions">
              <button onClick={download}>⬇ Download HTML</button>
              <button onClick={() => setHtml('')}>Close preview</button>
            </div>
            <iframe
              title="Generated website preview"
              srcDoc={html}
              sandbox="allow-scripts"
              className="preview"
            />
            <h3>Generated source code</h3>
            <pre className="source">{html}</pre>
          </section>
        )}

        <section className="features">
          <h2>Your creative workspace</h2>
          <div className="cards">
            <article><span>🌐</span><h3>Website Builder</h3><p>Generate downloadable HTML websites.</p></article>
            <article><span>📱</span><h3>Android Builder</h3><p>Android generation module planned.</p></article>
            <article><span>🎮</span><h3>Game Builder</h3><p>Game development module planned.</p></article>
            <article><span>🤖</span><h3>AI Engine</h3><p>Real AI API integration planned.</p></article>
          </div>
        </section>

        <section className="saved">
          <h2>My recent projects ({projects.length})</h2>
          {projects.map((item, index) => (
            <div className="saved-item" key={index}>
              <b>{item.name}</b>
              <small>{item.date}</small>
            </div>
          ))}
        </section>

        <footer>© 2026 TEJA AI STUDIO · BUILT FOR CREATORS</footer>
      </main>
    </div>
  )
}
