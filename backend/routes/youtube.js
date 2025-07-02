const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const response = await youtube.search.list({
      part: 'snippet',
      q: `${q} recipe`,
      type: 'video',
      maxResults: 3,
      videoEmbeddable: true,
      videoDuration: 'medium'
    });

    if (!response.data.items || response.data.items.length === 0) {
      // Return valid JSON with error message
      return res.json({ error: 'No video found' });
    }

    const videoId = response.data.items[0].id.videoId;
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

    res.json({ embedUrl });
  } catch (error) {
    console.error('YouTube API Error:', error);
    // Always return JSON, even for errors
    res.status(500).json({ 
      error: 'Failed to fetch video',
      details: error.message 
    });
  }
});

module.exports = router;