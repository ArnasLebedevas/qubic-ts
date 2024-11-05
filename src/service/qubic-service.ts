import { PublicKey } from "@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey";
import { QubicConnector } from "@qubic-lib/qubic-ts-library/dist/QubicConnector";
import { QubicHelper } from "@qubic-lib/qubic-ts-library/dist/qubicHelper";
import { User } from "../types/user";
import { Wallet } from "../types/wallet";

class QubicService {
  private helper: QubicHelper;
  private connector: QubicConnector;
  public users: User[] = [];
  public hotWallet: Wallet | null = null;
  private currentTick: number = 0;

  constructor() {
    this.helper = new QubicHelper();
    this.connector = new QubicConnector(null);
    this.connector.onPeerConnected = () => {
      console.log("Peer connected successfully.");
    };
    this.connector.onPeerDisconnected = () => {
      console.log("Peer disconnected.");
    };
    this.connector.onReady = () => {
      console.log("ready");
      this.connector.connect("82.197.173.131");
    };
  }

  async createWallet(seed: string): Promise<Wallet> {
    const idPackage = await this.helper.createIdPackage(seed);
    return {
      seed,
      privateKey: idPackage.privateKey,
      publicKey: idPackage.publicKey,
      publicId: idPackage.publicId,
      balance: 1000,
    };
  }

  connectToQubic() {
    this.connector.onTick = (tick: number) => {
      this.currentTick = tick;
      this.checkBalances();
    };
    this.connector.start();
  }

  async checkBalances() {
    const ids = [
      this.hotWallet?.publicId,
      ...this.users.map((user) => user.depositWallet.publicId),
    ].filter(Boolean);
    ids.forEach((id) => this.connector.requestBalance(new PublicKey(id)));
  }

  async withdraw(user: User, amount: number, destinationPublicId: string) {
    if (user.balance < amount) {
      throw new Error("Insufficient balance for withdrawal.");
    }

    const tick = this.currentTick;
    const transactionPayload = await this.helper.createTransaction(
      user.depositWallet.seed,
      destinationPublicId,
      amount,
      tick
    );

    try {
      const success = this.connector.sendPackage(transactionPayload);
      if (success) {
        user.balance -= amount;
        console.log(
          `Withdrawal successful for user ${user.id}: ${amount} Qubic to ${destinationPublicId}`
        );
      } else {
        console.error("Failed to send withdrawal package.");
      }
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  }

  async transfer(sender: User, receiver: User, amount: number) {
    if (sender.balance < amount) {
      throw new Error("Insufficient balance for transfer.");
    }

    const tick = this.currentTick;
    const transactionPayload = await this.helper.createTransaction(
      sender.depositWallet.seed,
      receiver.depositWallet.publicId,
      amount,
      tick
    );

    try {
      const success = this.connector.sendPackage(transactionPayload);

      if (success) {
        sender.balance -= amount;
        receiver.balance += amount;
        console.log(
          `Transfer successful from user ${sender.id} to user ${receiver.id}: ${amount} Qubic`
        );
      } else {
        console.error("Failed to send transfer package.");
      }
    } catch (error) {
      console.error("Transfer failed:", error);
    }
  }
}

export const qubicService = new QubicService();
