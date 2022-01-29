import { Field, PublicKey } from "snarkyjs";

declare type SecretNumberSnappInterface = {
  submitGuess(n: number): Promise<void>;
  resetPuzzle(n: number): Promise<void>;
  getSnappState(): Promise<{ n: Field; isCorrect: boolean }>;
}
