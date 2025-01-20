import { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";
import debounce from "lodash/debounce";
import Lottie from "lottie-react";
import animation from "./assets/poopanimation.json";
import fartsound from "./assets/fartsound.mp3"; // Import the audio file

function App() {
  const [prompt, setPrompt] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState([]);
  const [message, setMessage] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [apiKey, setApiKey] = useState(""); // Initialize state for apiKey

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
      await axios.post("http://localhost:3000/setcontext", {
        context: newPrompt,
      });
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
      const response = await axios.post("http://localhost:3000/generatetitle", {
        key: apiKey, // Use the apiKey state
      });
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
        <div className="ui-row">
          <h1 className="fade-in">YouTube Title Generator</h1>
          <Lottie animationData={animation} className="poop-header" />
        </div>
      ) : (
        <div className="ui-row">
          {/* Main UI */}
          <div className="api-key-container ui-row">
            <label htmlFor="apiKey">API Key:</label>
            <textarea
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              rows="1"
              cols="50"
              placeholder="Enter your API key here"
            />
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
  
          <div className="ui-row">
            {generatedTitle.length > 0 ? (
              generatedTitle.map((data, index) => (
                <div key={index} className="ui-row">
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
          {message && <div className="ui-row"><p>{message}</p></div>}
        </div>
      )}
    </div>
  );  
}

export default App;
