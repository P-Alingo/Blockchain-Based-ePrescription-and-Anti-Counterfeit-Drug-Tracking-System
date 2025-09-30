# Blockchain-Based ePrescription and Anti-Counterfeit Drug Tracking System for Kenya

A blockchain-based proof-of-concept system that integrates electronic prescriptions (ePrescriptions) with drug authentication and supply chain traceability to combat counterfeit drugs in Kenya.

## Description

Counterfeit drugs pose a significant threat to public health in Kenya, particularly in rural and informal markets with weak regulatory oversight. Current prescription and distribution systems are fragmented, paper-based, and vulnerable to tampering.

This project proposes a *blockchain-powered ePrescription and drug tracking system* built on Ethereum smart contracts. The system records transactions from doctors to patients, ensures drugs are registered and traceable across the supply chain, and allows pharmacists and patients to verify authenticity through QR codes.

While this is a *proof of concept* and does not integrate with Kenya’s national health infrastructure or real patient data, it demonstrates the potential of blockchain to improve transparency, accountability, and trust in medicine distribution.

---

## Getting Started

### Dependencies

#### Blockchain Development Tools
- *Hardhat* – Smart contract development, testing, and deployment.
- *Solidity + OpenZeppelin* – Smart contract language and secure, audited libraries.
- *Ethereum Testnets (Goerli, Sepolia) + Infura* – For contract deployment and network connectivity.

#### Backend & Database
- *Node.js (>= v18)* – JavaScript runtime for backend services and Hardhat scripts.
- *Express.js* – RESTful APIs for off-chain logic.
- *PostgreSQL* (Planned) – Future database for structured off-chain data (user details, prescription metadata, logs).
- *IPFS* (Planned) – Future distributed storage for large/unstructured files (scanned prescriptions, certificates).

#### Frontend
- *React.js + Vite* – dApp frontend framework.
- *TailwindCSS* – Responsive design system.
- *qrcode.react* – QR code generation for prescriptions and drug packages.

#### Wallet & Authentication
- *MetaMask* – Browser wallet for user login, authentication, and signing blockchain transactions.

---

## Installing

Clone this repository:
bash
git clone https://github.com/P-Alingo/Blockchain-Based-ePrescription-and-Anti-Counterfeit-Drug-Tracking-System.git
cd Blockchain-Based-ePrescription-and-Anti-Counterfeit-Drug-Tracking-System

### Install blockchain dependencies
```bash
cd Smart Contracts
npm install --save-dev hardhat
```
### Install backend dependencies
```bash
cd Backend
npm install
```

### Install frontend dependencies 
```bash
cd Frontend
npm install
cd ..
```

---
## Executing Program

Follow these steps in order.

1. **Compile smart contracts**
```bash
npx hardhat compile
```

2. **Run a local blockchain (Hardhat node)**
Open a terminal and run:
```bash
npx hardhat node
```
Leave this running while you develop and deploy to localhost.

3. **Deploy contracts to local network**
In a new terminal:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
This will deploy your smart contracts to the Hardhat local node and print contract addresses.

4. **Start backend server**
In the project root:
```bash
npm start
# or
node src/index.js
```

5. **Start frontend (React + Vite)**
```bash
cd client
npm run dev
```

---

## Frontend Access
The frontend will be accessible at:  
[http://localhost:8080](http://localhost:8080)

---

## Help

### Common issues and quick fixes:

*Hardhat node not running*
bash
npx hardhat node


*MetaMask not connecting*
- Add the Hardhat network to MetaMask (RPC URL: http://127.0.0.1:8545).
- Import one of the local Hardhat accounts (printed when running npx hardhat node).
- If transactions fail, check the account balance on the local node.

*General troubleshooting*
- Check server logs (backend) for stack traces.
- Re-run Hardhat deploy script after compiling if contracts changed.
- Clear browser cache and reset MetaMask between network changes.

For more commands:
bash
npx hardhat help


## Authors
- Petra Alingo – petrahaalingo@gmail.com

---

## Version History
- 0.1 – Initial proof-of-concept release  
  - Smart contract structure and conceptual framework established

---

## License
This project is licensed under the MIT License – see the LICENSE.md file for details.
