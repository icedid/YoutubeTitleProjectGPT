import { GoogleGenerativeAI } from "@google/generative-ai";

class TitleGenerator {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("API Key is required.");
    }
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction:
        "Above are titles from current videos that have been pushed by the algorithm. Please use the titles from above and create a title for my video that will also be pushed by the algorithm. Do it for my video on the following topic. When giving your answer please return in this format: {\"rationale\": \"...\", title:\"...\"}. Please generate 5 different titles.",
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
      const result = await chatSession.sendMessage(message);

      const res = this.extractTitles(result.response.text())

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
  
      // Parse the cleaned JSON string into a JavaScript object
      const data = JSON.parse(cleanedJSON);
  
      // Extract titles into an array
      const titles = data.map(item => item.title);
  
      return titles;
    } catch (error) {
      console.error("Failed to parse JSON or extract titles:", error);
      return [];
    }
  }
  
  // Utility function to clean JSON string
  cleanJSON(responseText) {
    try {
      // Remove backticks and markdown formatting
      return responseText.replace(/```json|```/g, "").trim();
    } catch (error) {
      console.error("Error cleaning JSON:", error);
      return responseText; // Return the raw response if cleaning fails
    }
  }

}

export default TitleGenerator;

// // Example usage:
// async function run() {
//   const apiKey = "AIzaSyArl5Qrx8sskxDOTqdw2ZznDQHf3qOnQlU";
//   const titleGenerator = new TitleGenerator(apiKey);

//   const data = "This Was My Wake-Up Call - Doctor Mike"; // Replace with actual data
//   const topic = "the video is about an underrated visual novel aliya timelink";

//   const generatedTitle= await titleGenerator.generateTitle(data, topic);
//   console.log(generatedTitle)
//   const title = titleGenerator.parseTitle(generatedTitle)


//   console.log(title);
// }

// run()
