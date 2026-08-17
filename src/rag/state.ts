import { Annotation } from "@langchain/langgraph";
import { Document } from "@langchain/core/documents";

export const RAGState = Annotation.Root({
  question: Annotation<string>,

  documents: Annotation<Document[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),

  answer: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),

  claims: Annotation<any[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),

  answerSupported: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),

  verificationReason: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),

  rejected: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),
});