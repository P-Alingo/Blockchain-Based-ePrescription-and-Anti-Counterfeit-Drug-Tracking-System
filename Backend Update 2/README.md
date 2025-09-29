# Pharma Supply Chain Backend API

This project is a backend Express API for managing a pharmaceutical supply chain system. It integrates with an Ethereum blockchain smart contract, uses Prisma ORM with PostgreSQL, stores files on IPFS, supports JWT authentication with OTP, QR code generation, role-based access control, detailed logging, and validation. It is designed for scalability, security, and maintainability.

---

## Features

- User authentication with JWT and OTP verification
- Role-based access control (Doctor, Patient, Pharmacist, Manufacturer, Distributor, Regulator, Admin)
- Integration with Ethereum blockchain events via ethers.js
- IPFS integration for storing prescription and drug batch files
- QR code generation for prescriptions and drug batches
- Comprehensive logging with Winston
- Input validation with Joi
- API rate limiting
- Automated tests with Jest and Supertest

---

## Installation

### Prerequisites

- Node.js v18.x or higher
- PostgreSQL database
- An Ethereum RPC provider URL (e.g., Infura)
- IPFS project credentials (from Infura or other service)
- SMTP credentials for email sending

### Steps

1. Clone the repository:

