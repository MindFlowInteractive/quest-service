# Quest Service

Quest Service is a thought-provoking, single-player game designed to challenge players' logical thinking and reasoning skills. Dive into a world of cause-and-effect puzzles, logical sequences, and problem-solving challenges to prove your mastery over logic!

## 🚀 Features

* **Engaging Puzzles**: Solve dynamic cause-and-effect puzzles across various science, logic, and reasoning scenarios.
* **Stellar Integration**: Earn on-chain achievements and rewards as NFTs for completing puzzles.
* **Token System**: Use XLM and custom tokens to unlock special levels, hints, and features.
* **Scalable Gameplay**: Designed to be simple yet progressively harder as you advance.

## 🌟 Why This Matters to the Stellar Community

Quest Service brings gamification and educational value to the Stellar ecosystem by:

* **Onboarding New Users**: Introduces blockchain concepts through engaging gameplay, making Stellar more accessible to non-technical users.
* **Showcasing Soroban Capabilities**: Demonstrates practical use cases for Soroban smart contracts in gaming and NFT rewards.
* **Community Engagement**: Creates an interactive way for users to earn and interact with Stellar assets while developing problem-solving skills.
* **Educational Impact**: Combines logical thinking challenges with blockchain education, helping users understand decentralized systems through hands-on experience.
* **Ecosystem Growth**: Drives transaction volume and smart contract adoption on the Stellar network through meaningful user interactions.

## ⚙️ Tech Stack

* **Backend**: NestJS, Soroban (Stellar), MongoDB/PostgreSQL
* **Frontend**: React, TailwindCSS
* **Blockchain**: Stellar for on-chain achievements and rewards
* **Smart Contracts**: Soroban smart contracts for NFTs and token rewards

## 🐳 Local Development with Docker

We use Docker Compose to orchestrate the application, database, and microservices for a seamless local development experience.

### Prerequisites
- Docker Desktop installed and running.

### Quick Start

1. **Setup Environment**
   Create your environment configuration file:
   ```bash
   cp .env.example .env 
   ```

2. **Start All Services**
   Build and launch the entire stack:
   ```bash
   docker-compose up --build
   ```
- This command starts PostgreSQL and all Node.js microservices. Hot Reload is enabled, so changes in your code will automatically update the running container.

### Service Access Points
Once running, you can access the services at:

- **Quest Service**: http://localhost:3000
- **Notification Service**: http://localhost:3001
- **Social Service**: http://localhost:3002
- **Database (PostgreSQL)**: localhost:5432

## Common Commands
- **Stop everything**: Press Ctrl+C or run docker-compose down
- **Rebuild after adding new dependencies**: docker-compose up --build

## 💡 Contribute
We welcome contributions from the community! Whether you're a developer, designer, or just passionate about logic games, Quest Service is open for you to add new puzzles, features, or help improve the game!

## 📜 License
This project is licensed under the MIT License.

## 🔑 Wallet Authentication (Stellar + Freighter)

This feature allows users to authenticate using their Stellar wallet (Freighter).

### Flow
1. **Request Challenge**
   - `POST /auth/wallet/challenge`
   - Input: `{ "walletAddress": "GABC..." }`
   - Output: `{ "challenge": "Login challenge for GABC..." }`

2. **Sign Challenge in Freighter**
   - User signs the challenge message with their wallet.

3. **Verify Signature**
   - `POST /auth/wallet/verify`
   - Input:
     ```json
     {
       "walletAddress": "GABC...",
       "signature": "base64signature...",
       "challenge": "Login challenge for GABC..."
     }
     ```
   - Output: JWT token + linked wallet account.

### Security
- Rate limiting: 100 requests/minute
- JWT expiry: 1 hour
- Replay protection: timestamped challenges
