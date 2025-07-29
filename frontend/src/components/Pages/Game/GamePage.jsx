import { useState } from 'react'
import { API_BASE_URL } from '../../../config/api'
import ArtistAutocomplete from '../../Autocomplete/ArtistAutocomplete/ArtistAutocomplete'
import './GamePage.css'

function GamePage({ teams, onBackToHome }) {
  const [artist1, setArtist1] = useState('')
  const [artist2, setArtist2] = useState('')
  const [selectedArtist1, setSelectedArtist1] = useState(null)
  const [selectedArtist2, setSelectedArtist2] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)
  const [scores, setScores] = useState(teams.map(() => 0))
  const [pointAnimation, setPointAnimation] = useState({ show: false, teamIndex: -1 })
  const [isFirstTurn, setIsFirstTurn] = useState(true)
  const [chainArtist, setChainArtist] = useState(null) // Artist at the end of the chain (fixed)
  const [errors, setErrors] = useState({ 
    artist1: false, 
    artist2: false, 
    sameArtist: false 
  })

  const currentTeam = teams[currentTeamIndex]

  const handleArtist1Change = (value, artistObject) => {
    setArtist1(value)
    setSelectedArtist1(artistObject)
    if (errors.artist1 || errors.sameArtist) {
      setErrors(prev => ({ ...prev, artist1: false, sameArtist: false }))
    }
  }

  const handleArtist2Change = (value, artistObject) => {
    setArtist2(value)
    setSelectedArtist2(artistObject)
    if (errors.artist2 || errors.sameArtist) {
      setErrors(prev => ({ ...prev, artist2: false, sameArtist: false }))
    }
  }

  const checkCollaboration = async () => {
    // First turn: only validate the first artist
    if (isFirstTurn) {
      const artist1Valid = selectedArtist1 && artist1 === selectedArtist1.name
      
      if (!artist1Valid) {
        setErrors(prev => ({ ...prev, artist1: true }))
        return
      }
      
      // Set chain artist and proceed to next turn
      setChainArtist(selectedArtist1)
      setIsFirstTurn(false)
      
      nextTurn()
      return
    }
    
    // Next rounds: check collaboration
    const artist2Valid = selectedArtist2 && artist2 === selectedArtist2.name
    const sameArtistError = chainArtist && selectedArtist2 && chainArtist.id === selectedArtist2.id

    const newErrors = {
      artist1: false, // The first artist is fixed by the chain
      artist2: !artist2Valid,
      sameArtist: sameArtistError
    }

    setErrors(newErrors)

    if (newErrors.artist2 || newErrors.sameArtist) {
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/spotify/collaboration-check/${encodeURIComponent(chainArtist.name)}/${encodeURIComponent(artist2)}`
      )
      const data = await response.json()
      setResult(data)

      // If a collaboration is found, automatically add the point
      if (data.hasCollaboration) {
        setTimeout(() => {
          addPoint()
        }, 500) // Small delay for visual effect
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextTurn = () => {
    // If a collaboration was found, slide the chain
    if (result && result.hasCollaboration && selectedArtist2) {
      setChainArtist(selectedArtist2)
      setArtist1(selectedArtist2.name)
      setSelectedArtist1(selectedArtist2)
    } else if (chainArtist && !isFirstTurn) {
      // Garder l'artiste de la chaîne comme premier artiste
      setArtist1(chainArtist.name)
      setSelectedArtist1(chainArtist)
    }

    // Reset the second artist and results
    setArtist2('')
    setSelectedArtist2(null)
    setResult(null)
    setErrors({ artist1: false, artist2: false, sameArtist: false })

    // Go to the next team
    setCurrentTeamIndex((prev) => (prev + 1) % teams.length)
  }

  const addPoint = () => {
    const newScores = [...scores]
    newScores[currentTeamIndex] += 1
    setScores(newScores)

    // +1 animation
    setPointAnimation({ show: true, teamIndex: currentTeamIndex })
    
    // Notification sound
    try {
      // Create a simple sound effect with the Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.log('Audio not supported:', error)
    }

    // Make the animation disappear after 1.5 seconds
    setTimeout(() => {
      setPointAnimation({ show: false, teamIndex: -1 })
    }, 1500)
  }

  const newChain = () => {
    // Reset completely for a new chain
    setArtist1('')
    setArtist2('')
    setSelectedArtist1(null)
    setSelectedArtist2(null)
    setResult(null)
    setErrors({ artist1: false, artist2: false, sameArtist: false })
    setChainArtist(null)
    setIsFirstTurn(true)
    
    // Go to the next team
    setCurrentTeamIndex((prev) => (prev + 1) % teams.length)
  }

  return (
    <div className="game-page">
      <div className="container">
        <header className="game-header">
          <button onClick={onBackToHome} className="back-button">
            ← Retour à l'accueil
          </button>
          <h1 className="title">🎵 Music Collab Chain</h1>

          <div className="current-team">
            <h2>Tour de l'équipe : <span className="team-name">{currentTeam}</span></h2>
            {isFirstTurn ? (
              <p className="game-instruction">Choisissez le premier artiste pour démarrer la chaîne de collaborations</p>
            ) : (
              <p className="game-instruction">Trouvez un artiste qui a collaboré avec <strong>{chainArtist?.name}</strong></p>
            )}
          </div>
        </header>

        <div className="scores-section">
          <h3>Scores</h3>
          <div className="scores-grid">
            {teams.map((team, index) => (
              <div 
                key={index} 
                className={`score-item ${index === currentTeamIndex ? 'current' : ''}`}
              >
                <span className="team">{team}</span>
                <div className="score-container">
                  <span className="score">{scores[index]}</span>
                  {pointAnimation.show && pointAnimation.teamIndex === index && (
                    <span className="point-animation">+1</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="game-card">
          <div className="input-section">
            {isFirstTurn ? (
              // 1st round: a team picks the first artist
              <ArtistAutocomplete
                id="artist1"
                label="Choisissez le premier artiste pour commencer la chaîne"
                value={artist1}
                onChange={handleArtist1Change}
                placeholder="Ex: Beyoncé"
                hasError={errors.artist1}
                errorMessage="Veuillez sélectionner un artiste dans la liste"
                selectedArtistProp={selectedArtist1}
              />
            ) : (
              // Next rounds: find a collaborating artist
              <>
                <ArtistAutocomplete
                  id="artist1"
                  value={artist1}
                  onChange={handleArtist1Change}
                  placeholder="Ex: Beyoncé"
                  hasError={false}
                  disabled={true}
                  selectedArtistProp={selectedArtist1}
                />

                <div className="vs-divider">×</div>

                <ArtistAutocomplete
                  id="artist2"
                  value={artist2}
                  onChange={handleArtist2Change}
                  placeholder="Nom de l'artiste collaborateur"
                  hasError={errors.artist2 || errors.sameArtist}
                  errorMessage={
                    errors.sameArtist 
                      ? "Les deux artistes doivent être différents" 
                      : "Veuillez sélectionner un artiste dans la liste"
                  }
                  excludeArtist={chainArtist}
                  selectedArtistProp={selectedArtist2}
                />
              </>
            )}
          </div>

          {/* Show the check button only if:
              - It's the first turn AND no result, OR
              - It's not the first turn AND no result */}
          {!result && (
            <button 
              onClick={checkCollaboration}
              disabled={loading}
              className="check-button"
            >
              {loading ? '🔍 Recherche...' : (isFirstTurn ? 'Valider le premier artiste' : 'Vérifier la collaboration')}
            </button>
          )}

          {/* Afficher un message d'échec avec les actions directement */}
          {result && !result.hasCollaboration && !isFirstTurn && (
            <div className="failed-attempt">
              <p className="fail-message">Aucune collaboration trouvée. {currentTeam} passe son tour.</p>
            </div>
          )}

          {result && (
            <div className="result-section">
              {result.hasCollaboration ? (
                <>
                  <div className="result-header success">
                    <span>Collaboration trouvée !</span>
                  </div>

                  {result.collaborations && (
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

                  <div className="turn-actions">
                    <button onClick={nextTurn} className="next-turn-button">
                      Continuer la chaîne →
                    </button>
                    <button onClick={newChain} className="new-chain-button">
                      Nouvelle chaîne
                    </button>
                  </div>
                </>
              ) : (
                // For failures, actions are already displayed above
                <div className="turn-actions">
                  <button onClick={nextTurn} className="next-turn-button">
                    Tour suivant →
                  </button>
                  <button onClick={newChain} className="new-chain-button">
                    Nouvelle chaîne
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GamePage
