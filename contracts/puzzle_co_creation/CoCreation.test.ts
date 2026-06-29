import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { CoCreation } from '../typechain-types';
import { time } from '@nomicfoundation/hardhat-network-helpers';

describe('CoCreation Contract', function () {
  let coCreation: CoCreation;
  let owner: SignerWithAddress;
  let creator1: SignerWithAddress;
  let creator2: SignerWithAddress;
  let creator3: SignerWithAddress;
  let nonCreator: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator1, creator2, creator3, nonCreator] = await ethers.getSigners();

    const CoCreationFactory = await ethers.getContractFactory('CoCreation');
    coCreation = await CoCreationFactory.deploy();
    await coCreation.waitForDeployment();
  });

  describe('Initiate', function () {
    it('should create a new co-creation with valid shares', async function () {
      const puzzleId = 1;
      const creators = [owner.address, creator1.address, creator2.address];
      const shares = [5000, 3000, 2000]; // 50%, 30%, 20% = 10000 bps

      const tx = await coCreation.initiate(puzzleId, creators, shares);
      const receipt = await tx.wait();

      const coCreationId = await coCreation.coCreationCounter();
      expect(coCreationId).to.equal(1);

      // Check CoCreationInitiated event
      await expect(tx)
        .to.emit(coCreation, 'CoCreationInitiated')
        .withArgs(1, puzzleId, creators, shares);

      // Check SignatureAdded event for automatic lead creator signature
      await expect(tx)
        .to.emit(coCreation, 'SignatureAdded')
        .withArgs(1, owner.address);

      // Verify co-creation data
      const data = await coCreation.getCoCreation(1);
      expect(data.puzzleId).to.equal(puzzleId);
      expect(data.status).to.equal(1); // PendingSignatures
      expect(data.signatureCount).to.equal(1);
      expect(data.creators).to.deep.equal(creators);
      expect(data.shares).to.deep.equal(shares);
    });

    it('should revert if shares do not sum to 10000 bps', async function () {
      const puzzleId = 1;
      const creators = [owner.address, creator1.address];
      const shares = [5000, 4000]; // 90% total

      await expect(
        coCreation.initiate(puzzleId, creators, shares)
      ).to.be.revertedWithCustomError(coCreation, 'InvalidShareTotal');
    });

    it('should revert if creators and shares arrays length mismatch', async function () {
      const puzzleId = 1;
      const creators = [owner.address, creator1.address];
      const shares = [5000];

      await expect(
        coCreation.initiate(puzzleId, creators, shares)
      ).to.be.revertedWith('Arrays length mismatch');
    });

    it('should revert if no creators provided', async function () {
      const puzzleId = 1;
      const creators: string[] = [];
      const shares: number[] = [];

      await expect(
        coCreation.initiate(puzzleId, creators, shares)
      ).to.be.revertedWith('No creators provided');
    });

    it('should auto-sign for the lead creator (msg.sender)', async function () {
      const puzzleId = 1;
      const creators = [owner.address, creator1.address];
      const shares = [6000, 4000];

      await coCreation.initiate(puzzleId, creators, shares);

      const data = await coCreation.getCoCreation(1);
      expect(data.signatureCount).to.equal(1);
      expect(data.signedStatuses[0]).to.be.true; // owner signed
      expect(data.signedStatuses[1]).to.be.false; // creator1 not signed
    });
  });

  describe('Sign', function () {
    beforeEach(async function () {
      const puzzleId = 1;
      const creators = [owner.address, creator1.address, creator2.address];
      const shares = [5000, 3000, 2000];
      await coCreation.initiate(puzzleId, creators, shares);
    });

    it('should allow a creator to sign', async function () {
      const tx = await coCreation.connect(creator1).sign(1);
      await expect(tx)
        .to.emit(coCreation, 'SignatureAdded')
        .withArgs(1, creator1.address);

      const data = await coCreation.getCoCreation(1);
      expect(data.signatureCount).to.equal(2);
      expect(data.signedStatuses[1]).to.be.true;
    });

    it('should revert if non-creator tries to sign', async function () {
      await expect(
        coCreation.connect(nonCreator).sign(1)
      ).to.be.revertedWithCustomError(coCreation, 'NotCreator');
    });

    it('should revert if creator has already signed', async function () {
      await coCreation.connect(creator1).sign(1);
      await expect(
        coCreation.connect(creator1).sign(1)
      ).to.be.revertedWithCustomError(coCreation, 'AlreadySigned');
    });

    it('should revert if co-creation is already published', async function () {
      await coCreation.connect(creator1).sign(1);
      await coCreation.connect(creator2).sign(1);
      await coCreation.publish(1);

      await expect(
        coCreation.connect(creator1).sign(1)
      ).to.be.revertedWith('Already published');
    });

    it('should revert for invalid co-creation id', async function () {
      await expect(
        coCreation.connect(creator1).sign(999)
      ).to.be.revertedWithCustomError(coCreation, 'InvalidCoCreationId');
    });
  });

  describe('Withdraw Signature', function () {
    beforeEach(async function () {
      const puzzleId = 1;
      const creators = [owner.address, creator1.address, creator2.address];
      const shares = [5000, 3000, 2000];
      await coCreation.initiate(puzzleId, creators, shares);
    });

    it('should allow creator to withdraw signature', async function () {
      await coCreation.connect(creator1).sign(1);

      const tx = await coCreation.connect(creator1).withdrawSignature(1);
      await expect(tx)
        .to.emit(coCreation, 'SignatureWithdrawn')
        .withArgs(1, creator1.address);

      const data = await coCreation.getCoCreation(1);
      expect(data.signatureCount).to.equal(1);
      expect(data.signedStatuses[1]).to.be.false;
    });

    it('should revert status to draft if signature count drops to 0', async function () {
      await coCreation.connect(creator1).withdrawSignature(1);

      const data = await coCreation.getCoCreation(1);
      expect(data.status).to.equal(0); // Draft
    });

    it('should revert if not in pending signatures state', async function () {
      await coCreation.connect(creator1).sign(1);
      await coCreation.connect(creator2).sign(1);
      await coCreation.publish(1);

      await expect(
        coCreation.connect(creator1).withdrawSignature(1)
      ).to.be.revertedWith('Not in pending state');
    });

    it('should revert if creator has not signed', async function () {
      await expect(
        coCreation.connect(creator2).withdrawSignature(1)
      ).to.be.revertedWith('Not signed');
    });

    it('should revert if non-creator tries to withdraw', async function () {
      await expect(
        coCreation.connect(nonCreator).withdrawSignature(1)
      ).to.be.revertedWithCustomError(coCreation, 'NotCreator');
    });
  });

  describe('Publish', function () {
    beforeEach(async function () {
      const puzzleId = 1;
      const creators = [owner.address, creator1.address, creator2.address];
      const shares = [5000, 3000, 2000];
      await coCreation.initiate(puzzleId, creators, shares);
    });

    it('should publish when all creators have signed', async function () {
      await coCreation.connect(creator1).sign(1);
      await coCreation.connect(creator2).sign(1);

      const tx = await coCreation.publish(1);
      await expect(tx)
        .to.emit(coCreation, 'PuzzlePublished')
        .withArgs(1, 1);

      const data = await coCreation.getCoCreation(1);
      expect(data.status).to.equal(2); // Published
    });

    it('should revert if not all creators have signed', async function () {
      await coCreation.connect(creator1).sign(1);

      await expect(
        coCreation.publish(1)
      ).to.be.revertedWithCustomError(coCreation, 'NotAllCreatorsSigned');
    });

    it('should revert if already published', async function () {
      await coCreation.connect(creator1).sign(1);
      await coCreation.connect(creator2).sign(1);
      await coCreation.publish(1);

      await expect(
        coCreation.publish(1)
      ).to.be.revertedWithCustomError(coCreation, 'AlreadyPublished');
    });

    it('should revert if non-creator tries to publish', async function () {
      await coCreation.connect(creator1).sign(1);
      await coCreation.connect(creator2).sign(1);

      await expect(
        coCreation.connect(nonCreator).publish(1)
      ).to.be.revertedWithCustomError(coCreation, 'NotCreator');
    });
  });

  describe('Distribute Royalty', function () {
    beforeEach(async function () {
      const puzzleId = 1;
      const creators = [owner.address, creator1.address, creator2.address];
      const shares = [5000, 3000, 2000];
      await coCreation.initiate(puzzleId, creators, shares);
      await coCreation.connect(creator1).sign(1);
      await coCreation.connect(creator2).sign(1);
      await coCreation.publish(1);
    });

    it('should distribute royalties according to shares', async function () {
      const totalAmount = ethers.parseEther('1'); // 1 ETH

      // Fund the contract
      await owner.sendTransaction({
        to: await coCreation.getAddress(),
        value: totalAmount,
      });

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      const creator1BalanceBefore = await ethers.provider.getBalance(creator1.address);
      const creator2BalanceBefore = await ethers.provider.getBalance(creator2.address);

      const tx = await coCreation.distributeRoyalty(1, totalAmount);
      const receipt = await tx.wait();

      // Verify RoyaltySplit events
      await expect(tx)
        .to.emit(coCreation, 'RoyaltySplit')
        .withArgs(1, owner.address, ethers.parseEther('0.5')); // 50%
      await expect(tx)
        .to.emit(coCreation, 'RoyaltySplit')
        .withArgs(1, creator1.address, ethers.parseEther('0.3')); // 30%
      await expect(tx)
        .to.emit(coCreation, 'RoyaltySplit')
        .withArgs(1, creator2.address, ethers.parseEther('0.2')); // 20%

      // Verify balances increased
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      const creator1BalanceAfter = await ethers.provider.getBalance(creator1.address);
      const creator2BalanceAfter = await ethers.provider.getBalance(creator2.address);

      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(ethers.parseEther('0.5'));
      expect(creator1BalanceAfter - creator1BalanceBefore).to.equal(ethers.parseEther('0.3'));
      expect(creator2BalanceAfter - creator2BalanceBefore).to.equal(ethers.parseEther('0.2'));
    });

    it('should revert if co-creation is not published', async function () {
      // Create a new unpublished co-creation
      const puzzleId = 2;
      const creators = [owner.address, creator1.address];
      const shares = [6000, 4000];
      await coCreation.initiate(puzzleId, creators, shares);

      await expect(
        coCreation.distributeRoyalty(2, ethers.parseEther('1'))
      ).to.be.revertedWithCustomError(coCreation, 'UnauthorizedRoyaltyDistribution');
    });

    it('should revert if amount is 0', async function () {
      await expect(
        coCreation.distributeRoyalty(1, 0)
      ).to.be.revertedWith('Amount must be greater than 0');
    });

    it('should revert if contract has insufficient funds', async function () {
      const totalAmount = ethers.parseEther('100'); // 100 ETH (contract has 0)

      await expect(
        coCreation.distributeRoyalty(1, totalAmount)
      ).to.be.reverted;
    });
  });

  describe('Get Co-Creation', function () {
    it('should return correct co-creation data', async function () {
      const puzzleId = 1;
      const creators = [owner.address, creator1.address, creator2.address];
      const shares = [5000, 3000, 2000];
      await coCreation.initiate(puzzleId, creators, shares);

      const data = await coCreation.getCoCreation(1);
      expect(data.puzzleId).to.equal(puzzleId);
      expect(data.creators).to.deep.equal(creators);
      expect(data.shares).to.deep.equal(shares);
      expect(data.status).to.equal(1); // PendingSignatures
      expect(data.signatureCount).to.equal(1);
      expect(data.signedStatuses).to.deep.equal([true, false, false]);
    });

    it('should revert for invalid co-creation id', async function () {
      await expect(
        coCreation.getCoCreation(999)
      ).to.be.revertedWithCustomError(coCreation, 'InvalidCoCreationId');
    });
  });

  describe('Edge Cases', function () {
    it('should handle single creator', async function () {
      const puzzleId = 1;
      const creators = [owner.address];
      const shares = [10000];

      await coCreation.initiate(puzzleId, creators, shares);

      const data = await coCreation.getCoCreation(1);
      expect(data.signatureCount).to.equal(1); // Auto-signed
      expect(data.status).to.equal(1); // PendingSignatures

      // Can publish immediately since only one creator
      await coCreation.publish(1);
      const publishedData = await coCreation.getCoCreation(1);
      expect(publishedData.status).to.equal(2); // Published
    });

    it('should handle many creators', async function () {
      const puzzleId = 1;
      const creators = [
        owner.address,
        creator1.address,
        creator2.address,
        creator3.address,
      ];
      const shares = [2500, 2500, 2500, 2500];

      await coCreation.initiate(puzzleId, creators, shares);
      await coCreation.connect(creator1).sign(1);
      await coCreation.connect(creator2).sign(1);
      await coCreation.connect(creator3).sign(1);

      const data = await coCreation.getCoCreation(1);
      expect(data.signatureCount).to.equal(4);
      expect(data.status).to.equal(1);

      await coCreation.publish(1);
    });

    it('should handle exact 10000 bps with many small shares', async function () {
      const puzzleId = 1;
      const creators = [owner.address, creator1.address, creator2.address];
      const shares = [3333, 3333, 3334]; // Sums to 10000

      await coCreation.initiate(puzzleId, creators, shares);
      expect(await coCreation.coCreationCounter()).to.equal(1);
    });
  });
});
