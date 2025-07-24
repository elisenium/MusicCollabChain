const express = require('express');
const router = express.Router();
const { getArtistCollaborations, findCollaborationBetweenArtists } = require('../services/spotifyService');

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
    const data = await findCollaborationBetweenArtists(decodeURIComponent(artist1), decodeURIComponent(artist2));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check collaboration' });
  }
});

module.exports = router;
