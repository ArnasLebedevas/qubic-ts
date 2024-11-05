import { Wallet } from "./wallet";

export interface User {
  id: number;
  depositWallet: Wallet;
  balance: number;
}
