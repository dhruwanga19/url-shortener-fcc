const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const dns = require("dns");
const { URL } = require("url");

const app = express();

// In-memory storage for URL mappings (Note: This will reset on each function invocation)
const urlDatabase = new Map();
let counter = 1;

// Enable CORS for all routes
app.use(cors());

// Helper function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

// POST endpoint to create short URL
app.post("/api/shorturl", async (req, res) => {
  // Netlify Functions automatically parse the body
  const { url: originalUrl } = req.body;

  if (!isValidUrl(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  const urlObject = new URL(originalUrl);

  try {
    await new Promise((resolve, reject) => {
      dns.lookup(urlObject.hostname, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const shortUrl = counter++;
    urlDatabase.set(shortUrl.toString(), originalUrl);

    res.json({ original_url: originalUrl, short_url: shortUrl });
  } catch (error) {
    res.json({ error: "invalid url" });
  }
});

// GET endpoint to redirect to original URL
app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase.get(shortUrl);

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: "No short URL found for the given input" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports.handler = serverless(app);
