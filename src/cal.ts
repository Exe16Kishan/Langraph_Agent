// creating a simple agent which do calculation

import { Annotation, StateGraph } from "@langchain/langgraph";

const AgentState = Annotation.Root({
    firstNumber : Annotation<number>,
    secondNumber : Annotation<number>,
    output : Annotation<number>
})


const Add = async(state : typeof AgentState.State)=>{
    console.log("inside add funtion: " + state.firstNumber + " " + state.secondNumber)
    return {output : state.firstNumber + state.secondNumber}
}
const multi = async(state : typeof AgentState.State)=>{
    console.log("inside multi funtion: " +state.output)
    return {output : state.output * 2}
}


const graph = new StateGraph({stateSchema:AgentState})
    .addNode("add",Add)
    .addNode("multi",multi)
    .addEdge("__start__","add")
    .addEdge("add","multi")
    .addEdge("multi","__end__")
    .compile()


const runAgent = async () => {
    const result = await graph.invoke({firstNumber:2,secondNumber:4})
    console.log(result.output)
}

runAgent()