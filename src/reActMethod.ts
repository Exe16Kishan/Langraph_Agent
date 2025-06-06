import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import dotenv from "dotenv";
dotenv.config();



const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
})

// this method create the reAct architecture own its own
const agent = createReactAgent({
  llm: llm,
  tools: [],
});


const run = async () => {
    const result = await agent.invoke({
  messages: [
    {
      role: 'user',
      content: 'Hello, how can you help me?',
    },
  ],
});

console.log(result.messages.at(-1)?.content);
}

run()