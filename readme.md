

1. ✅ From scratch (manual setup using LangGraph nodes)
2. 🚀 Straightforward (using `createReactAgent` shortcut)

---

### ✅ README.md — ReAct Agent Guide with LangGraph

````markdown
# 🤖 ReAct Agent with LangGraph — Step-by-Step Guide

LangGraph makes it easy to build agents that can reason and act using tools — like a smart assistant that thinks before doing. In this guide, we'll build a **ReAct (Reasoning + Acting) agent** in two ways:

---

## 🧰 Prerequisites

Make sure you have Node.js and TypeScript set up.

```bash
npm install @langchain/core @langchain/langgraph @langchain/google-genai langchain zod dotenv
````

Also set `"type": "module"` in your `package.json`, and your `tsconfig.json` should use `"module": "ESNext"`.

---

## ✅ 1. ReAct Agent — Full Graph Setup (From Scratch)

This method gives you full control over how your agent reasons, acts, and finishes.

### 📁 Folder Structure

```
/src
  └─ reactAgentFull.ts
```

### 📄 reactAgentFull.ts

```ts
import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent, createToolNode } from "@langchain/langgraph/agents/react";
import { StateGraph, END } from "@langchain/langgraph";
import { z } from "zod";

// Define a simple addition tool
const addTool = tool(async (input: string) => {
  const nums = input.match(/\d+/g)?.map(Number);
  if (!nums || nums.length < 2) return "Provide at least two numbers.";
  return `The sum is ${nums.reduce((a, b) => a + b, 0)}`;
}, {
  name: "addition_tool",
  description: "Adds numbers from input like 'Add 4 and 5'."
});

// Bind Gemini model to tool
const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
}).bindTools([addTool]);

// Define state structure
const agentState = z.object({
  messages: z.array(z.any()),
});

// Create agent + tool node
const agentNode = await createReactAgent({ llm: model, tools: [addTool] });
const toolNode = createToolNode({ tools: [addTool] });

// Build LangGraph flow
const graph = new StateGraph({ stateSchema: agentState })
  .addNode("agent", agentNode)
  .addNode("tool", toolNode)
  .addEdge("agent", "tool")
  .addEdge("tool", "agent")
  .setEntryPoint("agent")
  .setFinishPoint("agent")
  .compile();

// Call the graph
const result = await graph.invoke({
  messages: [new HumanMessage("Add 10 and 25")],
});

console.log("✅ Final Output:\n", result.messages[result.messages.length - 1].content);
```

---

## 🚀 2. ReAct Agent — Shortcut (Straightforward Setup)

This uses only `createReactAgent()` — ideal for fast prototyping.

### 📄 reactAgentSimple.ts

```ts
import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { createReactAgentExecutor } from "@langchain/langgraph/agents/react";
import { HumanMessage } from "@langchain/core/messages";

// Tool definition
const addTool = tool(async (input: string) => {
  const nums = input.match(/\d+/g)?.map(Number);
  if (!nums || nums.length < 2) return "Need two numbers.";
  return `Sum is ${nums.reduce((a, b) => a + b, 0)}`;
}, {
  name: "add",
  description: "Add two numbers from a prompt like 'Add 3 and 4'",
});

// Model + tool binding
const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
}).bindTools([addTool]);

// One-liner agent executor
const executor = await createReactAgentExecutor({
  llm: model,
  tools: [addTool],
});

// Run the agent
const result = await executor.invoke({
  input: new HumanMessage("What's the result of 12 plus 20?"),
});

console.log("✅ Result:\n", result.output);
```

---

## 🔚 Conclusion

* Use the **full setup** when you want custom control over the flow.
* Use the **shortcut setup** when you just need a quick, working agent.

Both approaches let you connect tools, models, and memory in powerful ways using LangGraph's declarative graph flow.

---

## 📌 Pro Tips

* You can chain multiple tools and manage control flow with `.addEdge(...)`.
* Try replacing Gemini with OpenAI or Anthropic in the same flow.
* Use `memory` or `zod` validation to scale up to complex conversations.

