import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import PuppeteerScraper from './Components/puppeteer.js';
import GeminiAiApi from './Components/GeminiAiApi.js';

// API Class
class YoutubeTitleAPI {
  constructor() {
    console.log("YoutubeTitleAPI constructor called"); // DEBUG: Constructor start
    this.app = express();
    this.port = 3000;
    this.scraper = new PuppeteerScraper();

    this.videoTitles = null;
    this.generatedTitle = null;
    this.context = null;
    this.key = null; // Store the API key

    this.model = null;

    // Middleware
    this.app.use(cors());
    this.app.use(bodyParser.json());

    // Define routes
    this.initializeRoutes();
    console.log("YoutubeTitleAPI constructor finished"); // DEBUG: Constructor end
  }

  // Initialize routes
  initializeRoutes() {
    console.log("Initializing routes..."); // DEBUG: Route initialization start
    this.app.post('/startbrowser', this.startBrowser.bind(this));
    this.app.get('/scrape', this.scrapeTitles.bind(this));
    this.app.post('/generatetitle', this.generateTitle.bind(this));
    this.app.post('/setcontext', this.setContext.bind(this));
    this.app.post('/setmodel', this.setModel.bind(this));
    // (Optionally, remove separate API key endpoint if not needed)
    // this.app.post('/setapikey', this.setApiKey.bind(this));
    console.log("Routes initialized."); // DEBUG: Route initialization end
  }

  // Start browser and navigate to a predefined URL (no parameters required)
  async startBrowser(req, res) {
    const url = "https://www.youtube.com"; // Predefined URL
    console.log("Endpoint /startbrowser called"); // DEBUG: startBrowser endpoint hit

    try {
      console.log("Starting browser..."); // DEBUG: Browser start action
      await this.scraper.startBrowser(url);
      console.log(`Browser started and navigated to ${url}`); // DEBUG: Browser started successfully
      res.json({ message: `Browser started and navigated to ${url}` });
    } catch (error) {
      console.error('Error starting browser:', error);
      res.status(500).json({ error: 'Failed to start the browser.' });
    }
  }

  // Scrape video titles
  async scrapeTitles(req, res) {
    console.log("Endpoint /scrape called"); // DEBUG: scrapeTitles endpoint hit
    try {
      console.log("Triggering scraping..."); // DEBUG: Scraping action
      const videoTitles = await this.scraper.triggerScrape();
      this.videoTitles = videoTitles;
      console.log("Scraping completed successfully."); // DEBUG: Scraping success
      res.sendStatus(200);
    } catch (error) {
      console.error('Error scraping titles:', error);
      res.status(500).json({ error: 'Failed to scrape video titles.' });
    }
  }

  // Set the model based on the API key and model selection provided in the request
  async setModel(req, res) {
    console.log("Endpoint /setmodel called"); // DEBUG: setModel endpoint hit
    const { key, modelKey } = req.body;
    console.log("Request body:", req.body); // DEBUG: Log request body

    // Validate inputs
    if (!key || typeof key !== 'string') {
      console.warn("Invalid API key provided in /setmodel request."); // DEBUG: API Key validation failed
      return res.status(400).json({ error: 'Invalid API key provided.' });
    }
    if (!modelKey || typeof modelKey !== 'string') {
      console.warn("Invalid model key provided in /setmodel request."); // DEBUG: Model Key validation failed
      return res.status(400).json({ error: 'Invalid model key provided.' });
    }

    // Save the API key
    this.key = key;
    console.log(`Received API key: ${this.key} and model key: ${modelKey}`);

    // Configure the model based on the model selection
    if (modelKey === "G2Tk") {
      this.model = new GeminiAiApi(this.key, "gemini-2.0-flash-thinking-exp-01-21");
    }else if(modelKey == "g2F"){
      this.model = new GeminiAiApi(this.key, "gemini-2.0-flash")
    }
    console.log(`Model set to ${modelKey} successfully.`); // DEBUG: Model set successfully
    res.json({ message: `API key and model key received and model set successfully` });
  }

  // Set context function
  async setContext(req, res) {
    console.log("Endpoint /setcontext called"); // DEBUG: setContext endpoint hit
    const { context } = req.body;
    console.log("Context received:", context); // DEBUG: Log received context

    if (!context || typeof context !== 'string') {
      console.warn("Invalid context provided in /setcontext request."); // DEBUG: Context validation failed
      return res.sendStatus(400); // Bad Request
    }

    try {
      this.context = context;
      console.log("Context set successfully."); // DEBUG: Context set success
      res.sendStatus(200); // OK
    } catch (error) {
      console.error('Error setting context:', error);
      if (!res.headersSent) {
        res.sendStatus(500);
      }
    }
  }

  // Generate a catchy title based on video titles and context
  async generateTitle(req, res) {
    console.log("Endpoint /generatetitle called"); // DEBUG: generateTitle endpoint hit
    const videoTitles = this.videoTitles;
    const context = this.context;
    //const { key } = req.body; // No longer expecting key in generateTitle request
    const ai = this.model; // Use the model instance stored in 'this.model'

    console.log("Video Titles:", videoTitles); // DEBUG: Log video titles
    console.log("Context:", context); // DEBUG: Log context

    if (!ai) {
      console.warn("AI Model is not initialized when /generatetitle called."); // DEBUG: AI Model not initialized
      return res.status(400).json({ error: 'AI Model is not initialized. Please set API key and model.' });
    }

    if (!videoTitles || !Array.isArray(videoTitles)) {
      console.warn("Invalid video titles array when /generatetitle called:", videoTitles); // DEBUG: Invalid video titles
      return res.status(400).json({ error: 'Video titles array is required.' });
    }

    if (!context) {
      console.warn("Missing context when /generatetitle called."); // DEBUG: Missing context
      return res.status(400).json({ error: 'Context is required.' });
    }

    try {
      console.log("Calling AI model to generate title..."); // DEBUG: Calling AI Model
      const generatedTitle = await ai.generateTitle(videoTitles, context);
      console.log("Generated title received from AI:", generatedTitle); // DEBUG: Generated title received

      res.json({ generatedTitle });
    } catch (error) {
      console.error('Error generating title:', error);
      res.status(500).json({ error: 'Failed to generate title.' });
    }
  }

  // Start the server
  startServer() {
    this.app.listen(this.port, () => {
      console.log(`Server running on http://localhost:${this.port}`); // DEBUG: Server start
    });
  }
}

// Instantiate and start the API server
const youtubeAPI = new YoutubeTitleAPI();
youtubeAPI.startServer();