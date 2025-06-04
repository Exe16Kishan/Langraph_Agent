import { BaseMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation } from "@langchain/langgraph";
import dotenv from "dotenv";
dotenv.config();


// creating state
const AgentState = Annotation.Root({
    message : Annotation<Array<BaseMessage>>
})


// defining tool
const add = tool(async(query)=>{
  console.log(query)
},{
    name:"Addition Tool",
    description:"when given 2 numbers add them"
})


// tool 
const tools = [add]


// model init
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0,
  apiKey:process.env.GOOGLE_API_KEY
}).bindTools(tools)




const result = async () => {
    
}