import { Wallet } from "./wallet";

export interface User {
  id: number;
  depositWallet: Wallet;
  balance: number;
  locked: boolean;
}

export interface Transaction {
  type: "Withdraw" | "Transfer" | "Deposit";
  amount: number;
  from: number | "External";
  to: number | "External";
}
