/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { qubicService } from "../service/qubic-service";
import { User } from "../types/user";
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
  const [currentTick, setCurrentTick] = useState(qubicService.currentTick);

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
      qubicService.users.push({ id: 1, depositWallet: user1, balance: 10000 });
      qubicService.users.push({ id: 2, depositWallet: user2, balance: 10000 });

      setUsers([...qubicService.users]);

      setInterval(() => {
        qubicService.checkBalances();
      }, 5000);
    };

    connect();
  }, []);

  const handleWithdraw = async () => {
    if (selectedUser && withdrawAmount > 0 && withdrawToPublicId) {
      console.log(withdrawToPublicId);
      try {
        await qubicService.withdraw(
          selectedUser,
          withdrawAmount,
          withdrawToPublicId
        );
        setUsers([...qubicService.users]);
      } catch (error) {
        console.error("Withdrawal error:", error);
      }
    }
  };

  const handleTransfer = async () => {
    const receiver = users.find((user) => user.id === transferToUserId);

    if (selectedUser && receiver && transferAmount > 0) {
      try {
        await qubicService.transfer(selectedUser, receiver, transferAmount);
        setUsers([...qubicService.users]);
      } catch (error) {
        console.error("Transfer error:", error);
      }
    }
  };

  const onUserSelect = (user: User) => {
    setSelectedUser(user);
    setTransferToUserId(null);
    setWithdrawToPublicId("");
    setTransferAmount(0);
    setTransferAmount(0);
    setWithdrawAmount(0);
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen m-auto justify-center">
      <img src={logo} alt="Qubic Logo" className="w-24 h-24 mb-4" />
      <h1 className="text-4xl font-extrabold text-cyan-500 mb-5">
        QUBIC EXCHANGE SIMULATION
      </h1>
      {isConnected ? (
        <div className="bg-teal-800 shadow-lg p-6 rounded-lg w-full max-w-xl text-white">
          <div className="flex justify-between flex-col items-center text-xl">
            <h2 className="text-xl text-white mb-4 font-semibold">
              Connected to Qubic Network
            </h2>
            <span>TICK: {currentTick}</span>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">User Balances:</h3>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex w-full flex-col items-center bg-teal-700 p-2 rounded-lg"
                >
                  <div className="flex flex-row justify-between w-full">
                    <div>
                      <span className="mr-1"> User {user.id}:</span>
                      <span className="font-bold">{user.balance} Qubic</span>
                    </div>
                  </div>
                  <div className="flex flex-col w-full justify-start items-baseline mb-3">
                    <div className="mb-3 ">
                      <span>Wallet Balance: </span>
                      <span className="font-bold">
                        {user.depositWallet.balance} Qubic
                      </span>
                    </div>
                    <span>Public ID:</span>
                    <span className="break-words w-full text-left text-xs font-bold">
                      {user.depositWallet.publicId}
                    </span>
                  </div>
                  <button
                    onClick={() => onUserSelect(user)}
                    className="w-full bg-teal-800 rounded-md p-1"
                  >
                    SELECT
                  </button>
                </div>
              ))}
            </div>
          </div>
          {selectedUser && (
            <div className="bg-teal-900 p-4 rounded-lg mt-6">
              <div className="text-lg font-semibold mb-2 flex justify-between">
                <h3>Manage User {selectedUser.id}</h3>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold text-cyan-200 mb-1">Withdraw</h4>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  placeholder="Amount"
                  className="w-full p-2 mb-2 border border-gray-300 rounded-md text-gray-800"
                />
                <input
                  type="text"
                  value={withdrawToPublicId}
                  onChange={(e) => setWithdrawToPublicId(e.target.value)}
                  placeholder="Destination Public ID"
                  className="w-full p-2 mb-2 border border-gray-300 rounded-md text-gray-800"
                />
                <button
                  onClick={handleWithdraw}
                  className="bg-red-500 text-white w-full py-2 rounded-lg hover:bg-red-600"
                >
                  Withdraw
                </button>
              </div>
              <div>
                <h4 className="font-semibold text-cyan-200 mb-1">Transfer</h4>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(event) =>
                    setTransferAmount(Number(event.target.value))
                  }
                  placeholder="Amount"
                  className="w-full p-2 mb-2 border border-gray-300 rounded-md text-gray-800"
                />
                <input
                  type="number"
                  value={transferToUserId || ""}
                  onChange={(event) =>
                    setTransferToUserId(Number(event.target.value))
                  }
                  placeholder="Receiver User ID"
                  className="w-full p-2 mb-2 border border-gray-300 rounded-md text-gray-800"
                />
                <button
                  onClick={handleTransfer}
                  className="bg-cyan-500 text-white w-full py-2 rounded-lg hover:bg-cyan-600"
                >
                  Transfer
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-lg text-cyan-200">Connecting to Qubic Network...</p>
      )}
    </div>
  );
};

export default QubicExchange;
