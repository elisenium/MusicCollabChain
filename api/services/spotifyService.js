const axios = require('axios');
require('dotenv').config();

async function getAccessToken() {
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ':' +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data.access_token;
}

// Function to filter out generic artists
function isGenericArtist(artistName) {
  const genericNames = [
    'Various Artists',
    'Various',
    'Soundtrack',
    'Cast',
    'Original Cast',
    'Broadway Cast',
    'Film Cast',
    'TV Cast',
    'Compilation',
    'Unknown Artist',
    'VA',
  ];

  return genericNames.some((generic) =>
    artistName.toLowerCase().includes(generic.toLowerCase())
  );
}

async function getArtistCollaborations(artistId) {
  const token = await getAccessToken();

  // Get artist details
  const artistResponse = await axios.get(
    `https://api.spotify.com/v1/artists/${artistId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const artistName = artistResponse.data.name;
  const collaborations = [];
  const seen = new Set();

  // Helper function to add collaboration
  const addCollaboration = (track, album, collaborators, source) => {
    if (collaborators.length === 0) return;

    const key = `${track?.name || album.name}-${album.name}-${collaborators[0].name}`;
    if (seen.has(key)) return;

    seen.add(key);
    collaborations.push({
      trackName: track?.name,
      albumName: album.name,
      releaseDate: album.release_date,
      collaborators,
      spotifyUrl: track?.external_urls?.spotify || album.external_urls.spotify,
      albumImage: album.images?.[0]?.url,
      popularity: track?.popularity,
      source,
    });
  };

  // Helper function to extract collaborators
  const extractCollaborators = (artists, excludeId) => {
    return artists
      .filter(
        (artist) => artist.id !== excludeId && !isGenericArtist(artist.name)
      )
      .map((artist) => ({
        name: artist.name,
        id: artist.id,
        role: 'artist',
      }));
  };

  try {
    // 1. Get albums where artist appears (featuring)
    const appearsOnResponse = await axios.get(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=appears_on`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    for (const album of appearsOnResponse.data.items) {
      // Album-level collaborations
      const albumCollaborators = extractCollaborators(album.artists, artistId);
      addCollaboration(null, album, albumCollaborators, 'appears_on');

      // Track-level collaborations in appears_on albums
      try {
        const tracksResponse = await axios.get(
          `https://api.spotify.com/v1/albums/${album.id}/tracks`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        tracksResponse.data.items.forEach((track) => {
          if (
            track.artists.some((artist) => artist.id === artistId) &&
            track.artists.length > 1
          ) {
            const trackCollaborators = extractCollaborators(
              track.artists,
              artistId
            );
            addCollaboration(
              track,
              album,
              trackCollaborators,
              'appears_on_tracks'
            );
          }
        });
      } catch (error) {
        console.log(`Error fetching tracks for album ${album.name}`);
      }
    }

    // 2. Get artist's own albums
    const ownAlbumsResponse = await axios.get(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    for (const album of ownAlbumsResponse.data.items) {
      try {
        const tracksResponse = await axios.get(
          `https://api.spotify.com/v1/albums/${album.id}/tracks`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        tracksResponse.data.items.forEach((track) => {
          if (track.artists.length > 1) {
            const collaborators = extractCollaborators(track.artists, artistId);
            addCollaboration(track, album, collaborators, 'own_albums');
          }
        });
      } catch (error) {
        console.log(`Error fetching tracks for album ${album.name}`);
      }
    }

    // 3. Search for tracks with this artist
    const searchStrategies = [
      `artist:"${encodeURIComponent(artistName)}"`,
      `"${artistName}" feat`,
      `feat "${artistName}"`,
      `"${artistName}" featuring`,
      `featuring "${artistName}"`,
    ];

    for (const searchQuery of searchStrategies) {
      try {
        const searchResponse = await axios.get(
          `https://api.spotify.com/v1/search?q=${searchQuery}&type=track`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        searchResponse.data.tracks.items.forEach((track) => {
          const hasOurArtist = track.artists.some(
            (artist) => artist.id === artistId
          );
          if (hasOurArtist && track.artists.length > 1) {
            const collaborators = extractCollaborators(track.artists, artistId);
            addCollaboration(track, track.album, collaborators, 'search');
          }
        });
      } catch (error) {
        console.log(`Error with search strategy "${searchQuery}"`);
      }
    }
  } catch (error) {
    console.log('Error in getArtistCollaborations:', error.message);
  }

  return {
    artist: artistName,
    collaborations: collaborations.sort(
      (a, b) => new Date(b.releaseDate) - new Date(a.releaseDate)
    ),
    totalCollaborations: collaborations.length,
    searchSources: ['appears_on', 'appears_on_tracks', 'own_albums', 'search'],
  };
}

async function findCollaborationBetweenArtists(artist1Name, artist2Name) {
  const token = await getAccessToken();
  const collaborations = [];
  const seen = new Set();

  // Helper function to check if both artists are on a track
  const hasBothArtists = (track) => {
    const artistNames = track.artists.map((artist) =>
      artist.name.toLowerCase()
    );
    const hasArtist1 = artistNames.some(
      (name) =>
        name.includes(artist1Name.toLowerCase()) ||
        artist1Name.toLowerCase().includes(name)
    );
    const hasArtist2 = artistNames.some(
      (name) =>
        name.includes(artist2Name.toLowerCase()) ||
        artist2Name.toLowerCase().includes(name)
    );
    return hasArtist1 && hasArtist2;
  };

  // Search strategies
  const searchTerms = [
    `"${artist1Name}" "${artist2Name}"`,
    `"${artist2Name}" "${artist1Name}"`,
    `${artist1Name} ${artist2Name}`,
    `${artist2Name} ${artist1Name}`,
    `${artist1Name} feat ${artist2Name}`,
    `${artist2Name} feat ${artist1Name}`,
  ];

  try {
    for (const searchTerm of searchTerms) {
      try {
        const searchResponse = await axios.get(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=track`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        searchResponse.data.tracks.items.forEach((track) => {
          if (hasBothArtists(track)) {
            const key = `${track.name}-${track.album.name}`;
            if (!seen.has(key)) {
              seen.add(key);
              collaborations.push({
                trackName: track.name,
                albumName: track.album.name,
                releaseDate: track.album.release_date,
                artists: track.artists.map((artist) => ({
                  name: artist.name,
                  id: artist.id,
                })),
                spotifyUrl: track.external_urls.spotify,
                albumImage: track.album.images?.[0]?.url,
                popularity: track.popularity,
                searchTerm: searchTerm,
              });
            }
          }
        });
      } catch (termError) {
        console.log(`Error searching "${searchTerm}":`, termError.message);
      }
    }
  } catch (error) {
    console.log('Error finding collaboration:', error.message);
  }

  return {
    artist1: artist1Name,
    artist2: artist2Name,
    hasCollaboration: collaborations.length > 0,
    totalFound: collaborations.length,
    collaborations: collaborations
      .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
      .map((collab) => ({
        trackName: collab.trackName,
        albumName: collab.albumName,
        releaseDate: collab.releaseDate,
        artists: collab.artists.map((artist) => artist.name),
        spotifyUrl: collab.spotifyUrl,
        popularity: collab.popularity,
      })),
  };
}

async function searchArtists(query) {
  const token = await getAccessToken();

  try {
    const searchResponse = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Fonction pour calculer la pertinence d'un artiste
    const calculateRelevance = (artist, query) => {
      const name = artist.name.toLowerCase();
      const searchQuery = query.toLowerCase();

      // Score de base basé sur la popularité
      let score = artist.popularity || 0;

      // Bonus massif si le nom commence par la requête
      if (name.startsWith(searchQuery)) {
        score += 1000;
      }
      // Bonus important si le nom contient exactement la requête
      else if (name.includes(searchQuery)) {
        score += 500;
      }
      // Bonus si les mots correspondent
      else if (searchQuery.split(' ').some((word) => name.includes(word))) {
        score += 200;
      }

      // Pénalité si le nom est très différent
      const similarity =
        searchQuery.length > 0
          ? name.length / Math.max(name.length, searchQuery.length)
          : 0;
      if (similarity < 0.3) {
        score -= 300;
      }

      return score;
    };

    // Filtrer et trier les artistes par pertinence
    const filteredArtists = searchResponse.data.artists.items
      .map((artist) => ({
        ...artist,
        relevanceScore: calculateRelevance(artist, query),
      }))
      .filter((artist) => {
        const name = artist.name.toLowerCase();
        const searchQuery = query.toLowerCase();

        // Garder seulement les artistes qui ont une correspondance évidente ET une popularité > 40
        return (
          (artist.popularity || 0) > 40 &&
          (name.includes(searchQuery) ||
            searchQuery
              .split(' ')
              .some((word) => word.length > 2 && name.includes(word)) ||
            artist.relevanceScore > 300)
        );
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8); // Limiter à 8 résultats les plus pertinents

    const artists = filteredArtists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      images: artist.images,
      genres: artist.genres,
      popularity: artist.popularity,
      followers: artist.followers,
      relevanceScore: artist.relevanceScore, // Pour debug si nécessaire
    }));

    return {
      query: query,
      artists: artists,
    };
  } catch (error) {
    console.log('Error searching artists:', error.message);
    return {
      query: query,
      artists: [],
    };
  }
}

module.exports = {
  getArtistCollaborations,
  findCollaborationBetweenArtists,
  searchArtists,
};
