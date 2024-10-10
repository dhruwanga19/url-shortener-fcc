const express = require("express");
const serverless = require("serverless-http");
const dns = require("dns");
const url = require("url");
const cors = require("cors");

const app = express();

// In-memory storage for URL mappings (Note: This will reset on each function invocation)
const urlDatabase = new Map();
let counter = 1;

app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Helper function to validate URL
function isValidUrl(string) {
  try {
    const newUrl = new URL(string);
    return newUrl.protocol === "http:" || newUrl.protocol === "https:";
  } catch (err) {
    return false;
  }
}

// POST endpoint to create short URL
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  if (!isValidUrl(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  const hostname = new URL(originalUrl).hostname;
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    const shortUrl = counter++;
    urlDatabase.set(shortUrl.toString(), originalUrl);

    res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});

// GET endpoint to redirect to original URL
app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase.get(shortUrl);

  if (originalUrl) {
    // res.json({ original_url: originalUrl });
    res.redirect(originalUrl);
  } else {
    res.json({ error: "No short URL found for the given input" });
  }
});

module.exports.handler = serverless(app);
