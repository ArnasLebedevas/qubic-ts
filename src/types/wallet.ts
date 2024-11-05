export interface Wallet {
  seed: string;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  publicId: string;
  balance: number;
}
