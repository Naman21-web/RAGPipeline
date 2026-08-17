import { retrieveDocuments } from "../vectorstore/retriever.js";
import { llm } from "../llm/model.js";
import { z } from "zod";

import { RAGState } from "./state.js";

const relevanceSchema = z.object({
  relevant: z.boolean(),
  reason: z.string(),
});

// const verificationSchema = z.object({
//   supported: z.boolean(),
//   reason: z.string(),
// });

// const answerSchema = z.object({
//   answer: z.string(),

//   claims: z.array(
//     z.object({
//       claim: z.string(),
//       evidence: z.string(),
//     })
//   ),
// });

const AnswerSchema = z.object({
  answer: z.string(),
  claims: z.array(
    z.object({
      claim: z.string(),
      evidence: z.string(),
    })
  ),
});

// const answerGenerator = llm.withStructuredOutput(
//   answerSchema
// );

// const answerVerifier = llm.withStructuredOutput(
//   verificationSchema
// );

const VerificationSchema = z.object({
  supported: z.boolean(),

  reason: z.string(),

  claims: z.array(
    z.object({
      claim: z.string(),
      supported: z.boolean(),
      reason: z.string(),
    })
  ),
});

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

// export async function gradeDocumentsNode(
//   state: typeof RAGState.State
// ) {
//   console.log("\n[Grade Documents]");

//   const context = state.documents
//     .map((doc, index) => {
//       return `
// DOCUMENT ${index + 1}

// ${doc.pageContent}
// `;
//     })
//     .join("\n");

//   const prompt = `
// You are a relevance grader for a document question-answering system.

// Determine whether the provided documents contain information
// that can help answer the user's question.

// IMPORTANT:
// - Only consider information explicitly present in the documents.
// - Do not use your own knowledge.
// - The documents do not need to contain the exact wording of the question.
// - They must contain information that could actually support an answer.

// User question:
// ${state.question}

// Documents:
// ${context}

// Return:
// - relevant=true if the documents contain evidence that can answer the question.
// - relevant=false if the documents do not contain enough information.

// Also provide a short reason.
// `;

//   const result = await relevanceGrader.invoke(prompt);

//   console.log("Relevant:", result.relevant);
//   console.log("Reason:", result.reason);

//   return {
//     isRelevant: result.relevant,
//     relevanceReason: result.reason,
//   };
// }

export async function generateAnswerNode(
  state: typeof RAGState.State
) {
  console.log("\n[Generate Answer]");

  const context = state.documents
    .map(
      (doc, index) => `
DOCUMENT ${index + 1}

${doc.pageContent}
`
    )
    .join("\n");

  const structuredLLM =
    llm.withStructuredOutput(AnswerSchema);

  const prompt = `
You are a strict document-grounded RAG assistant.

Answer the user's question using ONLY the provided documents.

The documents are the source of truth.

If the documents do not contain enough information to answer
the question, return:

answer: "I don't know based on the provided document."

and return an empty claims array.

Do NOT use outside knowledge.

Do NOT infer personal preferences, facts, or information that
is not present in the documents.

For every factual statement in the answer, create one atomic
claim.

Each claim must contain exactly ONE independently verifiable
fact.

BAD:
"Naman knows Node.js, MongoDB and PostgreSQL."

GOOD:
"Naman knows Node.js."
"Naman knows MongoDB."
"Naman knows PostgreSQL."

For every claim, provide the exact relevant evidence from
the documents.

The document context establishes who the document belongs to.
The evidence does not need to repeat the person's name.

Example:

Document:
"NAMAN JAIN
TECHNICAL SKILLS
Backend: Node.js, Express.js"

Question:
"What technologies does Naman know?"

Claim:
"Naman knows Node.js."

This is supported because the document establishes that the
technical skills belong to Naman.

QUESTION:

${state.question}

DOCUMENTS:

${context}
`;

  const result = await structuredLLM.invoke(prompt);

  console.log("Generated answer:", result.answer);

  console.log("\nClaims:");

  result.claims.forEach((claim, index) => {
    console.log(`Claim ${index + 1}:`);
    console.log(claim.claim);
  });

  return {
    answer: result.answer,
    claims: result.claims,
  };
}

// export async function verifyClaimsNode(
//   state: typeof RAGState.State
// ) {
//   console.log("\n[Verify Claims]");

//   if (!state.claims || state.claims.length === 0) {
//     console.log("No claims to verify.");

//     return {
//       answerSupported: false,
//       verificationReason:
//         "The generated answer did not contain verifiable claims.",
//     };
//   }

//   const documentContext = state.documents
//         .map((doc, index) => {
//             return `
//         DOCUMENT ${index + 1}

//         ${doc.pageContent}
//         `;
//         })
//         .join("\n");

//   const results = [];

//   for (const [index, claim] of state.claims.entries()) {
//     console.log(`\nVerifying Claim ${index + 1}`);
//     console.log("Claim:", claim.claim);
//     console.log("Evidence:", claim.evidence);

    

//     const result = await verifyClaim(
//         llm,
//         state.question,
//         claim.claim,
//         claim.evidence,
//         documentContext
//     );

//     console.log("Supported:", result.supported);
//     console.log("Reason:", result.reason);

//     results.push({
//       claim: claim.claim,
//       supported: result.supported,
//       reason: result.reason,
//     });
//   }

//   const allSupported = results.every(
//     result => result.supported
//   );

//   const failedClaims = results.filter(
//     result => !result.supported
//   );

//   let verificationReason = "All claims are supported.";

//   if (failedClaims.length > 0) {
//     verificationReason =
//       failedClaims
//         .map(
//           result =>
//             `${result.claim}: ${result.reason}`
//         )
//         .join("\n");
//   }

//   return {
//     answerSupported: allSupported,
//     verificationReason,
//   };
// }

export async function verifyAnswerNode(
  state: typeof RAGState.State
) {
  console.log("\n[Verify Answer]");

  const context = state.documents
    .map(
      (doc, index) => `
DOCUMENT ${index + 1}

${doc.pageContent}
`
    )
    .join("\n");

  const claims = state.claims
    .map(
      (claim, index) => `
CLAIM ${index + 1}
Claim:
${claim.claim}

Evidence:
${claim.evidence}
`
    )
    .join("\n");

  const structuredLLM =
    llm.withStructuredOutput(VerificationSchema);

  const prompt = `
You are the final factual verifier for a RAG system.

The documents provided below are the ONLY source of truth.

Your job is to determine whether the generated answer is
completely supported by those documents.

IMPORTANT RULES:

1. The document does not need to repeat the person's name
   in every sentence.

2. If the document clearly establishes that it belongs to
   the person referenced by the question, information in the
   document can be attributed to that person.

3. Every factual claim must be supported by the documents.

4. Do not allow unsupported assumptions.

5. Do not allow hallucinated facts.

6. If even one substantive claim is unsupported, the overall
   answer must be marked unsupported.

7. If the answer is "I don't know based on the provided
   document.", it should be supported when the documents
   genuinely do not contain enough information.

8. Do not reject a claim simply because the person's name
   isn't repeated in the evidence snippet.

QUESTION:

${state.question}

DOCUMENTS:

${context}

GENERATED CLAIMS:

${claims}

GENERATED ANSWER:

${state.answer}

Return:

supported = true

ONLY if every substantive claim in the answer is supported.

Otherwise:

supported = false
`;

  const result = await structuredLLM.invoke(prompt);

  console.log("\nVerification:");
  console.log("Supported:", result.supported);
  console.log("Reason:", result.reason);

  result.claims.forEach((claim, index) => {
    console.log(`\nClaim ${index + 1}`);
    console.log("Claim:", claim.claim);
    console.log("Supported:", claim.supported);
    console.log("Reason:", claim.reason);
  });

  return {
    answerSupported: result.supported,
    verificationReason: result.reason,
  };
}

// export async function verificationFailureNode() {
//   console.log("\n[Verification Failed]");

//   return {
//     answer: "I don't know based on the provided document.",
//     answerSupported: false,
//     verificationReason:
//       "The generated answer contains information that is not sufficiently supported by the provided document.",
//   };
// }

export async function rejectNode(
  state: typeof RAGState.State
) {
  console.log("\n[Reject]");

  return {
    answer: "I don't know based on the provided document.",
    rejected: true,
  };
}