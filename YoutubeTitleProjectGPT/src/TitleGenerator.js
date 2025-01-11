import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import PuppeteerScraper from './assets/Components/puppeteer.js';
import TitleGenerator from './assets/Components/AiApi.js';

// API Class
class YoutubeTitleAPI {
  constructor() {
    this.app = express();
    this.port = 3000;
    this.scraper = new PuppeteerScraper();
    this.ai = new TitleGenerator("AIzaSyArl5Qrx8sskxDOTqdw2ZznDQHf3qOnQlU"); // Replace with your API key

    this.videoTitles = null
    this.generatedTitle = null
    this.context = null
    


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
    this.app.post('/setcontext', this.setContext.bind(this))
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
      this.videoTitles = videoTitles
      res.sendStatus(200);
    } catch (error) {
      console.error('Error scraping titles:', error);
      res.status(500).json({ error: 'Failed to scrape video titles.' });
    }
  }
  

  // Set context function
  async setContext(req, res) {
    const { context } = req.body;

    // Validate input
    if (!context || typeof context !== 'string') {
      res.sendStatus(400)
    }
    try {
      // Set the context
      this.context = context;
      res.sendStatus(200); // Send 200 OK status with no body
    } catch (error) {
      console.error('Error setting context:', error);
      res.status(500).json({ error: 'Failed to set context.' });
    }
  }

  // Generate a catchy title based on video titles and context
  async generateTitle(req, res) {
    const videoTitles = this.videoTitles
    const context = this.context

    if (!videoTitles || !Array.isArray(videoTitles)) {
      return res.status(400).json({ error: 'Video titles array is required.' });
    }

    if (!context) {
      return res.status(400).json({ error: 'Context is required.' });
    }

    try {
      const generatedTitle = await this.ai.generateTitle(videoTitles, context);
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
