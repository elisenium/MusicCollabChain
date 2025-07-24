import './Header.css'

function Header({ title = "🎵 Music Collab Chain", subtitle = "Le jeu ultime pour découvrir les collaborations musicales" }) {
  return (
    <header className="header">
      <h1 className="title">{title}</h1>
      <p className="subtitle">{subtitle}</p>
    </header>
  )
}

export default Header
