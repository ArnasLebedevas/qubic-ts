import { User } from "../types/user";
import { QubicService } from "../service/qubic-service";

jest.mock("@qubic-lib/qubic-ts-library/dist/QubicConnector");
jest.mock("@qubic-lib/qubic-ts-library/dist/qubicHelper");

describe("QubicService", () => {
  let qubicService: QubicService;
  let mockConnector: any;
  let mockHelper: any;

  beforeEach(() => {
    qubicService = new QubicService();
    mockConnector = qubicService["connector"];
    mockHelper = qubicService["helper"];
    jest.clearAllMocks();
  });

  describe("createWallet", () => {
    it("should create a wallet with a given seed and set initial balance to 1000", async () => {
      const seed = "test-seed";
      const mockIdPackage = {
        privateKey: "private-key",
        publicKey: "public-key",
        publicId: "public-id",
      };
      mockHelper.createIdPackage = jest.fn().mockResolvedValue(mockIdPackage);

      const wallet = await qubicService.createWallet(seed);

      expect(mockHelper.createIdPackage).toHaveBeenCalledWith(seed);
      expect(wallet).toEqual({
        seed,
        privateKey: "private-key",
        publicKey: "public-key",
        publicId: "public-id",
        balance: 1000,
      });
    });
  });

  describe("connectToQubic", () => {
    it("should set onTick and start the connector", () => {
      mockConnector.start = jest.fn();

      qubicService.connectToQubic();

      expect(mockConnector.onTick).toBeDefined();
      expect(mockConnector.start).toHaveBeenCalled();
    });

    it("should update currentTick on each tick and call checkBalances", () => {
      const tick = 5;
      const checkBalancesSpy = jest
        .spyOn(qubicService, "checkBalances")
        .mockImplementation();

      qubicService.connectToQubic();
      mockConnector.onTick(tick);

      expect(qubicService.currentTick).toBe(tick);
      expect(checkBalancesSpy).toHaveBeenCalled();
    });
  });

  describe("withdraw", () => {
    it("should throw error if user has insufficient balance", async () => {
      const user: User = {
        id: 1,
        depositWallet: {
          seed: "seed",
          publicId: "id",
          balance: 500,
          privateKey: new Uint8Array([4, 5, 6]),
          publicKey: new Uint8Array([1, 2, 3]),
        },
        balance: 500,
      };

      await expect(
        qubicService.withdraw(user, 1000, "destination-id")
      ).rejects.toThrow("Insufficient balance for withdrawal.");
    });

    it("should process the withdrawal if balance is sufficient and update user balance", async () => {
      const user: User = {
        id: 1,
        depositWallet: {
          seed: "seed",
          publicId: "id",
          balance: 1000,
          privateKey: new Uint8Array([4, 5, 6]),
          publicKey: new Uint8Array([1, 2, 3]),
        },
        balance: 1000,
      };
      mockHelper.createTransaction = jest
        .fn()
        .mockResolvedValue("transaction-payload");
      mockConnector.sendPackage = jest.fn().mockReturnValue(true);

      await qubicService.withdraw(user, 500, "destination-id");

      expect(mockHelper.createTransaction).toHaveBeenCalledWith(
        "seed",
        "destination-id",
        500,
        qubicService.currentTick
      );
      expect(mockConnector.sendPackage).toHaveBeenCalledWith(
        "transaction-payload"
      );
      expect(user.balance).toBe(500);
    });
  });

  describe("transfer", () => {
    it("should throw error if sender has insufficient balance", async () => {
      const sender: User = {
        id: 1,
        depositWallet: {
          seed: "seed1",
          publicId: "id1",
          balance: 300,
          privateKey: new Uint8Array([4, 5, 6]),
          publicKey: new Uint8Array([1, 2, 3]),
        },
        balance: 300,
      };
      const receiver: User = {
        id: 2,
        depositWallet: {
          seed: "seed2",
          publicId: "id2",
          balance: 500,
          privateKey: new Uint8Array([4, 5, 6]),
          publicKey: new Uint8Array([1, 2, 3]),
        },
        balance: 500,
      };

      await expect(
        qubicService.transfer(sender, receiver, 500)
      ).rejects.toThrow("Insufficient balance for transfer.");
    });

    it("should process the transfer if sender has sufficient balance and update both balances", async () => {
      const sender: User = {
        id: 1,
        depositWallet: {
          seed: "seed1",
          publicId: "id1",
          balance: 1000,
          privateKey: new Uint8Array([4, 5, 6]),
          publicKey: new Uint8Array([1, 2, 3]),
        },
        balance: 1000,
      };
      const receiver: User = {
        id: 2,
        depositWallet: {
          seed: "seed2",
          publicId: "id2",
          balance: 500,
          privateKey: new Uint8Array([4, 5, 6]),
          publicKey: new Uint8Array([1, 2, 3]),
        },
        balance: 500,
      };
      mockHelper.createTransaction = jest
        .fn()
        .mockResolvedValue("transaction-payload");
      mockConnector.sendPackage = jest.fn().mockReturnValue(true);

      await qubicService.transfer(sender, receiver, 500);

      expect(mockHelper.createTransaction).toHaveBeenCalledWith(
        "seed1",
        "id2",
        500,
        qubicService.currentTick
      );
      expect(mockConnector.sendPackage).toHaveBeenCalledWith(
        "transaction-payload"
      );
      expect(sender.balance).toBe(500);
      expect(receiver.balance).toBe(1000);
    });
  });
});
