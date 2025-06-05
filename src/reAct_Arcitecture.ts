import dotenv from "dotenv";
import { Annotation, START, StateGraph, END } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";

dotenv.config();

// --- 1. Define the Agent's Shared State (Memory) ---
const AgentState = Annotation.Root({
  messages: Annotation<Array<BaseMessage>>,
});

// --- 2. Define Your Tools ---
const addNumbersTool = tool(
  async ({ num1, num2 }: { num1: number; num2: number }) => {
    console.log(`\n[TOOL EXECUTION] Adding ${num1} and ${num2}...`);
    await new Promise(resolve => setTimeout(resolve, 300));
    const sum = num1 + num2;
    return `The sum of ${num1} and ${num2} is ${sum}.`;
  },
  {
    name: "add_numbers_tool",
    description: "Adds two numbers together. Use this when asked to add two specific numbers.",
  }
);

const tools = [addNumbersTool];

// --- 3. Initialize the LLM and Bind Tools ---
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
}).bindTools(tools);

// --- 4. Define Graph Nodes ---

const agentNode = async (state: typeof AgentState.State) => {
  console.log("[NODE: Agent] LLM is processing and deciding...");
  const response = await llm.invoke(state.messages);
  return { messages: [response] };
};

const executeToolNode = async (state: typeof AgentState.State) => {
  console.log("[NODE: Execute Tool] Running tool...");
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

  if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
    console.warn("[NODE: Execute Tool] No tool calls found on last AIMessage.");
    return { messages: [] };
  }

  const toolOutputs: BaseMessage[] = [];
  for (const toolCall of lastMessage.tool_calls) {
    const toolName = toolCall.name; // Get the name of the tool from the LLM's call
    const toolArgs = toolCall.args;
    console.log(`  Executing tool: ${toolName} with args: ${JSON.stringify(toolArgs)}`);

    const toolToExecute = tools.find((t) => t.name === toolName);

    if (toolToExecute) {
      try {
        const output = await toolToExecute.invoke(toolArgs);
        toolOutputs.push(
          new ToolMessage({
            tool_call_id: toolCall.id!,
            content: String(output),
            name: toolName, // <--- ADDED: Explicitly provide the tool name here
          })
        );
      } catch (error: any) {
        console.error(`  Error executing tool ${toolName}:`, error);
        toolOutputs.push(
          new ToolMessage({
            tool_call_id: toolCall.id!,
            content: `Error: ${error.message}`,
            name: toolName, // <--- ADDED: Also for error case
          })
        );
      }
    } else {
      console.warn(`  Tool '${toolName}' not found or implemented.`);
      toolOutputs.push(
        new ToolMessage({
          tool_call_id: toolCall.id!,
          content: `Error: Tool '${toolName}' not defined.`,
          name: toolName, // <--- ADDED: Also for tool not found case
        })
      );
    }
  }
  return { messages: toolOutputs };
};

// --- 5. Build the LangGraph Graph ---
const graph = new StateGraph({
  stateSchema: AgentState,
})
  .addNode("agent", agentNode)
  .addNode("execute_tool", executeToolNode)
  .addEdge(START, "agent")
  .addConditionalEdges(
    "agent",
    (state: typeof AgentState.State) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage._getType() === "ai" && (lastMessage as AIMessage).tool_calls && (lastMessage as AIMessage).tool_calls!.length > 0) {
        return "tool_call_made";
      }
      return "final_answer_ready";
    },
    {
      tool_call_made: "execute_tool",
      final_answer_ready: END,
    }
  )
  .addEdge("execute_tool", "agent");

const app = graph.compile();

// --- 6. Run the Agent ---
const runReActAgent = async (query: string) => {
  console.log(`\n--- Running ReAct Agent (Manual Graph) for Query: "${query}" ---`);
  const initialState = {
    messages: [new HumanMessage(query)],
  };

  const finalState = await app.invoke(initialState);

  console.log("--- Agent Run Complete ---");

  const finalAIMessage = (finalState.messages as BaseMessage[]).findLast(
    (m: BaseMessage) => m._getType() === "ai" && (!("tool_calls" in m) || !((m as AIMessage).tool_calls) || (m as AIMessage).tool_calls!.length === 0)
  );

  if (finalAIMessage) {
    console.log("Final Answer:", finalAIMessage.content);
  } else {
    console.log("Agent finished, but no direct final AI message found. Full history:");
    (finalState.messages as BaseMessage[]).forEach((msg: BaseMessage) => {
        console.log(`  ${msg._getType()}: ${msg.content || (msg._getType() === 'ai' && (msg as AIMessage).tool_calls ? JSON.stringify((msg as AIMessage).tool_calls) : 'No content/tool_calls')}`);
    });
  }
  console.log("------------------------------------------------------------------");
};

// Test the agent
runReActAgent("What is 150 plus 75?");
runReActAgent("Tell me a fun fact about pandas.");
runReActAgent("Add 10, 20 and 30.");