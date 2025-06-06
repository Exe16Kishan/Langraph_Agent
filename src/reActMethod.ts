import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { tool } from '@langchain/core/tools';
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();



const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
})

// Define the tools for the agent to use
const weatherTool = tool(
  async ({ query }) => {
    // This is a placeholder, but don't tell the LLM that...
    if (query.toLowerCase().includes('san francisco')) {
      return "It's 60 degrees and foggy.";
    }
    return "It's 90 degrees and sunny.";
  },
  {
    name: 'weather',
    description: 'Get Weather in a specific city',
    schema: z.object({
      query: z.string().describe('The query to use in your search.'),
    }),
  }
);

// this method create the reAct architecture own its own
const agent = createReactAgent({
  llm: llm,
  tools: [weatherTool],
});


const run = async () => {
    const result = await agent.invoke({
  messages: [
    {
      role: 'user',
      content: 'what is the weather of chitrakoot?',
    },
  ],
});

console.log(result.messages.at(-1)?.content);
}

run()