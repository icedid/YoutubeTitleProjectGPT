import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import axios from "axios";
import debounce from "lodash/debounce";
import Lottie from "lottie-react";
import animation from "./assets/poopanimation.json";
import fartsound from "./assets/fartsound.mp3"; // Import the audio file

/**
 * App component - Main component of the YouTube Title Generator application.
 * It handles user input, API calls, UI rendering, and modal management.
 */
function App() {
  // Main state variables
  const [prompt, setPrompt] = useState(""); // User input prompt for title generation
  const [generatedTitle, setGeneratedTitle] = useState([]); // Array to store generated titles (each item is [rationale, title])
  const [message, setMessage] = useState(""); // Message to display feedback to the user
  const [showTitle, setShowTitle] = useState(false); // Controls visibility of the initial title animation
  const [apiKey, setApiKey] = useState(""); // Stores the API key input by the user
  const [isScraping, setIsScraping] = useState(false); // Tracks if the browser scraping process is active
  // State for dynamic model options in the dropdown
  const [modelOptions, setModelOptions] = useState([
    { value: "G2Tk", label: "Gemini 2 Thinking" },
    { value: "g2F", label: "Gemini 2 Flash" },
  ]);
  const [selectedOption, setSelectedOption] = useState(modelOptions[0].value); // Stores the selected model option from the dropdown
  const [showModal, setShowModal] = useState(true); // Controls visibility of the modal for API key and model selection
  const [mainUIData, setMainUIData] = useState(null); // Stores API key and model data after modal submission
  const [showInitialIntro, setShowInitialIntro] = useState(true); // Controls visibility of the initial intro screen




  const audioRef = useRef(null); // Ref to the audio element for playing sound effects

  /**
   * handlePlay - Plays the fart sound effect.
   */
  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  // Merged useEffect for intro screen and title animation
  useEffect(() => {
    setShowTitle(true); // Immediately show the title (fade-in animation starts)
    const timer = setTimeout(() => {
      setShowTitle(false);        // Hide the title after 500ms (fade-out animation if any)
      setShowInitialIntro(false); // Hide the entire Intro Screen after 500ms
    }, 500);
    return () => clearTimeout(timer); // Cleanup function to clear the timeout if component unmounts
  }, []); // Empty dependency array ensures this effect runs only once after initial render

  /**
   * handleOpenBrowser - Sends a request to the backend to open a browser.
   * Updates the message state to display the response.
   */
  const handleOpenBrowser = async () => {
    try {
      const response = await axios.post("http://localhost:3000/startbrowser");
      setMessage(response.data.message); // Set success message from backend response
    } catch (error) {
      console.error("Error opening browser:", error);
      setMessage("Failed to open browser."); // Set error message if request fails
    }
  };

  /**
   * handleSelectChange - Updates the selectedOption state when the dropdown value changes.
   * @param {Event} event - The change event from the dropdown.
   */
  const handleSelectChange = (event) => {
    setSelectedOption(event.target.value); // Update selectedOption state with the new value
  };

  /**
   * handleScrapeBrowser - Sends a request to the backend to start browser scraping.
   * Updates the message state and manages the isScraping state to indicate scraping status.
   */
  const handleScrapeBrowser = async () => {
    setIsScraping(true); // Indicate scraping is starting, disable button
    try {
      await axios.get("http://localhost:3000/scrape");
      setMessage("Scraping started."); // Set success message
    } catch (error) {
      console.error("Error scraping browser:", error);
      setMessage("Failed to scrape browser."); // Set error message if scraping fails
    } finally {
      setTimeout(() => {
        setIsScraping(false); // After a delay, indicate scraping is finished, enable button
      }, 500);
    }
  };

  /**
   * debouncedSetContext - Debounced function to send context (prompt) to the backend.
   * Uses lodash/debounce to limit the rate at which context is sent.
   */
  const debouncedSetContext = useCallback(
    debounce(async (newPrompt) => {
      try {
        await axios.post("http://localhost:3000/setcontext", {
          context: newPrompt, // Send the new prompt as context
        });
        console.log("Context set successfully");
      } catch (error) {
        console.error("Error setting context:", error);
      }
    }, 500), // Debounce for 500ms - wait 500ms after last call to execute
    [] // Empty dependency array ensures debounce is created only once
  );

  /**
   * handlePromptChange - Updates the prompt state and calls debouncedSetContext to send context.
   * @param {Event} event - The change event from the prompt textarea.
   */
  const handlePromptChange = (event) => {
    const newPrompt = event.target.value; // Get the new prompt value from the textarea
    setPrompt(newPrompt); // Update the prompt state
    debouncedSetContext(newPrompt); // Call debounced function to send context to backend
  };

  /**
   * dataToArray - Parses the generatedTitle string from the API response into an array of [rationale, title].
   * Handles potential errors in JSON parsing and missing data.
   * @param {object} data - The response data from the /generatetitle endpoint.
   * @returns {Array<Array<string>>} - An array of [rationale, title] pairs, or an empty array if parsing fails.
   */
  function dataToArray(data) {
    const generatedTitleString = data?.generatedTitle;
    console.log("generatedTitleString in dataToArray:", generatedTitleString);

    if (!generatedTitleString) {
      console.warn("generatedTitle string is missing in response data:", data);
      return [];
    }

    const jsonStrings = generatedTitleString.trim().split('\n\n\n'); // Split by triple newline
    console.log("jsonStrings after split:", jsonStrings);
    const result = [];

    for (let i = 0; i < jsonStrings.length; i++) {
      let jsonString = jsonStrings[i].trim(); // Trim each json string

      if (jsonString === "") {
        console.log("Skipping empty jsonString at index:", i);
        continue; // Skip empty lines
      }

      try {
        const item = JSON.parse(jsonString);
        console.log("Parsed JSON item:", item);
        const rationale = item.rationale;
        const title = item.title;
        if (rationale && title) {
          result.push([rationale, title]);
          console.log("Result array during parsing:", result);
        } else {
          console.warn("Missing 'rationale' or 'title' in parsed JSON, skipping:", item);
        }
      } catch (e) {
        console.error("Error parsing JSON string at index:", i, "string:", jsonString, "error:", e);
        console.error("Parsing error:", e);
        continue; // Skip to the next line if parsing fails
      }
    }
    console.log("Final result array from dataToArray:", result);
    return result;
  }

  /**
   * handleGenerateTitle - Sends a request to the backend to generate titles based on the prompt and selected model.
   * Updates the generatedTitle state with the received titles, displaying them with a staggered animation.
   */
  const handleGenerateTitle = async () => {
    try {
      await axios.post("http://localhost:3000/setcontext", { context: prompt }); // Ensure context is set before generating title
      const response = await axios.post("http://localhost:3000/generatetitle", {}); // Empty object

      console.log("Response from /generatetitle:", response);
      const separatedData = dataToArray(response.data); // Parse the response data into array format
      console.log("Separated data after dataToArray:", separatedData);

      setGeneratedTitle([]); // Clear previous titles before setting new ones
      separatedData.forEach((item, index) => {
        setTimeout(() => {
          setGeneratedTitle((prev) => [...prev, item]); // Add each title item to state with a delay for staggered animation
        }, index * 300); // Staggered delay based on index for fade-in effect
      });
    } catch (error) {
      console.error("Error generating title:", error);
      setGeneratedTitle([]); // Clear titles in case of error
    }
  };



  /**
   * handleModalClose - Handles closing of the modal and stores the API key and selected model.
   * @param {object} modalData - An object containing apiKey and modelKey from the modal input.
   */
  const handleModalClose = (modalData) => {
    setMainUIData(modalData); // Store API key and model from modal into mainUIData state
    setShowModal(false); // Hide the modal overlay

    try {
      const response = axios.post("http://localhost:3000/setmodel", {
        key: modalData.apiKey, // Send API key
        modelKey: modalData.modelKey, // Send selected model key
      });
      console.log("Model set successfully on backend:", response.data.message);
      setMessage(response.data.message); // Optionally set a success message
    } catch (error) {
      console.error("Error setting model on backend:", error);
      setMessage("Failed to set model on backend."); // Optionally set an error message
    }
  };

  /**
   * renderIntroScreen - Renders the initial intro screen with title and animation.
   * Shown briefly on component mount.
   * @returns {JSX.Element} - JSX for the intro screen.
   */
  const renderIntroScreen = () => (
    <div className="ui-row">
      {showTitle ? ( // Conditionally render title and animation based on showTitle state
        <>
          <h1 className="fade-in">YouTube Title Generator</h1>
          <Lottie animationData={animation} className="poop-header" />
        </>
      ) : null}
    </div>
  );

  /**
   * renderModalOverlay - Renders the modal overlay for API key and model selection.
   * @returns {JSX.Element} - JSX for the modal overlay.
   */
  const renderModalOverlay = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Welcome to YouTube Title Generator</h2>
        <label htmlFor="dropdown">Select the Model:</label>
        <select
          id="dropdown"
          value={selectedOption} // Control the dropdown value with selectedOption state
          onChange={handleSelectChange} // Handle dropdown change events
        >
          {modelOptions.map((option) => ( // Map over modelOptions array to generate dropdown options
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <br />
        <label htmlFor="apiKey">API Key:</label>
        <textarea
          id="apiKey"
          value={apiKey} // Control the textarea value with apiKey state
          onChange={(e) => setApiKey(e.target.value)} // Handle textarea change events to update apiKey state
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

  /**
   * renderMainAppUI - Renders the main UI of the application after modal is closed.
   * Includes buttons, prompt input, and results display.
   * @returns {JSX.Element} - JSX for the main application UI.
   */
  const renderMainAppUI = () => (
    <div className="ui-row">
      <div className="button-row">
        <button onClick={handlePlay}>Play Sound</button>
        <button onClick={handleOpenBrowser}>Open Browser</button>
        <button onClick={handleScrapeBrowser} disabled={isScraping}>
          {isScraping ? ( // Conditionally render button content based on isScraping state
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
          value={prompt} // Control textarea value with prompt state
          onChange={handlePromptChange} // Handle textarea changes to update prompt and context
          rows="4"
          cols="50"
        />
        <button onClick={handleGenerateTitle}>Generate Title</button>
      </div>
      <div className="results-row">
        {generatedTitle.length > 0 ? ( // Conditionally render generated titles if available
          generatedTitle.map((data, index) => ( // Map over generatedTitle array to display each title
            <div
              key={index}
              className="result fade-in"
              style={{ animationDelay: `${index * 0.1}s` }} // Apply staggered animation delay
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
          <p className="no-results-text">No titles generated yet.</p> // Display message when no titles are generated
        )}
      </div>

      {message && ( // Conditionally render message row if message state is not empty
        <div className="message-row">
          <p>{message}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="app-container">
      <audio ref={audioRef} src={fartsound} preload="auto" />

      {/* Conditionally render UI based on intro screen, modal, and main UI data */}
      {showInitialIntro ? (
        renderIntroScreen() // Show Intro Screen for the first 500ms
      ) : showModal ? (
        renderModalOverlay() // Show Modal if showModal is true
      ) : mainUIData ? (
        renderMainAppUI() // Show Main UI if mainUIData is available (modal closed)
      ) : (
        renderIntroScreen() // Fallback to intro screen if none of the above conditions are met (unlikely case after intro is hidden)
      )}
    </div>
  );
}

export default App;