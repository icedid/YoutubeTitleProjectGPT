import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import axios from "axios";
import debounce from "lodash/debounce";
import Lottie from "lottie-react";
import animation from "./assets/poopanimation.json";
import fartsound from "./assets/fartsound.mp3"; // Import the audio file

function App() {
  // Main state variables (same as before)
  const [prompt, setPrompt] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState([]);
  const [message, setMessage] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [showModal, setShowModal] = useState(true); // Modal state
  const [mainUIData, setMainUIData] = useState(null); // Store API key and model
  // New state for initial Intro Screen visibility
  const [showInitialIntro, setShowInitialIntro] = useState(true);

  const audioRef = useRef(null);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  // Merged useEffect for intro screen and title animation
  useEffect(() => {
    setShowTitle(true); // Immediately show the title (fade-in animation starts)
    const timer = setTimeout(() => {
      setShowTitle(false);        // Hide the title after 1 second (fade-out animation if any)
      setShowInitialIntro(false); // Hide the entire Intro Screen after 1 second
    }, 500);
    return () => clearTimeout(timer); // Cleanup function to clear the timeout
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

  const handleSelectChange = (event) => {
    setSelectedOption(event.target.value);
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
      }, 500);
    }
  };

  const debouncedSetContext = useCallback(
    debounce(async (newPrompt) => {
      try {
        await axios.post("http://localhost:3000/setcontext", {
          context: newPrompt,
        });
        console.log("Context set successfully");
      } catch (error) {
        console.error("Error setting context:", error);
      }
    }, 500),
    []
  );

  const handlePromptChange = (event) => {
    const newPrompt = event.target.value;
    setPrompt(newPrompt);
    debouncedSetContext(newPrompt);
  };

  function dataToArray(data) {
    // ... (same dataToArray function) ...
    const generatedTitleString = data?.generatedTitle;
    if (!generatedTitleString) {
      console.warn("generatedTitle string is missing in response data:", data);
      return [];
    }
    const jsonStrings = generatedTitleString.trim().split("\n");
    const result = [];
    for (const jsonString of jsonStrings) {
      if (jsonString.trim() === "") continue;
      try {
        const item = JSON.parse(jsonString);
        const rationale = item.rationale;
        const title = item.title;
        result.push([rationale, title]);
      } catch (e) {
        console.error("Error parsing JSON string:", jsonString, e);
        continue;
      }
    }
    return result;
  }

  const handleGenerateTitle = async () => {
    try {
      await axios.post("http://localhost:3000/setcontext", { context: prompt });
      const response = await axios.post("http://localhost:3000/generatetitle", {
        key: apiKey,
      });

      console.log("Response from /generatetitle:", response);
      const separatedData = dataToArray(response.data);
      console.log("Separated data after dataToArray:", separatedData);

      setGeneratedTitle([]);
      separatedData.forEach((item, index) => {
        setTimeout(() => {
          setGeneratedTitle((prev) => [...prev, item]);
        }, index * 300);
      });
    } catch (error) {
      console.error("Error generating title:", error);
      setGeneratedTitle([]);
    }
  };

  const handleModalClose = (modalData) => {
    setMainUIData(modalData); // Store API key and model from modal
    setShowModal(false);
  };


  const renderIntroScreen = () => (
    <div className="ui-row">
      {showTitle ? (
        <>
          <h1 className="fade-in">YouTube Title Generator</h1>
          <Lottie animationData={animation} className="poop-header" />
        </>
      ) : null}
    </div>
  );

  const renderModalOverlay = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Welcome to YouTube Title Generator</h2>
        <label htmlFor="dropdown">Select the Model:</label>
        <select
          id="dropdown"
          value={selectedOption}
          onChange={handleSelectChange}
        >
          <option value="G2Tk">Gemini 2 Thinking</option>
          <option value="g2F">Gemini 2 Flash</option>
        </select>
        <br />
        <label htmlFor="apiKey">API Key:</label>
        <textarea
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          rows="1"
          cols="50"
          placeholder="Enter your API key here"
        />
        <br />
        <button onClick={() => handleModalClose({ apiKey, modelKey: selectedOption })}>
          Next
        </button>
      </div>
    </div>
  );

  const renderMainAppUI = () => (
    <div className="ui-row">
      <div className="button-row">
        <button onClick={handlePlay}>Play Sound</button>
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
      <div className="input-row">
        <textarea
          placeholder="Enter Prompt"
          value={prompt}
          onChange={handlePromptChange}
          rows="4"
          cols="50"
        />
        <button onClick={handleGenerateTitle}>Generate Title</button>
      </div>
      <div className="results-row">
        {generatedTitle.length > 0 ? (
          generatedTitle.map((data, index) => (
            <div
              key={index}
              className="result fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <p className="rationale">
                <strong>Rationale:</strong> {data[0]}
              </p>
              <p className="title">
                <strong>Title:</strong> {data[1]}
              </p>
            </div>
          ))
        ) : (
          <p className="no-results-text">No titles generated yet.</p>
        )}
      </div>

      {message && (
        <div className="message-row">
          <p>{message}</p>
        </div>
      )}
    </div>
  );


  return (
    <div className="app-container">
      <audio ref={audioRef} src={fartsound} preload="auto" />

      {/* Conditionally render based on showInitialIntro first */}
      {showInitialIntro ? (
        renderIntroScreen() // Show Intro Screen for 1 second
      ) : showModal ? (
        renderModalOverlay()
      ) : mainUIData ? (
        renderMainAppUI()
      ) : (
        renderIntroScreen()
      )}
    </div>
  );
}

export default App;