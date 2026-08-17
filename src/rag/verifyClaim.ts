import { z } from "zod";

const claimVerificationSchema = z.object({
  supported: z.boolean(),
  reason: z.string(),
});

export async function verifyClaim(
  llm: any,
  question: string,
  claim: string,
  evidence: string,
  documentContext: string
) {
  const verifier = llm.withStructuredOutput(
    claimVerificationSchema
  );

  const prompt = `
You are a strict factual claim verifier for a RAG system.

The provided documents are the source of truth.

The documents may be a resume, profile, report, manual,
or other document belonging to the person/entity referenced
by the question.

IMPORTANT:

A document does NOT need to repeat the person's name in
every paragraph.

If the document establishes that the information belongs
to the person referenced by the question, then information
inside that document can be attributed to that person.

For example:

Document:
"NAMAN JAIN
Software Engineer

TECHNICAL SKILLS
Backend & Frameworks: Node.js, Express.js"

Claim:
"Naman knows Node.js."

This is SUPPORTED.

Do NOT reject a claim merely because the specific evidence
snippet does not repeat the person's name.

==================================================
STRICT RULES
==================================================

1. Use ONLY the provided document context.

2. Every substantive factual claim must be supported
   by the document.

3. Do not invent facts.

4. Do not combine unrelated facts to create unsupported
   relationships.

5. Reasonable attribution to the document's subject is
   allowed when the document clearly establishes ownership.

6. Minor universally recognized terminology expansions
   are allowed.

   Example:
   RBAC → Role-Based Access Control

7. Do not invent:
   - years of experience
   - dates
   - responsibilities
   - achievements
   - proficiency levels
   - ownership
   - performance metrics

8. If the claim is not supported by the document,
   return false.

9. If uncertain, return false.

==================================================
QUESTION
==================================================

${question}

==================================================
DOCUMENT CONTEXT
==================================================

${documentContext}

==================================================
CLAIM
==================================================

${claim}

==================================================
EXTRACTED EVIDENCE
==================================================

${evidence}

==================================================
DECISION
==================================================

Is the claim supported by the document?

Return:

supported=true

or

supported=false

Also provide a short reason.
`;

  return await verifier.invoke(prompt);
}