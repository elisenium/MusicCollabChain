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
            process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
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
    'VA'
  ];
  
  return genericNames.some(generic => 
    artistName.toLowerCase().includes(generic.toLowerCase())
  );
}

async function getArtistCollaborations(artistId) {
  const token = await getAccessToken();

  // Fetch artist details
  const artistResponse = await axios.get(
    `https://api.spotify.com/v1/artists/${artistId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const artistName = artistResponse.data.name;
  const collaborations = [];
  const seen = new Set(); // Éviter les doublons

  // Albums where the artist appears as a guest (featuring)
  const appearsOnResponse = await axios.get(
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=appears_on&limit=50`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  // Process "appears_on" albums - check individual tracks too
  for (const album of appearsOnResponse.data.items) {
    // First, add album-level collaborations
    const albumCollaborators = album.artists
      .filter(artist => artist.id !== artistId && !isGenericArtist(artist.name))
      .map(artist => ({
        name: artist.name,
        id: artist.id,
        role: 'main_artist'
      }));

    if (albumCollaborators.length > 0) {
      const key = `${album.name}-${albumCollaborators[0].name}`;
      if (!seen.has(key)) {
        seen.add(key);
        collaborations.push({
          albumName: album.name,
          releaseDate: album.release_date,
          collaborators: albumCollaborators,
          spotifyUrl: album.external_urls.spotify,
          albumImage: album.images[0]?.url,
          albumType: album.album_type,
          source: 'appears_on'
        });
      }
    }

    // Also check individual tracks in appears_on albums
    try {
      const tracksResponse = await axios.get(
        `https://api.spotify.com/v1/albums/${album.id}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      tracksResponse.data.items.forEach(track => {
        const hasOurArtist = track.artists.some(artist => artist.id === artistId);
        if (hasOurArtist && track.artists.length > 1) {
          const trackCollaborators = track.artists
            .filter(artist => artist.id !== artistId && !isGenericArtist(artist.name))
            .map(artist => ({
              name: artist.name,
              id: artist.id,
              role: 'main_artist'
            }));

          if (trackCollaborators.length > 0) {
            const key = `${track.name}-${album.name}-${trackCollaborators[0].name}`;
            if (!seen.has(key)) {
              seen.add(key);
              collaborations.push({
                trackName: track.name,
                albumName: album.name,
                releaseDate: album.release_date,
                collaborators: trackCollaborators,
                spotifyUrl: track.external_urls?.spotify || album.external_urls.spotify,
                albumImage: album.images[0]?.url,
                albumType: album.album_type,
                source: 'appears_on_tracks'
              });
            }
          }
        }
      });
    } catch (error) {
      console.log(`Erreur pour les tracks de l'album ${album.name}`);
    }
  }

  // Artist's own albums with its collaborations
  const ownAlbumsResponse = await axios.get(
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=20`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  // Check the artist's albums' tracks
  for (const album of ownAlbumsResponse.data.items) {
    try {
      const tracksResponse = await axios.get(
        `https://api.spotify.com/v1/albums/${album.id}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      tracksResponse.data.items.forEach(track => {
        if (track.artists.length > 1) {
          const collaborators = track.artists
            .filter(artist => artist.id !== artistId && !isGenericArtist(artist.name))
            .map(artist => ({
              name: artist.name,
              id: artist.id,
              role: 'featured_artist'
            }));

          if (collaborators.length > 0) {
            const key = `${track.name}-${album.name}-${collaborators[0].name}`;
            if (!seen.has(key)) {
              seen.add(key);
              collaborations.push({
                trackName: track.name,
                albumName: album.name,
                releaseDate: album.release_date,
                collaborators: collaborators,
                spotifyUrl: track.external_urls.spotify,
                albumImage: album.images[0]?.url,
                albumType: album.album_type,
                source: 'own_albums'
              });
            }
          }
        }
      });
    } catch (error) {
      console.log(`Erreur pour l'album ${album.name}`);
    }
  }

  // Reverse search - tracks where this artist appears
  try {
    const searchResponse = await axios.get(
      `https://api.spotify.com/v1/search?q=artist:"${encodeURIComponent(artistName)}"&type=track&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Check each track for collaborations
    for (const track of searchResponse.data.tracks.items) {
      const hasOurArtist = track.artists.some(artist => artist.id === artistId);
      if (hasOurArtist && track.artists.length > 1) {
        try {
          // Get the full details of the track to obtain credits
          const trackDetailsResponse = await axios.get(
            `https://api.spotify.com/v1/tracks/${track.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const trackDetails = trackDetailsResponse.data;
          const collaborators = trackDetails.artists
            .filter(artist => artist.id !== artistId && !isGenericArtist(artist.name))
            .map(artist => ({
              name: artist.name,
              id: artist.id,
              role: 'artist'
            }));

          if (collaborators.length > 0) {
            const key = `${trackDetails.name}-${trackDetails.album.name}-${collaborators[0].name}`;
            if (!seen.has(key)) {
              seen.add(key);
              collaborations.push({
                trackName: trackDetails.name,
                albumName: trackDetails.album.name,
                releaseDate: trackDetails.album.release_date,
                collaborators: collaborators,
                spotifyUrl: trackDetails.external_urls.spotify,
                albumImage: trackDetails.album.images[0]?.url,
                popularity: trackDetails.popularity,
                durationMs: trackDetails.duration_ms,
                explicit: trackDetails.explicit,
                source: 'search_with_details'
              });
            }
          }
        } catch (trackError) {
          console.log(`Error for track ${track.name}:`, trackError.message);
          // Fallback to the old method if we can't retrieve details
          const collaborators = track.artists
            .filter(artist => artist.id !== artistId && !isGenericArtist(artist.name))
            .map(artist => ({
              name: artist.name,
              id: artist.id,
              role: 'artist'
            }));

          if (collaborators.length > 0) {
            const key = `${track.name}-${track.album.name}-${collaborators[0].name}`;
            if (!seen.has(key)) {
              seen.add(key);
              collaborations.push({
                trackName: track.name,
                albumName: track.album.name,
                releaseDate: track.album.release_date,
                collaborators: collaborators,
                spotifyUrl: track.external_urls.spotify,
                albumImage: track.album.images[0]?.url,
                popularity: track.popularity,
                source: 'search'
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.log('Erreur recherche:', error.message);
  }

  // Enhanced search for missed collaborations
  try {
    // Search for tracks with the artist name + common collaboration keywords
    const enhancedSearchTerms = [
      `"${artistName}" feat`,
      `"${artistName}" featuring`,
      `feat "${artistName}"`,
      `featuring "${artistName}"`,
      `"${artistName}" ft`,
      `ft "${artistName}"`
    ];

    for (const searchTerm of enhancedSearchTerms) {
      try {
        const enhancedSearchResponse = await axios.get(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=track&limit=30`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        for (const track of enhancedSearchResponse.data.tracks.items) {
          const hasOurArtist = track.artists.some(artist => artist.id === artistId);
          if (hasOurArtist && track.artists.length > 1) {
            const collaborators = track.artists
              .filter(artist => artist.id !== artistId && !isGenericArtist(artist.name))
              .map(artist => ({
                name: artist.name,
                id: artist.id,
                role: 'artist'
              }));

            if (collaborators.length > 0) {
              const key = `${track.name}-${track.album.name}-${collaborators[0].name}`;
              if (!seen.has(key)) {
                seen.add(key);
                collaborations.push({
                  trackName: track.name,
                  albumName: track.album.name,
                  releaseDate: track.album.release_date,
                  collaborators: collaborators,
                  spotifyUrl: track.external_urls.spotify,
                  albumImage: track.album.images[0]?.url,
                  popularity: track.popularity,
                  source: 'enhanced_search'
                });
              }
            }
          }
        }
      } catch (termError) {
        console.log(`Error with search term "${searchTerm}":`, termError.message);
      }
    }
  } catch (error) {
    console.log('Error enhanced search:', error.message);
  }

  // Specific search for multi-artist tracks
  try {
    // Search for tracks that might have multiple artists including our artist
    const multiArtistSearchResponse = await axios.get(
      `https://api.spotify.com/v1/search?q="${encodeURIComponent(artistName)}"&type=track&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    for (const track of multiArtistSearchResponse.data.tracks.items) {
      const hasOurArtist = track.artists.some(artist => artist.id === artistId);
      
      // Look for tracks with our artist and at least 2 other artists (multi-collaboration)
      if (hasOurArtist && track.artists.length >= 2) {
        const collaborators = track.artists
          .filter(artist => artist.id !== artistId && !isGenericArtist(artist.name))
          .map(artist => ({
            name: artist.name,
            id: artist.id,
            role: 'artist'
          }));

        if (collaborators.length > 0) {
          const key = `${track.name}-${track.album.name}-${collaborators.map(c => c.name).join('-')}`;
          if (!seen.has(key)) {
            seen.add(key);
            collaborations.push({
              trackName: track.name,
              albumName: track.album.name,
              releaseDate: track.album.release_date,
              collaborators: collaborators,
              spotifyUrl: track.external_urls.spotify,
              albumImage: track.album.images[0]?.url,
              popularity: track.popularity,
              isMultiArtist: collaborators.length > 1,
              source: 'multi_artist_search'
            });
          }
        }
      }
    }
  } catch (error) {
    console.log('Error multi-artist search:', error.message);
  }

  // Bidirectional artist collaboration search
  try {
    // Dynamic search based on the artist's actual collaborators found so far
    const knownCollaborators = [...new Set(collaborations.flatMap(collab => 
      collab.collaborators ? collab.collaborators.map(c => c.name) : []
    ))];

    // Only search if we have some collaborators to work with
    if (knownCollaborators.length > 0) {
      const targetCollaborators = knownCollaborators.slice(0, 10); // Limit to top 10 to avoid too many requests

      for (const collaborator of targetCollaborators) {
        // Skip if it's the same artist
        if (collaborator.toLowerCase() === artistName.toLowerCase()) continue;

        const bidirectionalSearchTerms = [
          `"${artistName}" "${collaborator}"`,
          `"${collaborator}" "${artistName}"`,
          `${artistName} ${collaborator}`,
          `${collaborator} ${artistName}`,
          `${artistName} feat ${collaborator}`,
          `${collaborator} feat ${artistName}`,
          `${artistName} featuring ${collaborator}`,
          `${collaborator} featuring ${artistName}`
        ];

        for (const searchTerm of bidirectionalSearchTerms.slice(0, 4)) { // Limit search terms to avoid rate limits
          try {
            const bidirectionalSearchResponse = await axios.get(
              `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=track&limit=10`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            for (const track of bidirectionalSearchResponse.data.tracks.items) {
              const hasOurArtist = track.artists.some(artist => artist.id === artistId);
              if (hasOurArtist && track.artists.length > 1) {
                const collaborators = track.artists
                  .filter(artist => artist.id !== artistId && !isGenericArtist(artist.name))
                  .map(artist => ({
                    name: artist.name,
                    id: artist.id,
                    role: 'artist'
                  }));

                if (collaborators.length > 0) {
                  const key = `${track.name}-${track.album.name}-${collaborators.map(c => c.name).join('-')}`;
                  if (!seen.has(key)) {
                    seen.add(key);
                    collaborations.push({
                      trackName: track.name,
                      albumName: track.album.name,
                      releaseDate: track.album.release_date,
                      collaborators: collaborators,
                      spotifyUrl: track.external_urls.spotify,
                      albumImage: track.album.images[0]?.url,
                      popularity: track.popularity,
                      isMultiArtist: collaborators.length > 1,
                      source: 'bidirectional_search',
                      searchTerm: searchTerm
                    });
                  }
                }
              }
            }
          } catch (termError) {
            console.log(`Error with bidirectional search term "${searchTerm}":`, termError.message);
          }
        }
      }
    }
  } catch (error) {
    console.log('Error bidirectional search:', error.message);
  }

  return {
    artist: artistName,
    collaborations: collaborations.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate)),
    totalCollaborations: collaborations.length,
    searchSources: ['appears_on', 'appears_on_tracks', 'own_albums', 'search_with_details', 'enhanced_search', 'multi_artist_search', 'bidirectional_search']
  };
}

async function findCollaborationBetweenArtists(artist1Name, artist2Name) {
  const token = await getAccessToken();
  const collaborations = [];
  const seen = new Set();

  try {
    // Search terms to find collaborations between the two artists
    const searchTerms = [
      `"${artist1Name}" "${artist2Name}"`,
      `"${artist2Name}" "${artist1Name}"`,
      `${artist1Name} ${artist2Name}`,
      `${artist2Name} ${artist1Name}`,
      `${artist1Name} feat ${artist2Name}`,
      `${artist2Name} feat ${artist1Name}`,
      `${artist1Name} featuring ${artist2Name}`,
      `${artist2Name} featuring ${artist1Name}`,
      `${artist1Name} ft ${artist2Name}`,
      `${artist2Name} ft ${artist1Name}`
    ];

    for (const searchTerm of searchTerms) {
      try {
        const searchResponse = await axios.get(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=track&limit=20`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        for (const track of searchResponse.data.tracks.items) {
          // Check if both artists appear on this track
          const artistNames = track.artists.map(artist => artist.name.toLowerCase());
          const hasArtist1 = artistNames.some(name => 
            name.includes(artist1Name.toLowerCase()) || artist1Name.toLowerCase().includes(name)
          );
          const hasArtist2 = artistNames.some(name => 
            name.includes(artist2Name.toLowerCase()) || artist2Name.toLowerCase().includes(name)
          );

          if (hasArtist1 && hasArtist2) {
            const key = `${track.name}-${track.album.name}`;
            if (!seen.has(key)) {
              seen.add(key);
              collaborations.push({
                trackName: track.name,
                albumName: track.album.name,
                releaseDate: track.album.release_date,
                artists: track.artists.map(artist => ({
                  name: artist.name,
                  id: artist.id
                })),
                spotifyUrl: track.external_urls.spotify,
                albumImage: track.album.images[0]?.url,
                popularity: track.popularity,
                searchTerm: searchTerm
              });
            }
          }
        }
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
    collaborations: collaborations.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate)),
    hasCollaboration: collaborations.length > 0,
    totalFound: collaborations.length
  };
}

module.exports = { getArtistCollaborations, findCollaborationBetweenArtists };
