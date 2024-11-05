import { Wallet } from "./wallet";

export interface User {
  id: number;
  depositWallet: Wallet;
  tempDepositWallet?: Wallet;
  balance: number;
  tempDepositTx?: any;
}
