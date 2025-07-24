import { useState } from 'react'
import Header from '../../Header/Header'
import './HomePage.css'

function HomePage({ onStartGame }) {
  const [numberOfTeams, setNumberOfTeams] = useState(2)
  const [teamNames, setTeamNames] = useState(['Équipe 1', 'Équipe 2'])
  const [currentStep, setCurrentStep] = useState('teams') // 'teams' or 'names'
  const [showRules, setShowRules] = useState(false)

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

  const toggleRules = () => {
    setShowRules(!showRules)
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
