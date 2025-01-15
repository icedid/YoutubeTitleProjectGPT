const React = require("react"); // Import React
const { useState, useEffect, useRef } = require("react"); // Import hooks from React
const axios = require("axios");
const debounce = require("lodash/debounce");
const Lottie = require("lottie-react");
const animation = require("./assets/poopanimation.json");
const fartsound = require("./assets/fartsound.mp3");

function App() {
  const [prompt, setPrompt] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState([]);
  const [message, setMessage] = useState("");
  const [showTitle, setShowTitle] = useState(false);

  const audioRef = useRef(null); // Reference for controlling the audio

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play(); // Play the audio
    }
  };

  // Set the title visibility to true and hide it after 1 second
  useEffect(() => {
    setShowTitle(true); // Show the intro title

    const timer = setTimeout(() => {
      setShowTitle(false);
    }, 1000); // Hide the title after 1 second

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, []);

  const handleOpenBrowser = async () => {
    try {
      const response = await axios.post("http://localhost:3000/startbrowser");
      setMessage(response.data.message);
    } catch (error) {
      console.error("Error opening browser:", error);
      setMessage("Failed to open browser.");
    }
  };

  const handleScrapeBrowser = async () => {
    try {
      await axios.get("http://localhost:3000/scrape");
      setMessage("Scraping started.");
    } catch (error) {
      console.error("Error scraping browser:", error);
      setMessage("Failed to scrape browser.");
    }
  };

  const debouncedSetContext = debounce(async (newPrompt) => {
    try {
      await axios.post("http://localhost:3000/setcontext", { context: newPrompt });
      console.log("Context set successfully");
    } catch (error) {
      console.error("Error setting context:", error);
    }
  }, 500); // Debounce to avoid multiple API calls

  const handlePromptChange = (event) => {
    const newPrompt = event.target.value;
    setPrompt(newPrompt);
    debouncedSetContext(newPrompt);
  };

  const handleGenerateTitle = async () => {
    try {
      const context = prompt;
      await axios.post("http://localhost:3000/setcontext", { context });
      const response = await axios.post("http://localhost:3000/generatetitle");
      const separatedData = response.data.generatedTitle.map((item) => ({
        rationale: item[0],
        title: item[1],
      }));
      setGeneratedTitle(separatedData);
    } catch (error) {
      console.error("Error generating title:", error);
      setGeneratedTitle([]);
    }
  };

  return (
    <div className="app-container">
      <audio ref={audioRef} src={fartsound} preload="auto" />
      {/* Intro animation */}
      {showTitle ? (
        <div>
          <h1 className="fade-in">YouTube Title Generator</h1>
          <Lottie animationData={animation} className="poop-header" />
        </div>
      ) : (
        <div>
          {/* Main UI */}
          <div className="ui-row">
            <button onClick={handlePlay}>Free Candy</button>
            <button onClick={handleOpenBrowser}>Open Browser</button>
            <button onClick={handleScrapeBrowser}>Scrape Browser</button>
          </div>

          <div className="ui-row">
            <textarea
              placeholder="Enter Prompt"
              value={prompt}
              onChange={handlePromptChange}
              rows="4"
              cols="50"
            />
            <button onClick={handleGenerateTitle}>Generate Title</button>
          </div>

          <div>
            {generatedTitle.length > 0 ? (
              generatedTitle.map((data, index) => (
                <div key={index} style={{ marginBottom: "20px" }}>
                  <p>
                    <strong>Rationale:</strong> {data.rationale}
                  </p>
                  <p>
                    <strong>Title:</strong> {data.title}
                  </p>
                </div>
              ))
            ) : (
              <p>No titles generated yet.</p>
            )}
          </div>

          {/* Message display */}
          {message && <p>{message}</p>}
        </div>
      )}
    </div>
  );
}

module.exports = App; // Export the component
