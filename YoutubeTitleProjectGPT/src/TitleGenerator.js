import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import PuppeteerScraper from './Components/puppeteer.js';
import GeminiAiApi from './Components/GeminiAiApi.js';

// API Class
class YoutubeTitleAPI {
  constructor() {
    this.app = express();
    this.port = 3000;
    this.scraper = new PuppeteerScraper();

    this.videoTitles = null;
    this.generatedTitle = null;
    this.context = null;
    this.key = null; // Store the API key

    this.modelRegistry = {
      gemini: (key) => new GeminiAiApi(key), // GeminiAiApi requires an API key
    };
    this.model = null;

    // Middleware
    this.app.use(cors());
    this.app.use(bodyParser.json());

    // Define routes
    this.initializeRoutes();
  }

  // Initialize routes
  initializeRoutes() {
    this.app.post('/startbrowser', this.startBrowser.bind(this));
    this.app.get('/scrape', this.scrapeTitles.bind(this));
    this.app.post('/generatetitle', this.generateTitle.bind(this));
    this.app.post('/setcontext', this.setContext.bind(this));
    this.app.post('/setmodel', this.setModel.bind(this));
    // New endpoint to set the API key
    this.app.post('/setapikey', this.setApiKey.bind(this));
  }

  // Start browser and navigate to a predefined URL (no parameters required)
  async startBrowser(req, res) {
    const url = "https://www.youtube.com";  // Predefined URL

    try {
      await this.scraper.startBrowser(url);
      res.json({ message: `Browser started and navigated to ${url}` });
    } catch (error) {
      console.error('Error starting browser:', error);
      res.status(500).json({ error: 'Failed to start the browser.' });
    }
  }

  // Scrape video titles
  async scrapeTitles(req, res) {
    try {
      const videoTitles = await this.scraper.triggerScrape();
      this.videoTitles = videoTitles;
      res.sendStatus(200);
    } catch (error) {
      console.error('Error scraping titles:', error);
      res.status(500).json({ error: 'Failed to scrape video titles.' });
    }
  }

  // Set the model based on the key provided in the request
  async setModel(req, res) {
    const { modelKey } = req.body;

    // Validate input
    if (!modelKey || typeof modelKey !== 'string') {
      return res.sendStatus(400); // Bad Request
    }

    // Check if the model exists in the registry
    if (!this.modelRegistry[modelKey]) {
      return res.sendStatus(404); // Not Found
    }

    // Set the model using the stored API key (if needed)
    this.model = this.modelRegistry[modelKey](this.key);
    res.sendStatus(200); // OK
  }

  // Set context function
  async setContext(req, res) {
    const { context } = req.body;
  
    // Validate input
    if (!context || typeof context !== 'string') {
      return res.sendStatus(400); // Bad Request
    }
  
    try {
      // Set the context
      this.context = context;
      res.sendStatus(200); // OK
    } catch (error) {
      console.error('Error setting context:', error);
      if (!res.headersSent) {
        res.sendStatus(500); // Internal Server Error
      }
    }
  }

  // New endpoint: set API key and store it in this.key
  async setApiKey(req, res) {
    const { key } = req.body;
    if (!key || typeof key !== 'string') {
      return res.sendStatus(400); // Bad Request if no key or invalid type
    }

    try {
      this.key = key;
      console.log(`API key updated to: ${this.key}`);
      res.sendStatus(200);
    } catch (error) {
      console.error('Error setting API key:', error);
      res.sendStatus(500);
    }
  }

  // Generate a catchy title based on video titles and context
  async generateTitle(req, res) {
    const videoTitles = this.videoTitles;
    const context = this.context;
    const { key } = req.body;
    console.log("currentKey:", key);

    // Use the model that should be set via setModel
    let ai = this.model;

    if (!videoTitles || !Array.isArray(videoTitles)) {
      return res.status(400).json({ error: 'Video titles array is required.' });
    }

    if (!context) {
      return res.status(400).json({ error: 'Context is required.' });
    }

    try {
      const generatedTitle = await ai.generateTitle(videoTitles, context);
      res.json({ generatedTitle });
    } catch (error) {
      console.error('Error generating title:', error);
      res.status(500).json({ error: 'Failed to generate title.' });
    }
  }

  // Start the server
  startServer() {
    this.app.listen(this.port, () => {
      console.log(`Server running on http://localhost:${this.port}`);
    });
  }
}

// Instantiate and start the API server
const youtubeAPI = new YoutubeTitleAPI();
youtubeAPI.startServer();
