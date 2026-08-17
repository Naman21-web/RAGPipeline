import { retrieveDocuments } from "../vectorstore/retriever.js";
import { llm } from "../llm/model.js";
import { z } from "zod";
import { verifyClaim } from "./verifyClaim.js";

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

const answerSchema = z.object({
  answer: z.string(),

  claims: z.array(
    z.object({
      claim: z.string(),
      evidence: z.string(),
    })
  ),
});

const answerGenerator = llm.withStructuredOutput(
  answerSchema
);

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
You are a document-grounded question answering assistant.

Answer the user's question using ONLY the provided documents.

For every factual statement in your answer, create an
individual claim.

IMPORTANT:

Each claim must contain exactly ONE independently
verifiable factual statement.

Do NOT combine multiple facts into one claim.

BAD:
"Naman knows Node.js, MongoDB and PostgreSQL."

GOOD:
"Naman knows Node.js."
"Naman knows MongoDB."
"Naman knows PostgreSQL."

For every claim, provide supporting evidence from the
documents.

Do not use outside knowledge.

Do not invent information.

QUESTION:
${state.question}

DOCUMENTS:
${context}
`;

  const result = await answerGenerator.invoke(prompt);

  console.log("Answer:", result.answer);

  console.log("\nClaims:");

  result.claims.forEach((claim, index) => {
    console.log(`Claim ${index + 1}:`);
    console.log("  Claim:", claim.claim);
    console.log("  Evidence:", claim.evidence);
  });

  return {
    answer: result.answer,
    claims: result.claims,
  };
}

export async function verifyClaimsNode(
  state: typeof RAGState.State
) {
  console.log("\n[Verify Claims]");

  if (!state.claims || state.claims.length === 0) {
    console.log("No claims to verify.");

    return {
      answerSupported: false,
      verificationReason:
        "The generated answer did not contain verifiable claims.",
    };
  }

  const documentContext = state.documents
        .map((doc, index) => {
            return `
        DOCUMENT ${index + 1}

        ${doc.pageContent}
        `;
        })
        .join("\n");

  const results = [];

  for (const [index, claim] of state.claims.entries()) {
    console.log(`\nVerifying Claim ${index + 1}`);
    console.log("Claim:", claim.claim);
    console.log("Evidence:", claim.evidence);

    

    const result = await verifyClaim(
        llm,
        state.question,
        claim.claim,
        claim.evidence,
        documentContext
    );

    console.log("Supported:", result.supported);
    console.log("Reason:", result.reason);

    results.push({
      claim: claim.claim,
      supported: result.supported,
      reason: result.reason,
    });
  }

  const allSupported = results.every(
    result => result.supported
  );

  const failedClaims = results.filter(
    result => !result.supported
  );

  let verificationReason = "All claims are supported.";

  if (failedClaims.length > 0) {
    verificationReason =
      failedClaims
        .map(
          result =>
            `${result.claim}: ${result.reason}`
        )
        .join("\n");
  }

  return {
    answerSupported: allSupported,
    verificationReason,
  };
}

export async function verificationFailureNode() {
  console.log("\n[Verification Failed]");

  return {
    answer: "I don't know based on the provided document.",
    answerSupported: false,
    verificationReason:
      "The generated answer contains information that is not sufficiently supported by the provided document.",
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