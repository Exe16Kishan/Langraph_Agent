import {
  Annotation,
  START,
  StateGraph,
  StateType,
  UpdateType,
} from "@langchain/langgraph";

const InputStateAnnotation = Annotation.Root({
  user_input: Annotation<string>,
  user2_input :Annotation<string>
});

const OutputStateAnnotation = Annotation.Root({
  graph_output: Annotation<string>,
});

const OverallStateAnnotation = Annotation.Root({
  foo: Annotation<string>,
  bar: Annotation<string>,
  user_input: Annotation<string>,
  graph_output: Annotation<string>,
});

const node1 = async (state: typeof InputStateAnnotation.State) => {
  // Write to OverallStateAnnotation
  console.log(state)
  return { foo: state.user_input+" name" };
};

const node2 = async (state: typeof OverallStateAnnotation.State) => {
  // Read from OverallStateAnnotation, write to OverallStateAnnotation
  return { bar: state.foo + " is" };
};

const node3 = async (state: typeof OverallStateAnnotation.State) => {
  // Read from OverallStateAnnotation, write to OutputStateAnnotation
  return { graph_output: state.bar + " Lance" };
};

// Most of the time the StateGraph type parameters are inferred by TypeScript,
// but this is a special case where they must be specified explicitly in order
// to avoid a type error.
const graph = new StateGraph<
  (typeof OverallStateAnnotation)["spec"],
  StateType<(typeof OverallStateAnnotation)["spec"]>,
  UpdateType<(typeof OutputStateAnnotation)["spec"]>,
  typeof START,
  (typeof InputStateAnnotation)["spec"],
  (typeof OutputStateAnnotation)["spec"]
>({
  input: InputStateAnnotation,
  output: OutputStateAnnotation,
  stateSchema: OverallStateAnnotation,
})
  .addNode("node1", node1)
  .addNode("node2", node2)
  .addNode("node3", node3)
  .addEdge("__start__", "node1")
  .addEdge("node1", "node2")
  .addEdge("node2", "node3")
  .compile();


const run = async () => {
    
 const output=   await graph.invoke({ user_input: "my "});
 console.log(output)
}

run()