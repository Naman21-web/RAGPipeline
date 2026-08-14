import { retrieveDocuments } from "../vectorstore/retriever.js";
import { llm } from "../llm/model.js";
import { z } from "zod";

import type { Document } from "@langchain/core/documents";

import { RAGState } from "./state.js";

const relevanceSchema = z.object({
  relevant: z.boolean(),
  reason: z.string(),
});

const verificationSchema = z.object({
  supported: z.boolean(),
  reason: z.string(),
});

const answerVerifier = llm.withStructuredOutput(
  verificationSchema
);

const relevanceGrader = llm.withStructuredOutput(
  relevanceSchema
);

export async function retrieveNode(
  state: typeof RAGState.State
) {
  console.log("\n[Retrieve]");

  const documents = await retrieveDocuments(
    state.question,
    4
  );

  console.log(`Retrieved ${documents.length} documents`);

  return {
    documents,
  };
}

export async function gradeDocumentsNode(
  state: typeof RAGState.State
) {
  console.log("\n[Grade Documents]");

  const context = state.documents
    .map((doc, index) => {
      return `
DOCUMENT ${index + 1}

${doc.pageContent}
`;
    })
    .join("\n");

  const prompt = `
You are a relevance grader for a document question-answering system.

Determine whether the provided documents contain information
that can help answer the user's question.

IMPORTANT:
- Only consider information explicitly present in the documents.
- Do not use your own knowledge.
- The documents do not need to contain the exact wording of the question.
- They must contain information that could actually support an answer.

User question:
${state.question}

Documents:
${context}

Return:
- relevant=true if the documents contain evidence that can answer the question.
- relevant=false if the documents do not contain enough information.

Also provide a short reason.
`;

  const result = await relevanceGrader.invoke(prompt);

  console.log("Relevant:", result.relevant);
  console.log("Reason:", result.reason);

  return {
    isRelevant: result.relevant,
    relevanceReason: result.reason,
  };
}

export async function generateAnswerNode(
  state: typeof RAGState.State
) {
  console.log("\n[Generate Answer]");

  const context = state.documents
    .map((doc, index) => {
      return `
DOCUMENT ${index + 1}

${doc.pageContent}
`;
    })
    .join("\n");

  const prompt = `
You are a document question-answering assistant.

Your job is to answer the user's question using ONLY the
information contained in the provided documents.

STRICT RULES:

1. Use only the provided documents.
2. Do not use your own knowledge.
3. Do not make assumptions.
4. Do not invent facts.
5. Every factual statement in your answer must be supported
   by the provided documents.
6. If the documents do not contain enough information to
   answer the question, respond exactly with:

I don't know based on the provided document.

User question:
${state.question}

Documents:
${context}
`;

  const response = await llm.invoke(prompt);

  const answer =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  console.log("Answer:", answer);

  return {
    answer,
  };
}

export async function verifyAnswerNode(
  state: typeof RAGState.State
) {
  console.log("\n[Verify Answer]");

  const context = state.documents
    .map((doc, index) => {
      return `
DOCUMENT ${index + 1}

${doc.pageContent}
`;
    })
    .join("\n");

  const prompt = `
You are a strict factual verifier for a RAG system.

Your job is to determine whether the generated answer
is completely supported by the provided documents.

IMPORTANT RULES:

1. Use ONLY the provided documents.
2. Do not use your own knowledge.
3. Do not infer facts that are not explicitly supported.
4. Every factual claim in the answer must be supported.
5. If even one important factual claim is unsupported,
   return supported=false.
6. If the answer says something that cannot be verified
   from the documents, return supported=false.

USER QUESTION:
${state.question}

PROVIDED DOCUMENTS:
${context}

GENERATED ANSWER:
${state.answer}

Determine whether the generated answer is fully supported
by the provided documents.

Return:
- supported=true if every factual claim is supported.
- supported=false otherwise.

Also provide a short explanation.
`;

  const result = await answerVerifier.invoke(prompt);

  console.log("Supported:", result.supported);
  console.log("Reason:", result.reason);

  return {
    answerSupported: result.supported,
    verificationReason: result.reason,
  };
}

export async function verificationFailureNode() {
  console.log("\n[Verification Failed]");

  return {
    answer: "I don't know based on the provided document.",
  };
}

export async function rejectNode() {
  console.log("\n[Reject]");

  return {
    answer: "I don't know based on the provided document.",
    answerSupported: false,
    verificationReason:
      "The retrieved documents do not contain enough relevant information to answer the question.",
  };
}