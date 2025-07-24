import { useState } from 'react'
import Header from '../../Header/Header'
import './HomePage.css'

function HomePage({ onStartGame }) {
  const [numberOfTeams, setNumberOfTeams] = useState(2)
  const [teamNames, setTeamNames] = useState(['Équipe 1', 'Équipe 2'])
  const [currentStep, setCurrentStep] = useState('teams') // 'teams', 'gameMode' or 'names'
  const [showRules, setShowRules] = useState(false)
  const [gameMode, setGameMode] = useState('race') // 'race', 'survival', 'timed', 'combo', 'referee', 'blitz'

  const handleTeamCountChange = (count) => {
    setNumberOfTeams(count)
    const newTeamNames = Array.from({ length: count }, (_, i) => 
      teamNames[i] || `Équipe ${i + 1}`
    )
    setTeamNames(newTeamNames)
  }

  const handleTeamNameChange = (index, name) => {
    const newTeamNames = [...teamNames]
    newTeamNames[index] = name
    setTeamNames(newTeamNames)
  }

  const handleNext = () => {
    if (currentStep === 'teams') {
      setCurrentStep('gameMode')
    } else if (currentStep === 'gameMode') {
      setCurrentStep('names')
    }
  }

  const handleBack = () => {
    if (currentStep === 'names') {
      setCurrentStep('gameMode')
    } else if (currentStep === 'gameMode') {
      setCurrentStep('teams')
    }
  }

  const handleStartGame = () => {
    onStartGame(teamNames, gameMode)
  }

  const toggleRules = () => {
    setShowRules(!showRules)
  }

  const canProceed = () => {
    if (currentStep === 'teams') {
      return numberOfTeams >= 2 && numberOfTeams <= 6
    }
    if (currentStep === 'gameMode') {
      return gameMode !== ''
    }
    if (currentStep === 'names') {
      return teamNames.every(name => name.trim().length > 0)
    }
    return false
  }

  return (
    <div className="home-page">
      <div className="container">
        <Header />

        <div className="setup-card">
          {currentStep === 'teams' && (
            <div className="step-content">
              <h2>Combien d'équipes vont jouer ?</h2>
              <p className="step-description">Choisissez entre 2 et 6 équipes</p>
              
              <div className="team-count-selector">
                {[2,3,4,5,6].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleTeamCountChange(count)}
                    className={`count-button ${numberOfTeams === count ? 'active' : ''}`}
                  >
                    {count}
                  </button>
                ))}
              </div>

              <div className="selected-info">
                <span className="teams-count">{numberOfTeams} équipes</span>
                <span className="players-info">
                  (ou {numberOfTeams} joueurs)
                </span>
              </div>
            </div>
          )}

          {currentStep === 'gameMode' && (
            <div className="step-content">
              <h2>Choisissez le mode de jeu</h2>
              <p className="step-description">Sélectionnez le type de partie que vous voulez jouer</p>
              
              <div className="game-modes-grid">
                <div 
                  className={`game-mode-button ${gameMode === 'race' ? 'active' : ''}`}
                  onClick={() => setGameMode('race')}
                >
                  <div className="mode-icon">🏆</div>
                  <div className="mode-name">Course</div>
                  <div className="mode-subtitle">Premier à 10 points</div>
                  <div className="tooltip">
                    <div className="tooltip-content">
                      <strong>Mode Course</strong><br/>
                      • Premier à 10 points gagne<br/>
                      • Parties rapides (15-20 min)<br/>
                      • Idéal pour débuter
                    </div>
                  </div>
                </div>

                <div 
                  className={`game-mode-button ${gameMode === 'survival' ? 'active' : ''}`}
                  onClick={() => setGameMode('survival')}
                >
                  <div className="mode-icon">💀</div>
                  <div className="mode-name">Survie</div>
                  <div className="mode-subtitle">3 erreurs = élimination</div>
                  <div className="tooltip">
                    <div className="tooltip-content">
                      <strong>Mode Survie</strong><br/>
                      • 3 erreurs par équipe<br/>
                      • Dernière équipe survivante gagne<br/>
                      • Plus stratégique et intense
                    </div>
                  </div>
                </div>

                <div 
                  className={`game-mode-button ${gameMode === 'timed' ? 'active' : ''}`}
                  onClick={() => setGameMode('timed')}
                >
                  <div className="mode-icon">⏱️</div>
                  <div className="mode-name">Chrono</div>
                  <div className="mode-subtitle">15 minutes chrono</div>
                  <div className="tooltip">
                    <div className="tooltip-content">
                      <strong>Mode Chrono</strong><br/>
                      • 15 minutes de jeu<br/>
                      • Maximum de points dans le temps<br/>
                      • Pression du temps imparti
                    </div>
                  </div>
                </div>

                <div 
                  className={`game-mode-button ${gameMode === 'combo' ? 'active' : ''}`}
                  onClick={() => setGameMode('combo')}
                >
                  <div className="mode-icon">🔥</div>
                  <div className="mode-name">Combo</div>
                  <div className="mode-subtitle">Points progressifs</div>
                  <div className="tooltip">
                    <div className="tooltip-content">
                      <strong>Mode Combo</strong><br/>
                      • 1pt → 2pts → 3pts pour les combos<br/>
                      • Reset après une erreur<br/>
                      • Premier à 15 points gagne
                    </div>
                  </div>
                </div>

                <div 
                  className={`game-mode-button ${gameMode === 'referee' ? 'active' : ''}`}
                  onClick={() => setGameMode('referee')}
                >
                  <div className="mode-icon">👨‍⚖️</div>
                  <div className="mode-name">Arbitre</div>
                  <div className="mode-subtitle">Validation manuelle</div>
                  <div className="tooltip">
                    <div className="tooltip-content">
                      <strong>Mode Arbitre</strong><br/>
                      • Un arbitre valide les réponses<br/>
                      • Pas de vérification automatique<br/>
                      • Plus de flexibilité sur les collaborations
                    </div>
                  </div>
                </div>

                <div 
                  className={`game-mode-button ${gameMode === 'blitz' ? 'active' : ''}`}
                  onClick={() => setGameMode('blitz')}
                >
                  <div className="mode-icon">⚡</div>
                  <div className="mode-name">Blitz</div>
                  <div className="mode-subtitle">15 secondes par tour</div>
                  <div className="tooltip">
                    <div className="tooltip-content">
                      <strong>Mode Blitz</strong><br/>
                      • 15 secondes maximum par réponse<br/>
                      • Rythme ultra rapide<br/>
                      • Premier à 8 points gagne
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'names' && (
            <div className="step-content">
              <h2>Nommez vos équipes</h2>
              <p className="step-description">Donnez un nom unique à chaque équipe</p>
              
              <div className="team-names-grid">
                {teamNames.map((name, index) => (
                  <div key={index} className="team-input-wrapper">
                    <label htmlFor={`team-${index}`}>
                      Équipe {index + 1}
                    </label>
                    <input
                      id={`team-${index}`}
                      type="text"
                      value={name}
                      onChange={(e) => handleTeamNameChange(index, e.target.value)}
                      className="team-name-input"
                      placeholder={`Équipe ${index + 1}`}
                      maxLength={20}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="step-actions">
            {(currentStep === 'names' || currentStep === 'gameMode') && (
              <button onClick={handleBack} className="back-step-button">
                ← Retour
              </button>
            )}
            
            {(currentStep === 'teams' || currentStep === 'gameMode') && (
              <button 
                onClick={handleNext}
                disabled={!canProceed()}
                className="next-button"
              >
                Suivant →
              </button>
            )}
            
            {currentStep === 'names' && (
              <button 
                onClick={handleStartGame}
                disabled={!canProceed()}
                className="start-game-button"
              >
                Commencer le jeu !
              </button>
            )}
          </div>
        </div>

        <div className="info-section">
          <button onClick={toggleRules} className="rules-toggle">
            <span className="info-icon">ⓘ</span>
            Règles du jeu
          </button>
          
          {showRules && (
            <div className="rules-section">
              <div className="rules-content">
                <p className="rules-intro">
                  Le but du jeu est de former une chaîne d'artistes ayant collaboré entre eux.
                </p>
                <div className="rules-list">
                  <div className="rule-item">
                    <li>Une équipe commence en citant un artiste.</li>
                  </div>
                  <div className="rule-item">
                    <li>À tour de rôle, les autres équipes doivent proposer un artiste ayant collaboré directement avec le précédent.</li>
                  </div>
                  <div className="rule-item">
                    <li>Chaque collaboration valide rapporte +1 point à l'équipe qui joue.</li>
                  </div>
                  <div className="rule-item">
                    <li>Si une équipe donne une mauvaise réponse ou dépasse le temps imparti, la chaîne est interrompue et une nouvelle commence.</li>
                  </div>
                  <div className="rule-item">
                    <li>L'équipe qui a le plus de points à la fin de la partie remporte la victoire.</li>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomePage
