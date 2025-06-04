// model init
// bind tool
// create a workflow
// invoke

import { BaseMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation } from "@langchain/langgraph";

const AgentState = Annotation.Root({
    message : Annotation<Array<BaseMessage>>
})

const add = tool(async()=>{},{
    name:"Addition Tool",
    description:"when given 2 numbers add them"
})

const tools = [add]

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0
}).bindTools(tools)