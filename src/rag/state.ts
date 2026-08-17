import { Annotation } from "@langchain/langgraph";
import type { Document } from "@langchain/core/documents";

export const RAGState = Annotation.Root({
  question: Annotation<string>,

  documents: Annotation<Document[]>({
    default: () => [],
  }),

  isRelevant: Annotation<boolean>({
    default: () => false,
  }),

  relevanceReason: Annotation<string>({
    default: () => "",
  }),

  answer: Annotation<string>({
    default: () => "",
  }),

  claims: Annotation<
    {
      claim: string;
      evidence: string;
    }[]
  >({
    default: () => [],
  }),

  answerSupported: Annotation<boolean>({
    default: () => false,
  }),

  verificationReason: Annotation<string>({
    default: () => "",
  }),
});