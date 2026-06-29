# Puzzle Co-Creation Smart Contract

A Solidity smart contract that allows multiple creators to collaboratively create puzzles with automatic royalty distribution based on agreed-upon contribution percentages.

## Features

- **Multi-creator collaboration**: Multiple creators can work together on a single puzzle
- **Basis point shares**: Creators define their royalty shares in basis points (10000 = 100%)
- **Signature-based approval**: All creators must sign off before the puzzle can be published
- **Automatic royalty distribution**: Royalties are automatically split according to each creator's share
- **Signature withdrawal**: Creators can withdraw their signature before all have signed, reverting to draft status
- **Immutable history**: All co-creation events are emitted for transparency

## Contract Structure

### State Variables

- `coCreationCounter`: Incremental counter for co-creation IDs
- `coCreations`: Mapping of co-creation ID to CoCreationData struct
- `hasSigned`: Mapping to track which creators have signed

### Enums

- `Status`: Draft, PendingSignatures, Published

### Structs

- `Creator`: Contains creator address, basis points share, and signature status
- `CoCreationData`: Contains puzzle ID, creators array, status, and signature count

### Functions

- `initiate(puzzleId, creatorAddresses, basisPoints)`: Create a new co-creation collaboration
- `sign(coCreationId)`: Sign off on the co-creation
- `withdrawSignature(coCreationId)`: Withdraw signature before all have signed
- `publish(coCreationId)`: Publish the puzzle once all creators have signed
- `distributeRoyalty(coCreationId, totalAmount)`: Distribute royalties to creators
- `getCoCreation(coCreationId)`: Get co-creation details

### Events

- `CoCreationInitiated`: Emitted when a new co-creation is initiated
- `SignatureAdded`: Emitted when a creator signs
- `SignatureWithdrawn`: Emitted when a creator withdraws their signature
- `PuzzlePublished`: Emitted when the puzzle is published
- `RoyaltySplit`: Emitted when royalties are distributed to a creator

## Installation

```bash
cd contracts/puzzle_co_creation
npm install
```

## Compilation

```bash
npm run compile
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Local Network (Hardhat)

```bash
npm run deploy:local
```

### Sepolia Testnet

1. Copy `.env.example` to `.env`
2. Fill in your Sepolia RPC URL and private key
3. Deploy:

```bash
npm run deploy:sepolia
```

### Goerli Testnet

```bash
npm run deploy:goerli
```

## Contract Verification

After deployment, verify the contract on Etherscan:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Usage Example

```javascript
// Initiate a co-creation with 3 creators
const puzzleId = 1;
const creators = [creator1Address, creator2Address, creator3Address];
const shares = [5000, 3000, 2000]; // 50%, 30%, 20%

const tx = await coCreation.initiate(puzzleId, creators, shares);
await tx.wait();

// Each creator signs
await coCreation.connect(creator1).sign(coCreationId);
await coCreation.connect(creator2).sign(coCreationId);
await coCreation.connect(creator3).sign(coCreationId);

// Publish the puzzle
await coCreation.publish(coCreationId);

// Distribute royalties (called by royalty oracle)
const royaltyAmount = ethers.parseEther('1.0');
await coCreation.distributeRoyalty(coCreationId, royaltyAmount);
```

## Security Considerations

- All creators must sign before publishing - ensures consensus
- Share weights are validated to sum exactly to 10000 basis points
- Signature withdrawal reverts to draft status - prevents partial approvals
- Only published co-creations can receive royalties
- Royalty distribution uses precise basis point calculations

## License

MIT
