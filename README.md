git clone https://github.com/P-Alingo/Blockchain-Based-ePrescription-and-Anti-Counterfeit-Drug-Tracking-System.git
bash
bash

# Blockchain-Based ePrescription & Anti-Counterfeit Drug Tracking System

A full-stack system for secure e-prescription management and anti-counterfeit drug tracking using blockchain smart contracts. The project includes a Node.js/Express backend, React frontend, and Solidity smart contracts for end-to-end traceability and role-based access.

## Project Overview

This system provides:

- Secure e-prescription creation, editing, and deletion
- Drug batch tracking and anti-counterfeit verification
- Role-based access for doctors, pharmacists, distributors, regulators, and admins
- On-chain event logging and audit trails

## Technologies

- **Backend:** Node.js, Express, PostgreSQL, Ethers.js
- **Frontend:** React, TypeScript, Tailwind CSS
- **Smart Contracts:** Solidity (Hardhat)
- **Blockchain:** Local Ethereum (Hardhat)
- **Other:** IPFS, JWT, Brevo (email)

## Requirements

- Node.js 18+
- npm
- PostgreSQL
- Hardhat (for smart contract development)
- 8GB+ RAM recommended

## Local Setup

1. **Clone the repository**
  ```sh
  git clone https://github.com/P-Alingo/Blockchain-Based-ePrescription-and-Anti-Counterfeit-Drug-Tracking-System.git
  cd Blockchain-Based-ePrescription-and-Anti-Counterfeit-Drug-Tracking-System
  ```

2. **Install dependencies**
  ```sh
  cd Backend
  npm install
  cd ../Frontend
  npm install
  ```

3. **Configure environment variables**
  - Copy `.env.example` to `.env` in each main folder and fill in required values (see documentation for details).

4. **Start PostgreSQL and run migrations**
  - Ensure your database is running and accessible.

5. **Deploy smart contracts**
  ```sh
  cd "Smart Contracts"
  npx hardhat compile
  npx hardhat run scripts/deploy.js --network localhost
  ```

6. **Start backend server**
  ```sh
  cd ../Backend
  npm start
  ```

7. **Start frontend**
  ```sh
  cd ../Frontend
  npm run dev
  ```

## Project Structure

```
Blockchain-Based-ePrescription-and-Anti-Counterfeit-Drug-Tracking-System/
├── Backend/                        # Node.js/Express backend API
│   ├── src/                        # Source code (controllers, services, routes, utils)
│   │   ├── config/                 # Configuration files (blockchain, database, logger, etc.)
│   │   ├── controllers/            # API controllers
│   │   ├── middleware/             # Express middleware
│   │   ├── routes/                 # API route definitions
│   │   ├── services/               # Business logic/services
│   │   ├── utils/                  # Utility functions
│   │   └── ...
│   ├── tests/                      # Backend unit/integration tests
│   ├── uploads/                    # QR code and file uploads
│   ├── package.json                # Backend dependencies
│   └── .env                        # Backend environment variables
├── Frontend/                       # React + TypeScript frontend
│   ├── src/                        # Frontend source code
│   │   ├── assets/                 # Static assets (images, etc.)
│   │   ├── components/             # Reusable React components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utility libraries
│   │   ├── pages/                  # Page components
│   │   └── ...
│   ├── public/                     # Public static files
│   ├── package.json                # Frontend dependencies
│   ├── tailwind.config.ts          # Tailwind CSS config
│   ├── vite.config.ts              # Vite build config
│   └── .env                        # Frontend environment variables
├── Smart Contracts/                # Solidity contracts (Hardhat)
│   ├── contracts/                  # Solidity source files
│   ├── scripts/                    # Deployment and utility scripts
│   ├── test/                       # Smart contract tests
│   ├── artifacts/                  # Compiled contract artifacts
│   ├── hardhat.config.js           # Hardhat configuration
│   └── package.json                # Smart contract dependencies
├── README.md                       # Project documentation
└── ...                             # Other files and folders
```

## Troubleshooting

- **Port conflicts:** Make sure ports 4000 (backend) and 8080 (frontend) are free.
- **Contract address mismatch:** Ensure backend `.env` and `contracts.json` use the same deployed contract addresses.
- **Database errors:** Check PostgreSQL connection and credentials.
- **Blockchain errors:** Restart Hardhat node and redeploy contracts if needed.

## Contributing

We welcome contributions! See `CONTRIBUTING.md` for code style, testing, and PR guidelines.

## For Reviewers

See `RUN_INSTRUCTIONS.md` for a quick start. All source code, documentation, and setup scripts are included.
