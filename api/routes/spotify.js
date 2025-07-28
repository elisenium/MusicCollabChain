const express = require('express');
const router = express.Router();
const {
  getArtistCollaborations,
  findCollaborationBetweenArtists,
  searchArtists,
} = require('../services/spotifyService');

router.get('/collaborations/:artistId', async (req, res) => {
  try {
    const data = await getArtistCollaborations(req.params.artistId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch collaborations' });
  }
});

// Route for game: check if two artists have collaborated
router.get('/collaboration-check/:artist1/:artist2', async (req, res) => {
  try {
    const { artist1, artist2 } = req.params;
    const data = await findCollaborationBetweenArtists(
      decodeURIComponent(artist1),
      decodeURIComponent(artist2)
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check collaboration' });
  }
});

// Route for artist search (autocomplete)
router.get('/search-artists/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const data = await searchArtists(decodeURIComponent(query));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search artists' });
  }
});

module.exports = router;
