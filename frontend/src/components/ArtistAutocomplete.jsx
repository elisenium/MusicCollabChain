import { useState, useEffect, useRef, useCallback } from 'react'
import './ArtistAutocomplete.css'

function ArtistAutocomplete({ value, onChange, placeholder, id, label, hasError = false, errorMessage = "", excludeArtist = null }) {
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const searchArtists = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `http://localhost:3000/api/spotify/search-artists/${encodeURIComponent(query)}`
      )
      const data = await response.json()
      
      // Filtrage côté client supplémentaire pour s'assurer de la pertinence
      const relevantArtists = (data.artists || []).filter(artist => {
        const artistName = artist.name.toLowerCase()
        const searchQuery = query.toLowerCase()
        
        // Exclure l'artiste déjà sélectionné dans l'autre champ
        if (excludeArtist && artist.id === excludeArtist.id) {
          return false
        }
        
        return (
          (artist.popularity || 0) > 40 && // Popularité supérieure à 40
          (
            artistName.includes(searchQuery) || 
            searchQuery.split(' ').some(word => word.length > 1 && artistName.includes(word))
          )
        )
      })
      
      setSuggestions(relevantArtists)
      setIsOpen(relevantArtists.length > 0)
    } catch (error) {
      console.error('Error searching artists:', error)
      setSuggestions([])
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }, [excludeArtist])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    
    // Si on efface le champ, on reset tout
    if (!newValue) {
      setSelectedArtist(null)
      onChange(newValue, null)
    } else if (selectedArtist && newValue === selectedArtist.name) {
      // Si la valeur correspond exactement à l'artiste sélectionné, on garde la sélection
      onChange(newValue, selectedArtist)
    } else {
      // Sinon, on indique qu'aucun artiste n'est sélectionné pour la validation
      // mais on garde selectedArtist pour l'image jusqu'à ce qu'un nouvel artiste soit sélectionné
      onChange(newValue, null)
    }

    // Débounce la recherche
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      searchArtists(newValue)
    }, 200)
  }

  const handleSuggestionClick = (artist) => {
    onChange(artist.name, artist) // Passer aussi l'objet artiste complet
    setSelectedArtist(artist)
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleBlur = () => {
    // Délai pour permettre le clic sur une suggestion
    setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div className="autocomplete-container">
      {selectedArtist && selectedArtist.images && selectedArtist.images[0] && (
        <div className="selected-artist-image">
          <img 
            src={selectedArtist.images[0].url} 
            alt={selectedArtist.name}
            className="artist-avatar"
          />
        </div>
      )}
      <label htmlFor={id}>{label}</label>
      <div className="autocomplete-wrapper">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`artist-input ${hasError ? 'error' : ''}`}
          autoComplete="off"
        />
        
        {loading && (
          <div className="autocomplete-loading">
            <span className="loading-spinner">⟳</span>
          </div>
        )}

        {hasError && errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        {isOpen && suggestions.length > 0 && (
          <div className="autocomplete-dropdown">
            {suggestions.slice(0, 6).map((artist) => (
              <div
                key={artist.id}
                className="autocomplete-item"
                onClick={() => handleSuggestionClick(artist)}
              >
                <div className="artist-info">
                  {artist.images && artist.images[0] && (
                    <img 
                      src={artist.images[0].url} 
                      alt={artist.name}
                      className="artist-image"
                    />
                  )}
                  <div className="artist-details">
                    <div className="artist-name">{artist.name}</div>
                    {artist.genres && artist.genres.length > 0 && (
                      <div className="artist-genres">
                        {artist.genres.slice(0, 2).join(', ')}
                      </div>
                    )}
                    <div className="artist-followers">
                      {artist.followers?.total?.toLocaleString()} followers
                    </div>
                  </div>
                </div>
                <div className="artist-popularity">
                  <div className="popularity-bar">
                    <div 
                      className="popularity-fill"
                      style={{ width: `${artist.popularity}%` }}
                    />
                  </div>
                  <span className="popularity-text">{artist.popularity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ArtistAutocomplete
