import React, { useEffect, useState } from "react";
import { qubicService } from "../service/qubic-service";
import { User, Transaction } from "../types/user";
import logo from "../assets/logo.png";
import { generateSeed } from "../helpers/qubic";

const QubicExchange: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>(qubicService.users);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferToUserId, setTransferToUserId] = useState<number | null>(null);
  const [withdrawToPublicId, setWithdrawToPublicId] = useState("");
  const [depositAmount, setDepositAmount] = useState(0);
  const [currentTick, setCurrentTick] = useState(qubicService.currentTick);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);

  useEffect(() => {
    const tickInterval = setInterval(() => {
      setCurrentTick(qubicService.currentTick);
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  useEffect(() => {
    if (isConnected) return;

    const connect = async () => {
      qubicService.connectToQubic();
      setIsConnected(true);

      const user1 = await qubicService.createWallet(generateSeed());
      const user2 = await qubicService.createWallet(generateSeed());
      qubicService.users.push({ id: 1, depositWallet: user1, balance: 10000, locked: false });
      qubicService.users.push({ id: 2, depositWallet: user2, balance: 10000, locked: false });

      setUsers([...qubicService.users]);

      setInterval(() => {
        qubicService.checkBalances();
      }, 5000);
    };

    connect();
  }, []);

  const handleWithdraw = async () => {
    if (selectedUser && withdrawAmount > 0 && withdrawToPublicId && !selectedUser.locked) {
      try {
        await qubicService.withdraw(selectedUser, withdrawAmount, withdrawToPublicId);
        setUsers([...qubicService.users]);
        setTransactionHistory([...transactionHistory, {
          type: "Withdraw",
          amount: withdrawAmount,
          from: selectedUser.id,
          to: "External",
        }]);
      } catch (error) {
        console.error("Withdrawal error:", error);
      }
    }
  };

  const handleTransfer = async () => {
    const receiver = users.find((user) => user.id === transferToUserId);

    if (selectedUser && receiver && transferAmount > 0 && !selectedUser.locked && !receiver.locked) {
      try {
        await qubicService.transfer(selectedUser, receiver, transferAmount);
        setUsers([...qubicService.users]);
        setTransactionHistory([...transactionHistory, {
          type: "Transfer",
          amount: transferAmount,
          from: selectedUser.id,
          to: receiver.id,
        }]);
      } catch (error) {
        console.error("Transfer error:", error);
      }
    }
  };

  const handleDeposit = () => {
    if (selectedUser && depositAmount > 0 && !selectedUser.locked) {
      selectedUser.balance += depositAmount;
      setUsers([...qubicService.users]);
      setTransactionHistory([...transactionHistory, {
        type: "Deposit",
        amount: depositAmount,
        from: "External",
        to: selectedUser.id,
      }]);
    }
  };

  const toggleUserLock = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.locked = !user.locked;
      setUsers([...users]);
    }
  };

  const onUserSelect = (user: User) => {
    setSelectedUser(user);
    setTransferToUserId(null);
    setWithdrawToPublicId("");
    setTransferAmount(0);
    setWithdrawAmount(0);
    setDepositAmount(0);
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="w-full max-w-4xl flex justify-between items-center py-4 mb-6">
        <img src={logo} alt="Qubic Logo" className="w-16 h-16" />
        <h1 className="text-3xl font-bold text-white">QUBIC</h1>
      </header>

      {isConnected ? (
        <div className="w-full max-w-4xl bg-gray-800 shadow-lg rounded-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold">Connected to Qubic Network</h2>
            <p className="text-sm text-gray-400">TICK: {currentTick}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {users.map((user) => (
              <div
                key={user.id}
                className={`p-4 rounded-lg shadow-md transition-transform transform  ${
                  selectedUser?.id === user.id
                    ? "bg-cyan-500 scale-105"
                    : "bg-gray-700"
                }`}
              >
                <div className="flex justify-between">
                  <h3 className="font-bold">User {user.id}</h3>
                  <p>{user.balance} Qubic</p>
                </div>
                <p className="text-sm mt-2 ">
                  Wallet Balance: {user.depositWallet.balance} Qubic
                </p>
                <p className="text-xs text-white break-words mt-2">
                  Public ID: {user.depositWallet.publicId}
                </p>
                <button
                  onClick={() => onUserSelect(user)}
                  className="mt-4 w-full py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700 focus:outline-none"
                >
                  Select
                </button>
                <button
                  onClick={() => toggleUserLock(user.id)}
                  className={`mt-2 w-full py-2 ${
                    user.locked ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                  } rounded-lg focus:outline-none`}
                >
                  {user.locked ? "Unlock" : "Lock"}
                </button>
              </div>
            ))}
          </div>

          {selectedUser && (
            <div className="mt-8 bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Manage User {selectedUser.id}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Withdraw Amount</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full p-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Destination Public ID</label>
                  <input
                    type="text"
                    value={withdrawToPublicId}
                    onChange={(e) => setWithdrawToPublicId(e.target.value)}
                    className="w-full p-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleWithdraw}
                  className="w-full py-2 bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none"
                >
                  Withdraw
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm mb-1">Transfer Amount</label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    className="w-full p-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Receiver User ID</label>
                  <input
                    type="number"
                    value={transferToUserId || ""}
                    onChange={(e) => setTransferToUserId(Number(e.target.value))}
                    className="w-full p-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleTransfer}
                  className="w-full py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700 focus:outline-none"
                >
                  Transfer
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm mb-1">Deposit Amount</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full p-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleDeposit}
                  className="w-full py-2 bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none"
                >
                  Deposit
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Transaction History</h3>
            <ul className="space-y-2">
              {transactionHistory.map((txn, index) => (
                <li key={index} className="text-sm text-gray-400">
                  {txn.type}: {txn.amount} Qubic {" "}
                  {txn.from !== "External" ? `from User ${txn.from}` : "from External"} {" "}
                  to {txn.to !== "External" ? `User ${txn.to}` : "External"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-lg text-gray-400">Connecting to Qubic Network...</p>
      )}
    </div>
  );
};

export default QubicExchange;