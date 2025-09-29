const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DrugSupplyChain", function () {
  let UserManagement;
  let userManagement;
  let DrugSupplyChain;
  let drugSupplyChain;
  let owner;
  let manufacturer;
  let distributor;
  let pharmacist;
  let pharmacist2;
  let otherUser;

  beforeEach(async function () {
    [owner, manufacturer, distributor, pharmacist, pharmacist2, otherUser] = await ethers.getSigners();

    // Deploy UserManagement first
    UserManagement = await ethers.getContractFactory("UserManagement");
    userManagement = await UserManagement.deploy();
    await userManagement.waitForDeployment();

    // Create roles and users
    await userManagement.createRole("manufacturer");
    await userManagement.createRole("distributor");
    await userManagement.createRole("pharmacist");

    // Register users
    await userManagement.registerUser(manufacturer.address, "manufacturer@test.com", "hash1", 2); // manufacturer role
    await userManagement.registerUser(distributor.address, "distributor@test.com", "hash2", 3); // distributor role
    await userManagement.registerUser(pharmacist.address, "pharmacist@test.com", "hash3", 4); // pharmacist role
    await userManagement.registerUser(pharmacist2.address, "pharmacist2@test.com", "hash4", 4); // another pharmacist

    // Deploy DrugSupplyChain contract
    DrugSupplyChain = await ethers.getContractFactory("DrugSupplyChain");
    drugSupplyChain = await DrugSupplyChain.deploy(userManagement.target);
    await drugSupplyChain.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct UserManagement address", async function () {
      expect(await drugSupplyChain.userManagement()).to.equal(userManagement.target);
    });

    it("Should initialize counters to 0", async function () {
      expect(await drugSupplyChain.batchCounter()).to.equal(0);
      expect(await drugSupplyChain.dispenseCounter()).to.equal(0);
    });
  });

  describe("Register Batch", function () {
    const drugId = 123;
    const ipfsHash = "QmExampleIPFSHash123";
    const manufactureDate = Math.floor(Date.now() / 1000);

    it("Should allow manufacturer to register batch", async function () {
      await drugSupplyChain.connect(manufacturer).registerBatch(drugId, ipfsHash, manufactureDate);

      const batch = await drugSupplyChain.getBatch(1);
      
      expect(batch.id).to.equal(1);
      expect(batch.manufacturerUserId).to.equal(2); // Manufacturer user ID
      expect(batch.drugId).to.equal(drugId);
      expect(batch.currentOwnerUserId).to.equal(2); // Initially owned by manufacturer
      expect(batch.status).to.equal("Manufactured");
      expect(batch.ipfsHash).to.equal(ipfsHash);
      expect(batch.manufactureDate).to.equal(manufactureDate);
      expect(batch.timestamp).to.be.gt(0);
    });

    it("Should emit BatchRegistered event", async function () {
      await expect(drugSupplyChain.connect(manufacturer).registerBatch(drugId, ipfsHash, manufactureDate))
        .to.emit(drugSupplyChain, "BatchRegistered")
        .withArgs(1, 2, drugId);
    });

    it("Should increment batchCounter", async function () {
      expect(await drugSupplyChain.batchCounter()).to.equal(0);

      await drugSupplyChain.connect(manufacturer).registerBatch(drugId, ipfsHash, manufactureDate);
      expect(await drugSupplyChain.batchCounter()).to.equal(1);

      await drugSupplyChain.connect(manufacturer).registerBatch(124, "QmAnotherHash", manufactureDate);
      expect(await drugSupplyChain.batchCounter()).to.equal(2);
    });

    it("Should initialize ownership history", async function () {
      await drugSupplyChain.connect(manufacturer).registerBatch(drugId, ipfsHash, manufactureDate);

      const trackResult = await drugSupplyChain.trackBatch(1);
      expect(trackResult.ownershipHistory.length).to.equal(1);
      expect(trackResult.ownershipHistory[0]).to.equal(2); // Manufacturer user ID
    });

    it("Should not allow non-manufacturer to register batch", async function () {
      await expect(
        drugSupplyChain.connect(distributor).registerBatch(drugId, ipfsHash, manufactureDate)
      ).to.be.revertedWith("Only manufacturers can perform this action");
    });

    it("Should not allow unregistered user to register batch", async function () {
      await expect(
        drugSupplyChain.connect(otherUser).registerBatch(drugId, ipfsHash, manufactureDate)
      ).to.be.revertedWith("User not registered");
    });

    it("Should not register batch with invalid drug ID", async function () {
      await expect(
        drugSupplyChain.connect(manufacturer).registerBatch(0, ipfsHash, manufactureDate)
      ).to.be.revertedWith("Invalid drug ID");
    });

    it("Should not register batch with empty IPFS hash", async function () {
      await expect(
        drugSupplyChain.connect(manufacturer).registerBatch(drugId, "", manufactureDate)
      ).to.be.revertedWith("IPFS hash cannot be empty");
    });
  });

  describe("Transfer Batch", function () {
    const drugId = 123;
    const ipfsHash = "QmExampleIPFSHash123";
    const manufactureDate = Math.floor(Date.now() / 1000);
    let batchId;

    beforeEach(async function () {
      // Register a batch first
      await drugSupplyChain.connect(manufacturer).registerBatch(drugId, ipfsHash, manufactureDate);
      batchId = 1;
    });

    it("Should allow current owner to transfer batch to distributor", async function () {
      await drugSupplyChain.connect(manufacturer).transferBatch(batchId, distributor.address);

      const batch = await drugSupplyChain.getBatch(batchId);
      expect(batch.currentOwnerUserId).to.equal(3); // Distributor user ID
      expect(batch.status).to.equal("In Transit");
    });

    it("Should allow current owner to transfer batch to pharmacist", async function () {
      await drugSupplyChain.connect(manufacturer).transferBatch(batchId, pharmacist.address);

      const batch = await drugSupplyChain.getBatch(batchId);
      expect(batch.currentOwnerUserId).to.equal(4); // Pharmacist user ID
      expect(batch.status).to.equal("At Pharmacy");
    });

    it("Should emit BatchTransferred event", async function () {
      await expect(drugSupplyChain.connect(manufacturer).transferBatch(batchId, distributor.address))
        .to.emit(drugSupplyChain, "BatchTransferred")
        .withArgs(batchId, 2, 3, "In Transit");
    });

    it("Should update ownership history", async function () {
      await drugSupplyChain.connect(manufacturer).transferBatch(batchId, distributor.address);
      await drugSupplyChain.connect(distributor).transferBatch(batchId, pharmacist.address);

      const trackResult = await drugSupplyChain.trackBatch(batchId);
      expect(trackResult.ownershipHistory.length).to.equal(3);
      expect(trackResult.ownershipHistory[0]).to.equal(2); // Manufacturer
      expect(trackResult.ownershipHistory[1]).to.equal(3); // Distributor
      expect(trackResult.ownershipHistory[2]).to.equal(4); // Pharmacist
    });

    it("Should not allow non-owner to transfer batch", async function () {
      await expect(
        drugSupplyChain.connect(distributor).transferBatch(batchId, pharmacist.address)
      ).to.be.revertedWith("Only current owner can transfer batch");
    });

    it("Should not transfer invalid batch", async function () {
      await expect(
        drugSupplyChain.connect(manufacturer).transferBatch(999, distributor.address)
      ).to.be.revertedWith("Invalid batch ID");
    });

    it("Should not transfer to invalid address", async function () {
      await expect(
        drugSupplyChain.connect(manufacturer).transferBatch(batchId, ethers.ZeroAddress) // FIXED: Changed from ethers.constants.AddressZero
      ).to.be.revertedWith("Invalid new owner address");
    });

    it("Should not transfer to current owner", async function () {
      await expect(
        drugSupplyChain.connect(manufacturer).transferBatch(batchId, manufacturer.address)
      ).to.be.revertedWith("Cannot transfer to current owner");
    });

    it("Should not transfer to unregistered user", async function () {
      await expect(
        drugSupplyChain.connect(manufacturer).transferBatch(batchId, otherUser.address)
      ).to.be.reverted; // Will revert in userManagement.walletToUserId
    });

    it("Should set status to 'Transferred' for unknown roles", async function () {
      // Create a patient role and user
      await userManagement.createRole("patient");
      await userManagement.registerUser(otherUser.address, "patient@test.com", "hash5", 5);
      
      await drugSupplyChain.connect(manufacturer).transferBatch(batchId, otherUser.address);

      const batch = await drugSupplyChain.getBatch(batchId);
      expect(batch.status).to.equal("Transferred");
    });

    describe("Transfer Chain", function () {
      it("Should handle complete supply chain transfer", async function () {
        // Manufacturer → Distributor
        await drugSupplyChain.connect(manufacturer).transferBatch(batchId, distributor.address);
        let batch = await drugSupplyChain.getBatch(batchId);
        expect(batch.currentOwnerUserId).to.equal(3);
        expect(batch.status).to.equal("In Transit");

        // Distributor → Pharmacist
        await drugSupplyChain.connect(distributor).transferBatch(batchId, pharmacist.address);
        batch = await drugSupplyChain.getBatch(batchId);
        expect(batch.currentOwnerUserId).to.equal(4);
        expect(batch.status).to.equal("At Pharmacy");

        // Pharmacist → Another Pharmacist
        await drugSupplyChain.connect(pharmacist).transferBatch(batchId, pharmacist2.address);
        batch = await drugSupplyChain.getBatch(batchId);
        expect(batch.currentOwnerUserId).to.equal(5);
        expect(batch.status).to.equal("At Pharmacy");
      });
    });
  });

  describe("Track Batch", function () {
    const drugId = 123;
    const ipfsHash = "QmExampleIPFSHash123";
    const manufactureDate = Math.floor(Date.now() / 1000);
    let batchId;

    beforeEach(async function () {
      await drugSupplyChain.connect(manufacturer).registerBatch(drugId, ipfsHash, manufactureDate);
      batchId = 1;
      
      // Create transfer history
      await drugSupplyChain.connect(manufacturer).transferBatch(batchId, distributor.address);
      await drugSupplyChain.connect(distributor).transferBatch(batchId, pharmacist.address);
    });

    it("Should return complete batch tracking information", async function () {
      const trackResult = await drugSupplyChain.trackBatch(batchId);

      expect(trackResult.id).to.equal(batchId);
      expect(trackResult.manufacturerUserId).to.equal(2);
      expect(trackResult.drugId).to.equal(drugId);
      expect(trackResult.currentOwnerUserId).to.equal(4); // Pharmacist
      expect(trackResult.status).to.equal("At Pharmacy");
      expect(trackResult.ipfsHash).to.equal(ipfsHash);
      expect(trackResult.manufactureDate).to.equal(manufactureDate);
      expect(trackResult.timestamp).to.be.gt(0);
      
      // Check ownership history
      expect(trackResult.ownershipHistory.length).to.equal(3);
      expect(trackResult.ownershipHistory[0]).to.equal(2); // Manufacturer
      expect(trackResult.ownershipHistory[1]).to.equal(3); // Distributor
      expect(trackResult.ownershipHistory[2]).to.equal(4); // Pharmacist
    });

    it("Should revert for invalid batch ID", async function () {
      await expect(drugSupplyChain.trackBatch(999)).to.be.revertedWith("Invalid batch ID");
    });
  });

  describe("Dispense Prescription", function () {
    const drugId = 123;
    const ipfsHash = "QmExampleIPFSHash123";
    const manufactureDate = Math.floor(Date.now() / 1000);
    const prescriptionId = 456;
    const quantity = 10;
    const blockchainTx = "0x1234567890abcdef";
    let batchId;

    beforeEach(async function () {
      // Register batch and transfer to pharmacist
      await drugSupplyChain.connect(manufacturer).registerBatch(drugId, ipfsHash, manufactureDate);
      batchId = 1;
      await drugSupplyChain.connect(manufacturer).transferBatch(batchId, pharmacist.address);
    });

    it("Should allow pharmacist to dispense prescription", async function () {
      await drugSupplyChain.connect(pharmacist).dispensePrescription(prescriptionId, batchId, quantity, blockchainTx);

      const dispenseRecord = await drugSupplyChain.getDispenseRecord(1);
      
      expect(dispenseRecord.id).to.equal(1);
      expect(dispenseRecord.prescriptionId).to.equal(prescriptionId);
      expect(dispenseRecord.pharmacistUserId).to.equal(4); // Pharmacist user ID
      expect(dispenseRecord.batchId).to.equal(batchId);
      expect(dispenseRecord.quantity).to.equal(quantity);
      expect(dispenseRecord.dispensedAt).to.be.gt(0);
      expect(dispenseRecord.blockchainTx).to.equal(blockchainTx);
    });

    it("Should emit PrescriptionDispensed event", async function () {
      await expect(drugSupplyChain.connect(pharmacist).dispensePrescription(prescriptionId, batchId, quantity, blockchainTx))
        .to.emit(drugSupplyChain, "PrescriptionDispensed")
        .withArgs(1, prescriptionId, 4, batchId, quantity);
    });

    it("Should increment dispenseCounter", async function () {
      expect(await drugSupplyChain.dispenseCounter()).to.equal(0);

      await drugSupplyChain.connect(pharmacist).dispensePrescription(prescriptionId, batchId, quantity, blockchainTx);
      expect(await drugSupplyChain.dispenseCounter()).to.equal(1);

      await drugSupplyChain.connect(pharmacist).dispensePrescription(457, batchId, 5, "0xanothertx");
      expect(await drugSupplyChain.dispenseCounter()).to.equal(2);
    });

    it("Should not allow non-pharmacist to dispense", async function () {
      await expect(
        drugSupplyChain.connect(manufacturer).dispensePrescription(prescriptionId, batchId, quantity, blockchainTx)
      ).to.be.revertedWith("Only pharmacists can perform this action");
    });

    it("Should not allow unregistered user to dispense", async function () {
      await expect(
        drugSupplyChain.connect(otherUser).dispensePrescription(prescriptionId, batchId, quantity, blockchainTx)
      ).to.be.revertedWith("User not registered");
    });

    it("Should not dispense with invalid batch ID", async function () {
      await expect(
        drugSupplyChain.connect(pharmacist).dispensePrescription(prescriptionId, 999, quantity, blockchainTx)
      ).to.be.revertedWith("Invalid batch ID");
    });

    it("Should not dispense with zero quantity", async function () {
      await expect(
        drugSupplyChain.connect(pharmacist).dispensePrescription(prescriptionId, batchId, 0, blockchainTx)
      ).to.be.revertedWith("Quantity must be positive");
    });
  });

  describe("Getter Functions", function () {
    const drugId = 123;
    const ipfsHash = "QmExampleIPFSHash123";
    const manufactureDate = Math.floor(Date.now() / 1000);

    beforeEach(async function () {
      await drugSupplyChain.connect(manufacturer).registerBatch(drugId, ipfsHash, manufactureDate);
      await drugSupplyChain.connect(manufacturer).transferBatch(1, pharmacist.address);
      await drugSupplyChain.connect(pharmacist).dispensePrescription(456, 1, 10, "0xtx123");
    });

    describe("getBatch", function () {
      it("Should return batch details", async function () {
        const batch = await drugSupplyChain.getBatch(1);

        expect(batch.id).to.equal(1);
        expect(batch.manufacturerUserId).to.equal(2);
        expect(batch.drugId).to.equal(drugId);
        expect(batch.currentOwnerUserId).to.equal(4);
        expect(batch.status).to.equal("At Pharmacy");
        expect(batch.ipfsHash).to.equal(ipfsHash);
        expect(batch.manufactureDate).to.equal(manufactureDate);
      });

      it("Should revert for invalid batch ID", async function () {
        await expect(drugSupplyChain.getBatch(999)).to.be.revertedWith("Invalid batch ID");
      });
    });

    describe("getDispenseRecord", function () {
      it("Should return dispense record details", async function () {
        const dispenseRecord = await drugSupplyChain.getDispenseRecord(1);

        expect(dispenseRecord.id).to.equal(1);
        expect(dispenseRecord.prescriptionId).to.equal(456);
        expect(dispenseRecord.pharmacistUserId).to.equal(4);
        expect(dispenseRecord.batchId).to.equal(1);
        expect(dispenseRecord.quantity).to.equal(10);
        expect(dispenseRecord.blockchainTx).to.equal("0xtx123");
      });

      it("Should return empty record for invalid dispense ID", async function () {
        // This doesn't revert, just returns default struct
        const dispenseRecord = await drugSupplyChain.getDispenseRecord(999);
        expect(dispenseRecord.id).to.equal(0);
        expect(dispenseRecord.prescriptionId).to.equal(0);
        expect(dispenseRecord.quantity).to.equal(0);
      });
    });
  });

  describe("Multiple Batches", function () {
    it("Should handle multiple batches independently", async function () {
      const manufactureDate = Math.floor(Date.now() / 1000);

      // Register multiple batches
      await drugSupplyChain.connect(manufacturer).registerBatch(111, "QmHash1", manufactureDate);
      await drugSupplyChain.connect(manufacturer).registerBatch(222, "QmHash2", manufactureDate);
      await drugSupplyChain.connect(manufacturer).registerBatch(333, "QmHash3", manufactureDate);

      // Transfer batches differently
      await drugSupplyChain.connect(manufacturer).transferBatch(1, distributor.address);
      await drugSupplyChain.connect(manufacturer).transferBatch(2, pharmacist.address);
      // Batch 3 stays with manufacturer

      // Verify each batch maintains independent state
      const batch1 = await drugSupplyChain.getBatch(1);
      const batch2 = await drugSupplyChain.getBatch(2);
      const batch3 = await drugSupplyChain.getBatch(3);

      expect(batch1.currentOwnerUserId).to.equal(3); // Distributor
      expect(batch1.status).to.equal("In Transit");
      
      expect(batch2.currentOwnerUserId).to.equal(4); // Pharmacist
      expect(batch2.status).to.equal("At Pharmacy");
      
      expect(batch3.currentOwnerUserId).to.equal(2); // Manufacturer
      expect(batch3.status).to.equal("Manufactured");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle large drug IDs", async function () {
      const largeDrugId = ethers.MaxUint256; // FIXED: Changed from ethers.constants.MaxUint256
      const manufactureDate = Math.floor(Date.now() / 1000);

      await drugSupplyChain.connect(manufacturer).registerBatch(largeDrugId, "QmHash", manufactureDate);

      const batch = await drugSupplyChain.getBatch(1);
      expect(batch.drugId).to.equal(largeDrugId);
    });

    it("Should handle long IPFS hashes", async function () {
      const longIpfsHash = "Qm" + "A".repeat(100); // Long IPFS hash
      const manufactureDate = Math.floor(Date.now() / 1000);

      await drugSupplyChain.connect(manufacturer).registerBatch(123, longIpfsHash, manufactureDate);

      const batch = await drugSupplyChain.getBatch(1);
      expect(batch.ipfsHash).to.equal(longIpfsHash);
    });

    it("Should handle long blockchain transaction hashes", async function () {
      const longTxHash = "0x" + "A".repeat(100); // Long transaction hash
      const manufactureDate = Math.floor(Date.now() / 1000);

      await drugSupplyChain.connect(manufacturer).registerBatch(123, "QmHash", manufactureDate);
      await drugSupplyChain.connect(manufacturer).transferBatch(1, pharmacist.address);
      await drugSupplyChain.connect(pharmacist).dispensePrescription(456, 1, 10, longTxHash);

      const dispenseRecord = await drugSupplyChain.getDispenseRecord(1);
      expect(dispenseRecord.blockchainTx).to.equal(longTxHash);
    });

    it("Should handle future manufacture dates", async function () {
      const futureDate = Math.floor(Date.now() / 1000) + 86400; // 1 day in future
      
      await drugSupplyChain.connect(manufacturer).registerBatch(123, "QmHash", futureDate);

      const batch = await drugSupplyChain.getBatch(1);
      expect(batch.manufactureDate).to.equal(futureDate);
    });
  });
});