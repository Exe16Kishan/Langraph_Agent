import { BaseMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation } from "@langchain/langgraph";
import dotenv from "dotenv";
dotenv.config();

// Step 1: Create Agent State (you can expand this later if using LangGraph)
// const AgentState = Annotation.Root({
//   message: Annotation<Array<BaseMessage>>
// });

// Step 2: Define the tool (Addition tool)
const add = tool(
  async (query: string) => {
    const numbers = query.match(/\d+/g)?.map(Number);
    if (!numbers || numbers.length < 2) {
      return "Please provide at least two numbers to add.";
    }
    const sum = numbers.reduce((a, b) => a + b, 0);
    return `The sum is ${sum}`;
  },
  {
    name: "Addition Tool",
    description: "Adds two or more numbers given in the input string",
  }
);

// Step 3: Bind tool to model
const tools = [add];

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY
}).bindTools(tools);

// Step 4: Invoke the model with a user prompt
const result = async () => {
  const response = await llm.invoke([
    {
      type: "human",
      content: "Can you add 12 and 30 for me?",
    }
  ]);

  console.log("Response from LLM:", response);
};

result();
