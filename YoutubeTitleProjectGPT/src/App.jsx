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
  const [apiKey, setApiKey] = useState(""); // API key state
  const [isScraping, setIsScraping] = useState(false);

  const audioRef = useRef(null); // Reference for controlling the audio

  // Function to update API key on server when leaving the textbox
  const updateApiKey = (key) => {
    axios
      .post("http://localhost:3000/setapikey", { key })
      .then(() => console.log("API key updated successfully"))
      .catch((error) =>
        console.error("Error updating API key on server:", error)
      );
  };

  // Optionally, you can debounce the API call on blur if needed
  // const debouncedUpdateApiKey = debounce(updateApiKey, 1000);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play(); // Play the audio
    }
  };

  // Show the intro title and hide it after 1 second
  useEffect(() => {
    setShowTitle(true);
    const timer = setTimeout(() => {
      setShowTitle(false);
    }, 1000);
    return () => clearTimeout(timer);
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
    setIsScraping(true);
    try {
      await axios.get("http://localhost:3000/scrape");
      setMessage("Scraping started.");
    } catch (error) {
      console.error("Error scraping browser:", error);
      setMessage("Failed to scrape browser.");
    } finally {
      setTimeout(() => {
        setIsScraping(false);
      }, 500); // Delay before hiding the spinner
    }
  };

  // Debounced function for updating context on prompt changes
  const debouncedSetContext = debounce(async (newPrompt) => {
    try {
      await axios.post("http://localhost:3000/setcontext", { context: newPrompt });
      console.log("Context set successfully");
    } catch (error) {
      console.error("Error setting context:", error);
    }
  }, 500);

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
        key: apiKey,
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
              onBlur={() => updateApiKey(apiKey)}
              rows="1"
              cols="50"
              placeholder="Enter your API key here"
            />
            <button onClick={handlePlay}>uhhhh</button>
            <button onClick={handleOpenBrowser}>Open Browser</button>
            <button onClick={handleScrapeBrowser} disabled={isScraping}>
              {isScraping ? (
                <span>
                  Scraping...
                  <span className="loading-spinner"></span>
                </span>
              ) : (
                "Scrape Browser"
              )}
            </button>
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
          {message && (
            <div className="ui-row">
              <p>{message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
