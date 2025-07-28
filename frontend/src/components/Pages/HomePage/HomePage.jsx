import { useState } from 'react'
import './HomePage.css'

function HomePage({ onStartGame }) {
  const [numberOfTeams, setNumberOfTeams] = useState(2)
  const [teamNames, setTeamNames] = useState(['Équipe 1', 'Équipe 2'])
  const [currentStep, setCurrentStep] = useState('teams') // 'teams' or 'names'

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
      setCurrentStep('names')
    }
  }

  const handleBack = () => {
    if (currentStep === 'names') {
      setCurrentStep('teams')
    }
  }

  const handleStartGame = () => {
    onStartGame(teamNames)
  }

  const canProceed = () => {
    if (currentStep === 'teams') {
      return numberOfTeams >= 2 && numberOfTeams <= 6
    }
    if (currentStep === 'names') {
      return teamNames.every(name => name.trim().length > 0)
    }
    return false
  }

  return (
    <div className="home-page">
      <div className="container">
        <header className="header">
          <h1 className="title">🎵 MusicCollabChain</h1>
          <p className="subtitle">Le jeu ultime pour découvrir les collaborations musicales</p>
        </header>

        <div className="setup-card">
          {currentStep === 'teams' && (
            <div className="step-content">
              <h2>Combien d'équipes vont jouer ?</h2>
              <p className="step-description">Choisissez entre 2 et 6 équipes</p>
              
              <div className="team-count-selector">
                {[2, 3, 4, 5, 6].map((count) => (
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
                  ({numberOfTeams} joueurs ou plus)
                </span>
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
            {currentStep === 'names' && (
              <button onClick={handleBack} className="back-step-button">
                ← Retour
              </button>
            )}
            
            {currentStep === 'teams' && (
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

        <div className="rules-section">
          <h3>📋 Règles du jeu</h3>
          <div className="rules-list">
            <div className="rule-item">
              <span className="rule-icon">🎯</span>
              <span>Trouvez des collaborations entre artistes</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">⚡</span>
              <span>+1 point par collaboration trouvée</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🔄</span>
              <span>Chaque équipe joue à tour de rôle</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🏆</span>
              <span>L'équipe avec le plus de points gagne !</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
