const puppeteer = require('puppeteer')

// Puppeteer class to handle browser interactions
class PuppeteerScraper {
  constructor() {
    this.headless = false;
    this.browser = null;
    this.page = null;
  }

  // Start the browser and open the page once, then keep it open
  async startBrowser(url) {
    try {
      // Launch the browser
      this.browser = await puppeteer.launch({
        headless: this.headless,
        args: ['--mute-audio'],
        defaultViewport: null,
      });

      // Open a new page
      this.page = await this.browser.newPage();
      await this.page.goto(url);
      console.log(`Browser opened and navigated to ${url}`);
    } catch (error) {
      console.error('Error starting browser:', error);
    }
  }

  // Method to trigger scraping of the HTML
  async triggerScrape() {
    if (!this.page) {
      console.log('Browser not initialized. Call startBrowser() first.');
      return;
    }

    const pageUrl = await this.page.url();

    if(pageUrl.startsWith('https://www.youtube.com/results?search_query=')) {
      try {
        // Extract video titles and additional span text from the search results page
        const videoTitles = await this.page.evaluate(() => {
          // Query all video title elements on the search results page
          const titleElements = document.querySelectorAll('ytd-video-renderer h3.title-and-badge yt-formatted-string');
          // Query all the span elements with the desired class
          const anchorElements = document.querySelectorAll('a.shortLockupViewModelHostEndpoint.shortLockupViewModelHostOutsideMetadataEndpoint');;

  
          // Map over the NodeList of video titles and span text
          const titles = Array.from(titleElements).map(el => el.textContent.trim());
          const titles1 = Array.from(anchorElements).map(el => el.getAttribute('title').trim());
  
          // Combine both arrays (video titles and additional span text)
          return [...titles, ...titles1];
        });
  
        // Log or return the extracted titles and span text
        console.log('Captured Video Titles and Span Texts:', videoTitles);
        return videoTitles;
      } catch (error) {
        console.error('Error scraping video titles and span texts from search results:', error);
      }
    }
    else{
      try {
          // Extract video titles
          const videoTitles = await this.page.evaluate(() => {
            // Query all elements with the desired id
            const elements = document.querySelectorAll('yt-formatted-string#video-title.style-scope.ytd-rich-grid-media');
            // Map over the NodeList and extract the text content of each element
            return Array.from(elements).map(el => el.textContent.trim());
          });
      
          // console.log('Captured Video Titles:', videoTitles);
          return videoTitles;
        } catch (error) {
          console.error('Error scraping video titles:', error);
        }
      }
    }

  // Method to close the browser
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      console.log('Browser closed');
    }
  }
}



// Example usage within the class itself
// async function run() {
//   text = ""

//   const scraper = new PuppeteerScraper();  // Pass 'true' for headless mode
//   await scraper.triggerScrape();  // Trigger scrape after sleep
// }


module.exports = PuppeteerScraper;