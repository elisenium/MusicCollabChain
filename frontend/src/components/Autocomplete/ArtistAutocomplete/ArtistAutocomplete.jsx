import { useState, useEffect, useRef, useCallback } from 'react'
import { API_BASE_URL } from '../../../config/api'
import './ArtistAutocomplete.css'

function ArtistAutocomplete({ value, onChange, placeholder, id, label, hasError = false, errorMessage = "", excludeArtist = null, resetTrigger = 0, disabled = false, selectedArtistProp = null }) {
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
        `${API_BASE_URL}/api/spotify/search-artists/${encodeURIComponent(query)}`
      )
      const data = await response.json()
      
      // Client-side filtering to ensure relevance
      const relevantArtists = (data.artists || []).filter(artist => {
        const artistName = artist.name.toLowerCase()
        const searchQuery = query.toLowerCase()

        // Exclude the artist already selected in the other field
        if (excludeArtist && artist.id === excludeArtist.id) {
          return false
        }
        
        return (
          (artist.popularity || 0) > 40 && // Popularity greater than 40%
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
    if (disabled) return // Do not allow changes if disabled

    const newValue = e.target.value

    // If the field is cleared, reset everything
    if (!newValue) {
      setSelectedArtist(null)
      onChange(newValue, null)
    } else if (selectedArtist && newValue === selectedArtist.name) {
      // If the value exactly matches the selected artist, keep the selection
      onChange(newValue, selectedArtist)
    } else {
      // Otherwise, indicate that no artist is selected for validation
      // but keep selectedArtist for the image until a new artist is selected
      onChange(newValue, null)
    }

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      searchArtists(newValue)
    }, 200)
  }

  const handleSuggestionClick = (artist) => {
    onChange(artist.name, artist) // Pass the complete artist object as well
    setSelectedArtist(artist)
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleBlur = () => {
    // Delay to allow click on a suggestion
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

  // Reset the component when resetTrigger changes
  useEffect(() => {
    if (resetTrigger > 0) {
      setSelectedArtist(null)
      setSuggestions([])
      setIsOpen(false)
    }
  }, [resetTrigger])

  // Synchronize with the selected artist from the parent
  useEffect(() => {
    if (selectedArtistProp) {
      setSelectedArtist(selectedArtistProp)
    } else if (selectedArtistProp === null) {
      // If the parent explicitly passes null, clear the selected artist
      setSelectedArtist(null)
    }
  }, [selectedArtistProp])

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
          className={`artist-input ${hasError ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
          autoComplete="off"
          disabled={disabled}
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
