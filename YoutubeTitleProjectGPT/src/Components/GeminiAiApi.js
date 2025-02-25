import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiAiApi {
  constructor(apiKey,selModel = "gemini-2.0-flash-exp") {
    if (!apiKey) {
      throw new Error("API Key is required.");
    }
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: selModel,
      systemInstruction:
        "Above are titles from current videos that have been pushed by the algorithm. Please use the titles from above and create a title for my video that will also be pushed by the algorithm. Do it for my video on the following topic. In the rationale, refer to what titles you took inspiration from. When giving your answer please return in this format Do not return anything apart from the specified: {\"rationale\": \"...\", title:\"...\"}. Please generate 5 different titles.",
    });
    this.generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };
  }

  async generateTitle(context, title) {
    try {
      const chatSession = this.model.startChat({
        generationConfig: this.generationConfig,
        history: [],
      });

      const message = `pastData:${JSON.stringify(context)}, topic:${JSON.stringify(title)}`;
      const result = await chatSession.sendMessage(message); //

      //const res = this.extractTitles(result.response.text())
      const res = this.cleanJSON(result.response.text())
      return res
    } catch (error) {
      console.error("Error generating title:", error);
      return null;
    }
  }

  async extractTitles(jsonString) {
    try {
      // Clean the JSON string (removing markdown-like formatting)
      const cleanedJSON = this.cleanJSON(jsonString);
  
      // Attempt to parse the cleaned JSON string, only if it's a string
      const data = typeof cleanedJSON === 'string' ? JSON.parse(cleanedJSON) : cleanedJSON;
  
      // Check if the parsed data is an array. If not, check if it's an object with 'rationale' and 'titles'.
      if (Array.isArray(data)) {
        return data.map(item => [item.rationale, item.title]);
      } else if (
        data &&
        typeof data === 'object' &&
        data.results &&
        Array.isArray(data.results)
      ) {
        // If it's an object with the expected structure, map over the titles.
        return data.results.map(item => [item.rationale, item.title]);
      } else {
        console.warn("Parsed data is not in the expected format:", data);
        return { rawResponse: cleanedJSON }; // Return raw JSON for debugging
      }
    } catch (error) {
      console.error("Failed to parse JSON or extract titles:", error);
      return { rawResponse: jsonString }; // Return the original JSON string if an error occurs
    }
  }
  
  
  
  
  // Utility function to clean JSON string
  cleanJSON(responseText) {
    try {
      // Check if the responseText is an object, and if so, convert it to string
      if (typeof responseText === 'object') {
        return JSON.stringify(responseText);
      }
  
      // If it's already a string, clean it (remove backticks and markdown formatting)
      return responseText.replace(/```json|```/g, "").trim();
    } catch (error) {
      console.error("Error cleaning JSON:", error);
      return responseText; // Return the raw response if cleaning fails
    }
  }
  

}

export default GeminiAiApi;



// async function run() {
//   const apiKey = "AIzaSyDQTqjAdNdQLxDwL-JQuY4CkNV0DuyG4ew";
//   const api = new GeminiAiApi(apiKey, "gemini-2.0-flash-exp");

//   const data = "This Was My Wake-Up Call - Doctor Mike"; // Replace with actual data
//   const topic = "the video is about an underrated visual novel aliya timelink";

//   const generatedTitle= await api.generateTitle(data, topic);
//   console.log(generatedTitle)

// }

// run()
