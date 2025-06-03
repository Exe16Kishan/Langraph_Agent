import { Annotation, START, StateGraph } from "@langchain/langgraph";

// --- 1. Define the ONLY State Schema with meaningful names ---
const AgentState = Annotation.Root({
  // Initial Inputs
  user_query: Annotation<string>, // Renamed from user_input
  context_data: Annotation<string>, // Renamed from user2_input

  // Intermediate State Data (what nodes produce)
  initial_processed_text: Annotation<string>, // Replaced processed_foo
  extracted_keywords: Annotation<string>, // Replaced processed_bar

  // Final Output
  final_response: Annotation<string>, // Replaced final_graph_output
});

// --- 2. Define Node Functions (using new names) ---
const processUserInputNode = async (state:typeof AgentState.State) => {
  console.log("Node 1: Processing User Query...");
  console.log("  Received user_query:", state.user_query);
  console.log("  Received context_data:", state.context_data);

  const combinedText = state.user_query + " related to " + state.context_data;
  return { initial_processed_text: combinedText + " prepared" };
};

const furtherProcessNode = async (state:typeof AgentState.State) => {
  console.log("Node 2: Extracting Keywords...");
  console.log("  Current initial_processed_text:", state.initial_processed_text);

  // Imagine this node actually extracts keywords from initial_processed_text
  return { extracted_keywords: state.initial_processed_text + " and relevant info" };
};

const finalizeOutputNode = async (state:typeof AgentState.State) => {
  console.log("Node 3: Generating Final Response...");
  console.log("  Current extracted_keywords:", state.extracted_keywords);

  return { final_response: state.extracted_keywords + ". Here's your answer!" };
};

// --- 3. Build and Compile the Graph ---
const graph = new StateGraph({
  stateSchema: AgentState,
})
  .addNode("process_user_input", processUserInputNode)
  .addNode("extract_keywords", furtherProcessNode) // Renamed node function for clarity
  .addNode("generate_final_response", finalizeOutputNode) // Renamed node function for clarity
  .addEdge(START, "process_user_input")
  .addEdge("process_user_input", "extract_keywords")
  .addEdge("extract_keywords", "generate_final_response")
  // .setFinishableKeys(["final_response"]) // Use the new final output key
  .compile();

// --- 4. Run the Graph ---
const runAgent = async () => {
  console.log("--- Starting Agent Run ---");
  const result = await graph.invoke({
    user_query: "What is the capital of France?",
    context_data: "Geography facts",
  });
  console.log("--- Agent Run Complete ---");
  console.log("Final Result:", result);
};

runAgent();