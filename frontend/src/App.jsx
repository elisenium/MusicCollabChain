import { useState } from 'react'
import ArtistAutocomplete from './components/Autocomplete/ArtistAutocomplete/ArtistAutocomplete'
import './App.css'

function App() {
  const [artist1, setArtist1] = useState('')
  const [artist2, setArtist2] = useState('')
  const [selectedArtist1, setSelectedArtist1] = useState(null)
  const [selectedArtist2, setSelectedArtist2] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({ 
    artist1: false, 
    artist2: false, 
    sameArtist: false 
  })

  const handleArtist1Change = (value, artistObject) => {
    setArtist1(value)
    setSelectedArtist1(artistObject)
    // Réinitialiser les erreurs quand l'utilisateur modifie
    if (errors.artist1 || errors.sameArtist) {
      setErrors(prev => ({ ...prev, artist1: false, sameArtist: false }))
    }
  }

  const handleArtist2Change = (value, artistObject) => {
    setArtist2(value)
    setSelectedArtist2(artistObject)
    // Réinitialiser les erreurs quand l'utilisateur modifie
    if (errors.artist2 || errors.sameArtist) {
      setErrors(prev => ({ ...prev, artist2: false, sameArtist: false }))
    }
  }

  const checkCollaboration = async () => {
    // Validation : vérifier que les deux artistes ont été sélectionnés
    const artist1Valid = selectedArtist1 && artist1 === selectedArtist1.name
    const artist2Valid = selectedArtist2 && artist2 === selectedArtist2.name
    const sameArtistError = artist1Valid && artist2Valid && selectedArtist1.id === selectedArtist2.id

    const newErrors = {
      artist1: !artist1Valid,
      artist2: !artist2Valid,
      sameArtist: sameArtistError
    }

    setErrors(newErrors)

    // Si il y a des erreurs, ne pas continuer
    if (newErrors.artist1 || newErrors.artist2 || newErrors.sameArtist) {
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(
        `http://localhost:3000/api/spotify/collaboration-check/${encodeURIComponent(artist1)}/${encodeURIComponent(artist2)}`
      )
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">🎵 Music Collab Chain</h1>
          <p className="subtitle">Découvrez les collaborations entre vos artistes préférés</p>
        </header>

        <div className="game-card">
          <div className="input-section">
            <ArtistAutocomplete
              id="artist1"
              label="Premier artiste"
              value={artist1}
              onChange={handleArtist1Change}
              placeholder="Ex: Beyoncé"
              hasError={errors.artist1 || errors.sameArtist}
              errorMessage={
                errors.sameArtist 
                  ? "Les deux artistes doivent être différents" 
                  : "Veuillez sélectionner un artiste dans la liste"
              }
              excludeArtist={selectedArtist2}
            />

            <div className="vs-divider">×</div>

            <ArtistAutocomplete
              id="artist2"
              label="Deuxième artiste"
              value={artist2}
              onChange={handleArtist2Change}
              placeholder="Ex: Jay-Z"
              hasError={errors.artist2 || errors.sameArtist}
              errorMessage={
                errors.sameArtist 
                  ? "Les deux artistes doivent être différents" 
                  : "Veuillez sélectionner un artiste dans la liste"
              }
              excludeArtist={selectedArtist1}
            />
          </div>

          <button 
            onClick={checkCollaboration}
            disabled={loading}
            className="check-button"
          >
            {loading ? 'Recherche...' : 'Vérifier la collaboration'}
          </button>

          {result && (
            <div className="result-section">
              <div className={`result-header ${result.hasCollaboration ? 'success' : 'no-collab'}`}>
                {result.hasCollaboration ? (
                  <>
                    <span>Collaboration trouvée !</span>
                  </>
                ) : (
                  <>
                    <span className="icon">❌</span>
                    <span>Aucune collaboration</span>
                  </>
                )}
              </div>

              {result.hasCollaboration && result.collaborations && (
                <div className="collaborations-list">
                  <h3>📀 {result.totalFound} collaboration(s) trouvée(s)</h3>
                  {result.collaborations.slice(0, 5).map((collab, index) => (
                    <div key={index} className="collaboration-item">
                      <div className="track-info">
                        <h4>{collab.trackName}</h4>
                        <p>{collab.albumName}</p>
                        <small>{new Date(collab.releaseDate).getFullYear()}</small>
                      </div>
                      {collab.spotifyUrl && (
                        <a 
                          href={collab.spotifyUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="spotify-link"
                        >
                          🎧 Écouter
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
