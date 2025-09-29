const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RegulatorOversight", function () {
  let UserManagement;
  let userManagement;
  let RegulatorOversight;
  let regulatorOversight;
  let owner;
  let regulator;
  let regulator2;
  let doctor;
  let patient;
  let otherUser;

  beforeEach(async function () {
    [owner, regulator, regulator2, doctor, patient, otherUser] = await ethers.getSigners();

    // Deploy UserManagement first
    UserManagement = await ethers.getContractFactory("UserManagement");
    userManagement = await UserManagement.deploy();
    await userManagement.waitForDeployment();

    // Create roles and users
    await userManagement.createRole("regulator");
    await userManagement.createRole("doctor");
    await userManagement.createRole("patient");

    // Register users
    await userManagement.registerUser(regulator.address, "regulator@test.com", "hash1", 2); // regulator role
    await userManagement.registerUser(doctor.address, "doctor@test.com", "hash2", 3); // doctor role
    await userManagement.registerUser(patient.address, "patient@test.com", "hash3", 4); // patient role

    // Deploy RegulatorOversight
    RegulatorOversight = await ethers.getContractFactory("RegulatorOversight");
    regulatorOversight = await RegulatorOversight.deploy(userManagement.target);
    await regulatorOversight.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct UserManagement address", async function () {
      expect(await regulatorOversight.userManagement()).to.equal(userManagement.target);
    });

    it("Should initialize flaggedBatchCounter to 0", async function () {
      expect(await regulatorOversight.flaggedBatchCounter()).to.equal(0);
    });
  });

  describe("Flag Batch", function () {
    it("Should allow regulator to flag a batch", async function () {
      const drugBatchId = 123;
      const reason = "Suspicious quality issues";

      await regulatorOversight.connect(regulator).flagBatch(drugBatchId, reason);

      const flaggedBatch = await regulatorOversight.getFlaggedBatch(1);
      
      expect(flaggedBatch.id).to.equal(1);
      expect(flaggedBatch.drugBatchId).to.equal(drugBatchId);
      expect(flaggedBatch.regulatorUserId).to.equal(2); // regulator user ID
      expect(flaggedBatch.reason).to.equal(reason);
      expect(flaggedBatch.resolved).to.be.false;
      expect(flaggedBatch.timestamp).to.be.gt(0);
    });

    it("Should emit BatchFlagged event", async function () {
      const drugBatchId = 123;
      const reason = "Suspicious quality issues";

      await expect(regulatorOversight.connect(regulator).flagBatch(drugBatchId, reason))
        .to.emit(regulatorOversight, "BatchFlagged")
        .withArgs(1, drugBatchId, 2, reason);
    });

    it("Should increment flaggedBatchCounter", async function () {
      expect(await regulatorOversight.flaggedBatchCounter()).to.equal(0);

      await regulatorOversight.connect(regulator).flagBatch(123, "Reason 1");
      expect(await regulatorOversight.flaggedBatchCounter()).to.equal(1);

      await regulatorOversight.connect(regulator).flagBatch(124, "Reason 2");
      expect(await regulatorOversight.flaggedBatchCounter()).to.equal(2);
    });

    it("Should add to flaggedBatchIds array", async function () {
      await regulatorOversight.connect(regulator).flagBatch(123, "Reason 1");
      await regulatorOversight.connect(regulator).flagBatch(124, "Reason 2");

      const flaggedIds = await regulatorOversight.getFlaggedBatchIds();
      expect(flaggedIds.length).to.equal(2);
      expect(flaggedIds[0]).to.equal(1);
      expect(flaggedIds[1]).to.equal(2);
    });

    it("Should not allow non-regulator to flag batch", async function () {
      await expect(
        regulatorOversight.connect(doctor).flagBatch(123, "Reason")
      ).to.be.revertedWith("Only regulators can perform this action");
    });

    it("Should not allow unregistered user to flag batch", async function () {
      await expect(
        regulatorOversight.connect(otherUser).flagBatch(123, "Reason")
      ).to.be.revertedWith("User not registered");
    });

    it("Should not allow flagging with invalid batch ID", async function () {
      await expect(
        regulatorOversight.connect(regulator).flagBatch(0, "Reason")
      ).to.be.revertedWith("Invalid batch ID");
    });

    it("Should not allow flagging with empty reason", async function () {
      await expect(
        regulatorOversight.connect(regulator).flagBatch(123, "")
      ).to.be.revertedWith("Reason cannot be empty");
    });
  });

  describe("Resolve Batch", function () {
    beforeEach(async function () {
      // Flag some batches first
      await regulatorOversight.connect(regulator).flagBatch(123, "Quality issues");
      await regulatorOversight.connect(regulator).flagBatch(124, "Documentation problems");
    });

    it("Should allow regulator to resolve a flagged batch", async function () {
      await regulatorOversight.connect(regulator).resolveBatch(1);

      const flaggedBatch = await regulatorOversight.getFlaggedBatch(1);
      expect(flaggedBatch.resolved).to.be.true;
    });

    it("Should emit BatchResolved event", async function () {
      await expect(regulatorOversight.connect(regulator).resolveBatch(1))
        .to.emit(regulatorOversight, "BatchResolved")
        .withArgs(1, 123, 2);
    });

    it("Should not allow resolving non-existent batch", async function () {
      await expect(
        regulatorOversight.connect(regulator).resolveBatch(999)
      ).to.be.revertedWith("Batch not flagged");
    });

    it("Should not allow resolving already resolved batch", async function () {
      await regulatorOversight.connect(regulator).resolveBatch(1);

      await expect(
        regulatorOversight.connect(regulator).resolveBatch(1)
      ).to.be.revertedWith("Batch already resolved");
    });

    it("Should not allow non-regulator to resolve batch", async function () {
      await expect(
        regulatorOversight.connect(doctor).resolveBatch(1)
      ).to.be.revertedWith("Only regulators can perform this action");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Flag multiple batches
      await regulatorOversight.connect(regulator).flagBatch(123, "Issue 1");
      await regulatorOversight.connect(regulator).flagBatch(124, "Issue 2");
      await regulatorOversight.connect(regulator).flagBatch(125, "Issue 3");
      
      // Resolve one batch
      await regulatorOversight.connect(regulator).resolveBatch(2);
    });

    describe("getFlaggedBatch", function () {
      it("Should return correct flagged batch details", async function () {
        const flaggedBatch = await regulatorOversight.getFlaggedBatch(1);

        expect(flaggedBatch.id).to.equal(1);
        expect(flaggedBatch.drugBatchId).to.equal(123);
        expect(flaggedBatch.regulatorUserId).to.equal(2);
        expect(flaggedBatch.reason).to.equal("Issue 1");
        expect(flaggedBatch.resolved).to.be.false;
        expect(flaggedBatch.timestamp).to.be.gt(0);
      });

      it("Should revert for non-existent batch", async function () {
        await expect(
          regulatorOversight.getFlaggedBatch(999)
        ).to.be.revertedWith("Batch not flagged");
      });
    });

    describe("getFlaggedBatchIds", function () {
      it("Should return all flagged batch IDs", async function () {
        const flaggedIds = await regulatorOversight.getFlaggedBatchIds();

        expect(flaggedIds.length).to.equal(3);
        expect(flaggedIds[0]).to.equal(1);
        expect(flaggedIds[1]).to.equal(2);
        expect(flaggedIds[2]).to.equal(3);
      });

      it("Should return empty array when no batches flagged", async function () {
        // Deploy fresh contract with no flagged batches
        const newRegulatorOversight = await RegulatorOversight.deploy(userManagement.target);
        await newRegulatorOversight.waitForDeployment();
        const flaggedIds = await newRegulatorOversight.getFlaggedBatchIds();

        expect(flaggedIds.length).to.equal(0);
      });
    });

    describe("getAllFlaggedBatches", function () {
      it("Should return all flagged batches", async function () {
        const allBatches = await regulatorOversight.getAllFlaggedBatches();

        expect(allBatches.length).to.equal(3);
        
        // Check first batch
        expect(allBatches[0].id).to.equal(1);
        expect(allBatches[0].drugBatchId).to.equal(123);
        expect(allBatches[0].reason).to.equal("Issue 1");
        expect(allBatches[0].resolved).to.be.false;

        // Check second batch (resolved)
        expect(allBatches[1].id).to.equal(2);
        expect(allBatches[1].drugBatchId).to.equal(124);
        expect(allBatches[1].reason).to.equal("Issue 2");
        expect(allBatches[1].resolved).to.be.true;

        // Check third batch
        expect(allBatches[2].id).to.equal(3);
        expect(allBatches[2].drugBatchId).to.equal(125);
        expect(allBatches[2].reason).to.equal("Issue 3");
        expect(allBatches[2].resolved).to.be.false;
      });

      it("Should return empty array when no batches flagged", async function () {
        const newRegulatorOversight = await RegulatorOversight.deploy(userManagement.target);
        await newRegulatorOversight.waitForDeployment();
        const allBatches = await newRegulatorOversight.getAllFlaggedBatches();

        expect(allBatches.length).to.equal(0);
      });
    });

    describe("isBatchFlagged", function () {
      it("Should return true for active flagged batch", async function () {
        expect(await regulatorOversight.isBatchFlagged(1)).to.be.true;
      });

      it("Should return false for resolved batch", async function () {
        expect(await regulatorOversight.isBatchFlagged(2)).to.be.false;
      });

      it("Should return false for non-existent batch", async function () {
        expect(await regulatorOversight.isBatchFlagged(999)).to.be.false;
      });
    });
  });

  describe("Multiple Regulators", function () {
    beforeEach(async function () {
      // Register second regulator from existing signers
      await userManagement.registerUser(regulator2.address, "regulator2@test.com", "hash4", 2);
    });

    it("Should allow multiple regulators to flag batches", async function () {
      await regulatorOversight.connect(regulator).flagBatch(111, "Reason from regulator 1");
      await regulatorOversight.connect(regulator2).flagBatch(222, "Reason from regulator 2");

      const batch1 = await regulatorOversight.getFlaggedBatch(1);
      const batch2 = await regulatorOversight.getFlaggedBatch(2);

      expect(batch1.regulatorUserId).to.equal(2); // First regulator user ID
      expect(batch2.regulatorUserId).to.equal(5); // Second regulator user ID
    });

    it("Should allow any regulator to resolve any batch", async function () {
      await regulatorOversight.connect(regulator).flagBatch(111, "Reason");
      
      // Second regulator resolves batch flagged by first regulator
      await regulatorOversight.connect(regulator2).resolveBatch(1);

      const batch = await regulatorOversight.getFlaggedBatch(1);
      expect(batch.resolved).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle large batch IDs", async function () {
      const largeBatchId = ethers.MaxUint256; // FIXED: Changed from ethers.constants.MaxUint256
      await regulatorOversight.connect(regulator).flagBatch(largeBatchId, "Reason");

      const batch = await regulatorOversight.getFlaggedBatch(1);
      expect(batch.drugBatchId).to.equal(largeBatchId);
    });

    it("Should handle long reasons", async function () {
      const longReason = "A".repeat(1000); // Long reason string
      await regulatorOversight.connect(regulator).flagBatch(123, longReason);

      const batch = await regulatorOversight.getFlaggedBatch(1);
      expect(batch.reason).to.equal(longReason);
    });

    it("Should maintain correct order in flaggedBatchIds", async function () {
      // Flag batches in sequence
      await regulatorOversight.connect(regulator).flagBatch(1, "Reason 1");
      await regulatorOversight.connect(regulator).flagBatch(2, "Reason 2");
      await regulatorOversight.connect(regulator).flagBatch(3, "Reason 3");

      const flaggedIds = await regulatorOversight.getFlaggedBatchIds();
      
      expect(flaggedIds[0]).to.equal(1);
      expect(flaggedIds[1]).to.equal(2);
      expect(flaggedIds[2]).to.equal(3);
    });
  });
});