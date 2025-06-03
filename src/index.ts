import { Annotation, START, StateGraph } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { OpenWeatherMap } from "@langchain/community/tools/openweathermap";
import { HumanMessage } from "@langchain/core/messages"; // For Gemini's message format


// Just the absolute necessary info the agent needs to track
const SimpleWeatherAgentState = Annotation.Root({
  user_query: Annotation<string>,           // Your original question
  llm_response: Annotation<string | null>,   
  tool_calls: Annotation<Array<any> | null>, // If Gemini wants to use a tool
  tool_output: Annotation<string | null>,    
  final_answer: Annotation<string>,          
});


const gemini_llm = new ChatGoogleGenerativeAI({
  model: "gemini-pro", 
  temperature: 0.5,
});

const weather_tool = new OpenWeatherMap({}); 

// IMPORTANT: Teach Gemini about the tool so it knows when and how to use it
const gemini_llm_with_tools = gemini_llm.bindTools([weather_tool]);

// Node A: Talk to Gemini initially
const callGeminiNode = async (state:typeof SimpleWeatherAgentState.State ) => {
  console.log("Calling Gemini to understand the query...");
  const messages = [
    new HumanMessage({
      content: `User query: "${state.user_query}". You have an 'openweathermap' tool for weather. Use it if needed. Otherwise, answer directly.`,
    }),
  ];
  const response = await gemini_llm_with_tools.invoke(messages);

  return {
    llm_response: response.content || null, // Gemini's text response
    tool_calls: response.tool_calls || null, // Any tool calls Gemini made
  };
};

// Node B: If Gemini said to use a tool, run it!
const executeToolNode = async (state:typeof SimpleWeatherAgentState.State) => {
  console.log("Executing tool if requested...");
  if (state.tool_calls && state.tool_calls.length > 0) {
    const tool_call = state.tool_calls[0]; // Assuming one tool call for simplicity
    const tool_name = tool_call.name;
    const tool_args = tool_call.args;

    if (tool_name === weather_tool.name) {
      try {
        const result = await weather_tool.invoke(tool_args.location); // Weather tool needs 'location'
        return { tool_output: result };
      } catch (error) {
        return { tool_output: `Error with weather tool: ${error}` };
      }
    }
  }
  return { tool_output: null }; // No tool executed or error
};

// Node C: Give the final answer to the user
const finalizeAnswerNode = async (state:typeof SimpleWeatherAgentState.State) => {
  console.log("Finalizing the answer...");
  let final_response_text: string;

  if (state.tool_output) {
    // If we got tool data, ask Gemini to format it nicely
    const messages = [
      new HumanMessage({
        content: `User's query was: "${state.user_query}". We got this data from the weather tool: "${state.tool_output}". Please give a clear and concise weather report based on this.`,
      }),
    ];
    const response = await gemini_llm.invoke(messages);
    final_response_text = response.content || "Could not generate final weather report.";
  } else {
    // If no tool data, use Gemini's direct answer
    final_response_text = state.llm_response || "Sorry, I couldn't get the weather or answer your query.";
  }
  return { final_answer: final_response_text };
};

// --- 5. Build and Compile the Graph (The Flowchart) ---
const graph = new StateGraph({
  stateSchema: SimpleWeatherAgentState,
})
  .addNode("call_gemini", callGeminiNode)
  .addNode("execute_tool", executeToolNode)
  .addNode("finalize_answer", finalizeAnswerNode)

  // Define the path:
  .addEdge(START, "call_gemini") // Start by calling Gemini

  // Conditional path: Did Gemini want a tool or a direct answer?
  .addConditionalEdges(
    "call_gemini", // After this node finishes
    (state) => (state.tool_calls && state.tool_calls.length > 0 ? "use_tool" : "direct_answer"),
    {
      use_tool: "execute_tool",    // If tool calls, go to execute_tool
      direct_answer: "finalize_answer", // If no tool calls, go directly to finalize_answer
    }
  )
  .addEdge("execute_tool", "finalize_answer") // After tool runs, go to finalize_answer
  .compile();

// --- 6. Run the Agent! ---
const runAgent = async (query: string) => {
  console.log(`\n--- Running agent for query: "${query}" ---`);
  const result = await graph.invoke({ user_query: query });
  console.log("--- Agent finished ---");
  console.log("Result:", result);
  console.log("-----------------------");
};

// Test it with a weather query
runAgent("What's the weather like in New Delhi?");

// Test it with a non-weather query
runAgent("Tell me a simple joke.");