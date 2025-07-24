import { useState } from 'react'
import HomePage from '../Pages/Home/HomePage'
import GamePage from '../Pages/Game/GamePage'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home') // 'home' or 'game'
  const [teams, setTeams] = useState([])

  const handleStartGame = (teamNames) => {
    setTeams(teamNames)
    setCurrentPage('game')
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
    setTeams([])
  }

  return (
    <div className="app">
      {currentPage === 'home' && (
        <HomePage onStartGame={handleStartGame} />
      )}
      
      {currentPage === 'game' && (
        <GamePage teams={teams} onBackToHome={handleBackToHome} />
      )}
    </div>
  )
}

export default App
