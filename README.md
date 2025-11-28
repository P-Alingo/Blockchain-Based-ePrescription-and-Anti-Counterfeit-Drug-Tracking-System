
# Blockchain-Based ePrescription & Anti-Counterfeit Drug Tracking System

A full-stack system for secure e-prescription management and anti-counterfeit drug tracking using blockchain smart contracts. The project includes a Node.js/Express backend, React frontend, and Solidity smart contracts for end-to-end traceability and role-based access.

---

## Useful Links

- [Node.js](https://nodejs.org/) – JavaScript runtime  
- [npm](https://www.npmjs.com/) – Node.js package manager  
- [PostgreSQL](https://www.postgresql.org/download/) – Relational database  
- [Hardhat](https://hardhat.org/getting-started/) – Ethereum development environment  
- [Ethers.js](https://docs.ethers.org/v5/) – Ethereum JavaScript library  
- [OpenZeppelin](https://docs.openzeppelin.com/contracts/) – Secure smart contract library  

---

## Project Overview

This system provides:

- Secure e-prescription creation, editing, and deletion  
- Drug batch tracking and anti-counterfeit verification  
- Role-based access for doctors, pharmacists, distributors, manufacturers, regulators, and admins  
- On-chain event logging and audit trails for traceability  
- Integration with email/OTP for secure onboarding  

---

## Technologies

- **Backend:** Node.js, Express, PostgreSQL, Ethers.js  
- **Frontend:** React, TypeScript, Tailwind CSS, Vite  
- **Smart Contracts:** Solidity (Hardhat)  
- **Blockchain:** Local Ethereum network (Hardhat)  
- **Other:** IPFS, JWT, Brevo (email), QR codes  

---

## Requirements

- Node.js **18+**  
- npm  
- PostgreSQL  
- Hardhat (global or project-local via `npx`)  
- 8 GB+ RAM recommended  

---

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


## Database Setup

The database dump is located in `Database/eprescribe_kenya.sql`.

### Importing the SQL Dump

1. **Create the database:**
  ```bash
  createdb -U postgres eprescribe_kenya
  ```

2. **Import the SQL dump:**
  ```bash
  psql -U postgres -d eprescribe_kenya -f Database/eprescribe_kenya.sql
  ```

This allows anyone cloning the repo to set up the database quickly.

### .env Setup

Copy `.env.example` to `.env` in each main folder (`Backend`, `Frontend`, `Smart Contracts`) and fill in the required values. These files are ignored by git for security.

**Required keys include:**

- `DATABASE_URL` – PostgreSQL connection string
- `BLOCKCHAIN_RPC_URL` – Ethereum node RPC URL
- `PRESCRIPTION_MANAGEMENT_ADDRESS` – Prescription contract address
- `DRUG_SUPPLY_CHAIN_ADDRESS` – Drug supply chain contract address
- `USER_MANAGEMENT_ADDRESS` – User management contract address
- `REGULATOR_OVERSIGHT_ADDRESS` – Regulator oversight contract address
- `ADMIN_PRIVATE_KEY` – Admin wallet private key
- `JWT_SECRET` – JWT signing secret
- `JWT_EXPIRY` – JWT token expiry duration
- `OTP_EXPIRATION_MINUTES` – OTP code expiry duration
- `EMAIL_SENDER` – Email sender address
- `BREVO_API_KEY` – Brevo (email) API key
- `PORT` – Backend server port
- `RATE_LIMIT_WINDOW_MS` – Rate limiting window (ms)
- `RATE_LIMIT_MAX_REQUESTS` – Max requests per window
- `LOG_LEVEL` – Logging verbosity

See `.env.example` for all required keys and example values.

## Troubleshooting

- **Port conflicts:** Make sure ports 4000 (backend) and 8080 (frontend) are free.
- **Contract address mismatch:** Ensure backend `.env` and `contracts.json` use the same deployed contract addresses.
- **Database errors:** Check PostgreSQL connection and credentials.
- **Blockchain errors:** Restart Hardhat node and redeploy contracts if needed.

## Contributing

We welcome contributions! See `CONTRIBUTING.md` for code style, testing, and PR guidelines.

## For Reviewers

See `RUN_INSTRUCTIONS.md` for a quick start. All source code, documentation, and setup scripts are included.
