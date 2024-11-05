import { useEffect, useState } from 'react';
import './App.css';

import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { qubicService, User } from './service/qubic-service';


const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>(qubicService.users);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferToUserId, setTransferToUserId] = useState<number | null>(null);
  const [withdrawToPublicId, setWithdrawToPublicId] = useState('');

  useEffect(() => {
    const connect = async () => {
      await qubicService.connectToQubic();
      const help = new QubicHelper()
      await help.createIdPackage("seed")
      
      setIsConnected(true);
     
      const user1 = await qubicService.createWallet('random-seed-1');
      const user2 = await qubicService.createWallet('random-seed-2');
      qubicService.users.push({ id: 1, depositWallet: user1, balance: 1000 });
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
      try {
        await qubicService.withdraw(selectedUser, withdrawAmount, withdrawToPublicId);
        setUsers([...qubicService.users]);
      } catch (error) {
        console.error("Withdrawal error:", error);
      }
    }
  };

  const handleTransfer = async () => {
    const receiver = users.find(user => user.id === transferToUserId);
    if (selectedUser && receiver && transferAmount > 0) {
      try {
        await qubicService.transfer(selectedUser, receiver, transferAmount);
        setUsers([...qubicService.users]);
      } catch (error) {
        console.error("Transfer error:", error);
      }
    }
  };

  return (
    <div className="App">
      <h1>Qubic Exchange Simulation</h1>
      {isConnected ? (
        <div>
          <h2>Connected to Qubic Network</h2>
          <h3>User Balances:</h3>
          {users.map(user => (
            <div key={user.id}>
              User {user.id}: {user.balance} Qubic
              <button onClick={() => setSelectedUser(user)}>Select</button>
            </div>
          ))}

          {selectedUser && (
            <div>
              <h3>Manage User {selectedUser.id}</h3>

              <h4>Withdraw</h4>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                placeholder="Amount"
              />
              <input
                type="text"
                value={withdrawToPublicId}
                onChange={(e) => setWithdrawToPublicId(e.target.value)}
                placeholder="Destination Public ID"
              />
              <button onClick={handleWithdraw}>Withdraw</button>

              <h4>Transfer</h4>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value))}
                placeholder="Amount"
              />
              <input
                type="number"
                value={transferToUserId || ''}
                onChange={(e) => setTransferToUserId(Number(e.target.value))}
                placeholder="Receiver User ID"
              />
              <button onClick={handleTransfer}>Transfer</button>
            </div>
          )}
        </div>
      ) : (
        <p>Connecting to Qubic Network...</p>
      )}
    </div>
  );
};

export default App;