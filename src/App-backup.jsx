import { useState } from 'react'
import './App.css'

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [platform, setPlatform] = useState('Website')
  const [project, setProject] = useState('')
  const [loading, setLoading] = useState(false)

  function generate() {
    if (!prompt.trim()) {
      alert('Describe your app first!')
      return
    }
    setLoading(true)
    setProject(prompt)
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div className="studio">
      <aside className="sidebar">
        <h2>⚡ TEJA <span>AI</span></h2>
        <p className="muted">YOUR CREATIVE WORKSPACE</p>
        <button className="active">✦ Create project</button>
        <button>▦ My projects</button>
        <button>⌘ Code workspace</button>
        <button>◈ Templates</button>
        <button>⚙ Settings</button>
        <div className="sidebottom">
          <b>TEJA AI STUDIO</b>
          <p>Build your imagination.</p>
          <small>Version 1.0 · Local preview</small>
        </div>
      </aside>

      <main>
        <header>
          <div><b>TEJA AI STUDIO</b><p>AI APPLICATION BUILDER</p></div>
          <span className="online">● ONLINE</span>
        </header>

        <section className="hero">
          <div className="tag">✦ THE FUTURE OF APP CREATION</div>
          <h1>Imagine it.<br/><span>Build it.</span></h1>
          <p>Turn your ideas into applications with the power of AI.</p>

          <div className="builder">
            <label>WHAT DO YOU WANT TO BUILD?</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your dream app... For example: Create a social media app with reels, chat, stories and profiles."
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
              {loading ? 'Creating workspace...' : '✦ Generate my app →'}
            </button>
            <small>Start creating · No credits required for this local demo</small>
          </div>

          {project && (
            <div className="result">
              <h2>🚀 Project workspace created!</h2>
              <p><b>Project idea:</b> {project}</p>
              <p><b>Platform:</b> {platform}</p>
              <p>Next: Connect an AI coding engine to generate real application code.</p>
            </div>
          )}
        </section>

        <section className="features">
          <h2>Everything starts with an idea.</h2>
          <div className="cards">
            <article><span>🌐</span><h3>Websites</h3><p>Create modern responsive websites.</p></article>
            <article><span>📱</span><h3>Android apps</h3><p>Build mobile application projects.</p></article>
            <article><span>🎮</span><h3>Games</h3><p>Start creating your own games.</p></article>
            <article><span>🤖</span><h3>AI tools</h3><p>Bring intelligent features to your apps.</p></article>
          </div>
        </section>
        <footer>© 2026 TEJA AI STUDIO · BUILT FOR CREATORS</footer>
      </main>
    </div>
  )
}
