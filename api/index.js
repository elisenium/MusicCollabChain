const express = require('express');
const logger = require('morgan');
const cors = require('cors');
require('dotenv').config();

const spotifyRoutes = require('./routes/spotify');

const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:5173', // Frontend Vite in dev mode
    'http://localhost:3000', // Alternative locale
    // Add your production domain here later
    // 'https://your-site.com'
  ],
};

// Middleware
app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());

app.use('/api/spotify', spotifyRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
