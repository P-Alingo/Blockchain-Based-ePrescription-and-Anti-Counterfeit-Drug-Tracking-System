# Ethereum Wallet Authentication Backend with 2FA

This backend application provides secure user registration and login using Ethereum wallet signature verification combined with optional two-factor authentication (2FA) via TOTP. It is built with Node.js, Express.js, Prisma ORM, and PostgreSQL.

## Features

- Wallet-based authentication with nonce challenge and signature verification
- User roles: USER and ADMIN
- Two-factor authentication support using TOTP (speakeasy)
- JWT token issuance with role and 2FA verification status
- Prisma ORM for database schema and migrations
- Secure middleware for authentication and role-based authorization
- Logging and centralized error handling
- Configurable via environment variables

## Prerequisites

- Node.js v16+
- PostgreSQL database
- npm (Node Package Manager)
- [MetaMask](https://metamask.io/) or Ethereum wallet for testing

## Installation

1. Clone the repository:

   