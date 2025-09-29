const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Prescription", function () {
  let UserManagement;
  let userManagement;
  let Prescription;
  let prescription;
  let owner;
  let doctor;
  let pharmacist;
  let regulator;
  let patient;
  let otherUser;

  beforeEach(async function () {
    [owner, doctor, pharmacist, regulator, patient, otherUser] = await ethers.getSigners();

    // Deploy UserManagement first
    UserManagement = await ethers.getContractFactory("UserManagement");
    userManagement = await UserManagement.deploy();
    await userManagement.waitForDeployment();

    // Create roles - these will get IDs 2, 3, 4, 5 (admin is already ID 1)
    await userManagement.createRole("doctor");
    await userManagement.createRole("pharmacist");
    await userManagement.createRole("regulator");
    await userManagement.createRole("patient");

    // Register users with correct role IDs (2-5)
    await userManagement.registerUser(doctor.address, "doctor@test.com", "hash1", 2); // doctor role ID 2
    await userManagement.registerUser(pharmacist.address, "pharmacist@test.com", "hash2", 3); // pharmacist role ID 3
    await userManagement.registerUser(regulator.address, "regulator@test.com", "hash3", 4); // regulator role ID 4
    await userManagement.registerUser(patient.address, "patient@test.com", "hash4", 5); // patient role ID 5

    // Deploy Prescription contract
    Prescription = await ethers.getContractFactory("Prescription");
    prescription = await Prescription.deploy(userManagement.target);
    await prescription.waitForDeployment();
  });

  // Helper function to get current blockchain timestamp
  async function getCurrentTimestamp() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    return block.timestamp;
  }

  describe("Deployment", function () {
    it("Should set the correct UserManagement address", async function () {
      expect(await prescription.userManagement()).to.equal(userManagement.target);
    });

    it("Should initialize prescriptionCounter to 0", async function () {
      expect(await prescription.prescriptionCounter()).to.equal(0);
    });
  });

  describe("Create Prescription", function () {
    const patientUserId = 5; // Patient user ID
    const drugId = 123;
    const dosage = "500mg twice daily";
    const ipfsHash = "QmExampleIPFSHash123";
    const qrCode = "QRCODE123456789";

    it("Should allow doctor to create prescription", async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400; // 1 day from now

      await prescription.connect(doctor).createPrescription(
        patientUserId,
        drugId,
        dosage,
        ipfsHash,
        qrCode,
        expiresAt
      );

      const presc = await prescription.getPrescription(1);
      
      expect(presc.id).to.equal(1);
      expect(presc.doctorUserId).to.equal(2); // Doctor user ID
      expect(presc.patientUserId).to.equal(patientUserId);
      expect(presc.drugId).to.equal(drugId);
      expect(presc.dosage).to.equal(dosage);
      expect(presc.ipfsHash).to.equal(ipfsHash);
      expect(presc.qrCode).to.equal(qrCode);
      expect(presc.status).to.equal("issued");
      expect(presc.issuedAt).to.be.gt(0);
      expect(presc.expiresAt).to.equal(expiresAt);
      expect(presc.isRevoked).to.be.false;
      expect(presc.revokedByUserId).to.equal(0);
      expect(presc.revocationReason).to.equal("");
      expect(presc.revokedAt).to.equal(0);
    });

    it("Should emit PrescriptionCreated event", async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      await expect(
        prescription.connect(doctor).createPrescription(
          patientUserId,
          drugId,
          dosage,
          ipfsHash,
          qrCode,
          expiresAt
        )
      )
        .to.emit(prescription, "PrescriptionCreated")
        .withArgs(1, 2, patientUserId, drugId, qrCode);
    });

    it("Should increment prescriptionCounter", async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      expect(await prescription.prescriptionCounter()).to.equal(0);

      await prescription.connect(doctor).createPrescription(
        patientUserId,
        drugId,
        dosage,
        ipfsHash,
        qrCode,
        expiresAt
      );
      expect(await prescription.prescriptionCounter()).to.equal(1);

      await prescription.connect(doctor).createPrescription(
        patientUserId,
        124,
        "250mg daily",
        "QmAnotherHash",
        "QRCODE987654",
        expiresAt
      );
      expect(await prescription.prescriptionCounter()).to.equal(2);
    });

    it("Should not allow non-doctor to create prescription", async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      await expect(
        prescription.connect(pharmacist).createPrescription(
          patientUserId,
          drugId,
          dosage,
          ipfsHash,
          qrCode,
          expiresAt
        )
      ).to.be.revertedWith("Only doctors can perform this action");
    });

    it("Should not allow unregistered user to create prescription", async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      await expect(
        prescription.connect(otherUser).createPrescription(
          patientUserId,
          drugId,
          dosage,
          ipfsHash,
          qrCode,
          expiresAt
        )
      ).to.be.revertedWith("User not registered");
    });

    it("Should not create prescription with invalid patient ID", async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      await expect(
        prescription.connect(doctor).createPrescription(
          0, // Invalid patient ID
          drugId,
          dosage,
          ipfsHash,
          qrCode,
          expiresAt
        )
      ).to.be.revertedWith("Invalid patient ID");
    });

    it("Should not create prescription with invalid drug ID", async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      await expect(
        prescription.connect(doctor).createPrescription(
          patientUserId,
          0, // Invalid drug ID
          dosage,
          ipfsHash,
          qrCode,
          expiresAt
        )
      ).to.be.revertedWith("Invalid drug ID");
    });

    it("Should not create prescription with empty dosage", async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      await expect(
        prescription.connect(doctor).createPrescription(
          patientUserId,
          drugId,
          "", // Empty dosage
          ipfsHash,
          qrCode,
          expiresAt
        )
      ).to.be.revertedWith("Dosage cannot be empty");
    });

    it("Should not create prescription with empty IPFS hash", async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      await expect(
        prescription.connect(doctor).createPrescription(
          patientUserId,
          drugId,
          dosage,
          "", // Empty IPFS hash
          qrCode,
          expiresAt
        )
      ).to.be.revertedWith("IPFS hash cannot be empty");
    });

    it("Should not create prescription with empty QR code", async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      await expect(
        prescription.connect(doctor).createPrescription(
          patientUserId,
          drugId,
          dosage,
          ipfsHash,
          "", // Empty QR code
          expiresAt
        )
      ).to.be.revertedWith("QR code cannot be empty");
    });

    it("Should not create prescription with past expiry date", async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const pastExpiry = currentTimestamp - 3600; // 1 hour ago
      
      await expect(
        prescription.connect(doctor).createPrescription(
          patientUserId,
          drugId,
          dosage,
          ipfsHash,
          qrCode,
          pastExpiry
        )
      ).to.be.revertedWith("Expiry must be in the future");
    });
  });

  describe("Verify Prescription", function () {
    const patientUserId = 5;
    const drugId = 123;
    const dosage = "500mg twice daily";
    const ipfsHash = "QmExampleIPFSHash123";
    const qrCode = "QRCODE123456789";

    beforeEach(async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400; // 1 day from now
      
      // Create a prescription first
      await prescription.connect(doctor).createPrescription(
        patientUserId,
        drugId,
        dosage,
        ipfsHash,
        qrCode,
        expiresAt
      );
    });

    it("Should allow pharmacist to verify prescription", async function () {
      await prescription.connect(pharmacist).verifyPrescription(1);

      const presc = await prescription.getPrescription(1);
      expect(presc.status).to.equal("verified");
    });

    it("Should emit PrescriptionVerified event", async function () {
      await expect(prescription.connect(pharmacist).verifyPrescription(1))
        .to.emit(prescription, "PrescriptionVerified")
        .withArgs(1, 3); // pharmacist user ID
    });

    it("Should not allow non-pharmacist to verify prescription", async function () {
      await expect(
        prescription.connect(doctor).verifyPrescription(1)
      ).to.be.revertedWith("Only pharmacists can perform this action");
    });

    it("Should not allow unregistered user to verify prescription", async function () {
      await expect(
        prescription.connect(otherUser).verifyPrescription(1)
      ).to.be.revertedWith("User not registered");
    });

    it("Should not verify invalid prescription ID", async function () {
      await expect(
        prescription.connect(pharmacist).verifyPrescription(999)
      ).to.be.revertedWith("Invalid prescription ID");
    });

    it("Should not verify already dispensed prescription", async function () {
      // Verify and then dispense
      await prescription.connect(pharmacist).verifyPrescription(1);
      await prescription.connect(pharmacist).dispensePrescription(1);

      await expect(
        prescription.connect(pharmacist).verifyPrescription(1)
      ).to.be.revertedWith("Prescription cannot be verified");
    });

    it("Should not verify expired prescription", async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const shortExpiry = currentTimestamp + 2; // 2 seconds from now
      
      // Create a prescription with short expiry
      await prescription.connect(doctor).createPrescription(
        patientUserId,
        124,
        "250mg daily",
        "QmAnotherHash",
        "QRCODE987654",
        shortExpiry
      );

      // Advance time beyond expiry
      await ethers.provider.send("evm_increaseTime", [3]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        prescription.connect(pharmacist).verifyPrescription(2)
      ).to.be.revertedWith("Prescription expired");
    });

    it("Should not verify revoked prescription", async function () {
      // Revoke the prescription first
      await prescription.connect(doctor).revokePrescription(1, "Patient requested cancellation");
      
      await expect(
        prescription.connect(pharmacist).verifyPrescription(1)
      ).to.be.revertedWith("Prescription has been revoked");
    });
  });

  describe("Dispense Prescription", function () {
    const patientUserId = 5;
    const drugId = 123;
    const dosage = "500mg twice daily";
    const ipfsHash = "QmExampleIPFSHash123";
    const qrCode = "QRCODE123456789";

    beforeEach(async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400; // 1 day from now
      
      // Create and verify a prescription first
      await prescription.connect(doctor).createPrescription(
        patientUserId,
        drugId,
        dosage,
        ipfsHash,
        qrCode,
        expiresAt
      );
      await prescription.connect(pharmacist).verifyPrescription(1);
    });

    it("Should allow pharmacist to dispense verified prescription", async function () {
      await prescription.connect(pharmacist).dispensePrescription(1);

      const presc = await prescription.getPrescription(1);
      expect(presc.status).to.equal("dispensed");
    });

    it("Should emit PrescriptionDispensed event", async function () {
      await expect(prescription.connect(pharmacist).dispensePrescription(1))
        .to.emit(prescription, "PrescriptionDispensed")
        .withArgs(1, 3); // pharmacist user ID
    });

    it("Should not allow non-pharmacist to dispense prescription", async function () {
      await expect(
        prescription.connect(doctor).dispensePrescription(1)
      ).to.be.revertedWith("Only pharmacists can perform this action");
    });

    it("Should not allow unregistered user to dispense prescription", async function () {
      await expect(
        prescription.connect(otherUser).dispensePrescription(1)
      ).to.be.revertedWith("User not registered");
    });

    it("Should not dispense invalid prescription ID", async function () {
      await expect(
        prescription.connect(pharmacist).dispensePrescription(999)
      ).to.be.revertedWith("Invalid prescription ID");
    });

    it("Should not dispense unverified prescription", async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      // Create another prescription but don't verify it
      await prescription.connect(doctor).createPrescription(
        patientUserId,
        124,
        "250mg daily",
        "QmAnotherHash",
        "QRCODE987654",
        expiresAt
      );

      await expect(
        prescription.connect(pharmacist).dispensePrescription(2)
      ).to.be.revertedWith("Prescription must be verified first");
    });

    it("Should not dispense already dispensed prescription", async function () {
      await prescription.connect(pharmacist).dispensePrescription(1);

      await expect(
        prescription.connect(pharmacist).dispensePrescription(1)
      ).to.be.revertedWith("Prescription must be verified first");
    });

    it("Should not dispense revoked prescription", async function () {
      // Revoke the prescription after verification
      await prescription.connect(doctor).revokePrescription(1, "Patient allergic reaction");
      
      await expect(
        prescription.connect(pharmacist).dispensePrescription(1)
      ).to.be.revertedWith("Prescription has been revoked");
    });
  });

  describe("Revoke Prescription", function () {
    const patientUserId = 5;
    const drugId = 123;
    const dosage = "500mg twice daily";
    const ipfsHash = "QmExampleIPFSHash123";
    const qrCode = "QRCODE123456789";

    beforeEach(async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400; // 1 day from now
      
      // Create a prescription first
      await prescription.connect(doctor).createPrescription(
        patientUserId,
        drugId,
        dosage,
        ipfsHash,
        qrCode,
        expiresAt
      );
    });

    it("Should allow prescribing doctor to revoke prescription", async function () {
      const reason = "Patient requested cancellation";
      await prescription.connect(doctor).revokePrescription(1, reason);

      const presc = await prescription.getPrescription(1);
      expect(presc.isRevoked).to.be.true;
      expect(presc.status).to.equal("revoked");
      expect(presc.revokedByUserId).to.equal(2); // Doctor user ID
      expect(presc.revocationReason).to.equal(reason);
      expect(presc.revokedAt).to.be.gt(0);
    });

    it("Should allow regulator to revoke prescription", async function () {
      const reason = "Suspicious prescription pattern";
      await prescription.connect(regulator).revokePrescription(1, reason);

      const presc = await prescription.getPrescription(1);
      expect(presc.isRevoked).to.be.true;
      expect(presc.revokedByUserId).to.equal(4); // Regulator user ID
      expect(presc.revocationReason).to.equal(reason);
    });

    it("Should emit PrescriptionRevoked event", async function () {
      const reason = "Patient allergic to medication";
      
      await expect(prescription.connect(doctor).revokePrescription(1, reason))
        .to.emit(prescription, "PrescriptionRevoked")
        .withArgs(1, 2, reason);
    });

    it("Should not allow non-doctor/non-regulator to revoke prescription", async function () {
      await expect(
        prescription.connect(pharmacist).revokePrescription(1, "Reason")
      ).to.be.revertedWith("Not authorized to revoke prescription");
    });

    it("Should not allow unregistered user to revoke prescription", async function () {
      await expect(
        prescription.connect(otherUser).revokePrescription(1, "Reason")
      ).to.be.revertedWith("User not registered");
    });

    it("Should not revoke invalid prescription ID", async function () {
      await expect(
        prescription.connect(doctor).revokePrescription(999, "Reason")
      ).to.be.revertedWith("Invalid prescription ID");
    });

    it("Should not revoke already revoked prescription", async function () {
      await prescription.connect(doctor).revokePrescription(1, "First revocation");
      
      await expect(
        prescription.connect(doctor).revokePrescription(1, "Second revocation")
      ).to.be.revertedWith("Prescription already revoked");
    });

    it("Should not revoke with empty reason", async function () {
      await expect(
        prescription.connect(doctor).revokePrescription(1, "")
      ).to.be.revertedWith("Revocation reason cannot be empty");
    });

    it("Should prevent operations on revoked prescription", async function () {
      await prescription.connect(doctor).revokePrescription(1, "Safety concerns");
      
      // Should not be able to verify revoked prescription
      await expect(
        prescription.connect(pharmacist).verifyPrescription(1)
      ).to.be.revertedWith("Prescription has been revoked");
      
      // Should not be able to dispense revoked prescription
      await expect(
        prescription.connect(pharmacist).dispensePrescription(1)
      ).to.be.revertedWith("Prescription has been revoked");
    });
  });

  describe("Get Prescription", function () {
    const patientUserId = 5;
    const drugId = 123;
    const dosage = "500mg twice daily";
    const ipfsHash = "QmExampleIPFSHash123";
    const qrCode = "QRCODE123456789";

    beforeEach(async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400; // 1 day from now
      
      await prescription.connect(doctor).createPrescription(
        patientUserId,
        drugId,
        dosage,
        ipfsHash,
        qrCode,
        expiresAt
      );
    });

    it("Should return correct prescription details", async function () {
      const presc = await prescription.getPrescription(1);

      expect(presc.id).to.equal(1);
      expect(presc.doctorUserId).to.equal(2);
      expect(presc.patientUserId).to.equal(patientUserId);
      expect(presc.drugId).to.equal(drugId);
      expect(presc.dosage).to.equal(dosage);
      expect(presc.ipfsHash).to.equal(ipfsHash);
      expect(presc.qrCode).to.equal(qrCode);
      expect(presc.status).to.equal("issued");
      expect(presc.issuedAt).to.be.gt(0);
      expect(presc.expiresAt).to.be.gt(0);
      expect(presc.isRevoked).to.be.false;
      expect(presc.revokedByUserId).to.equal(0);
      expect(presc.revocationReason).to.equal("");
      expect(presc.revokedAt).to.equal(0);
    });

    it("Should revert for invalid prescription ID", async function () {
      await expect(
        prescription.getPrescription(999)
      ).to.be.revertedWith("Invalid prescription ID");
    });

    it("Should return updated status after verification and dispensing", async function () {
      let presc = await prescription.getPrescription(1);
      expect(presc.status).to.equal("issued");

      await prescription.connect(pharmacist).verifyPrescription(1);
      presc = await prescription.getPrescription(1);
      expect(presc.status).to.equal("verified");

      await prescription.connect(pharmacist).dispensePrescription(1);
      presc = await prescription.getPrescription(1);
      expect(presc.status).to.equal("dispensed");
    });

    it("Should return revocation details after revocation", async function () {
      const reason = "Patient changed mind";
      await prescription.connect(doctor).revokePrescription(1, reason);

      const presc = await prescription.getPrescription(1);
      expect(presc.isRevoked).to.be.true;
      expect(presc.status).to.equal("revoked");
      expect(presc.revokedByUserId).to.equal(2);
      expect(presc.revocationReason).to.equal(reason);
      expect(presc.revokedAt).to.be.gt(0);
    });
  });

  describe("Utility Functions", function () {
    const patientUserId = 5;
    const drugId = 123;
    const dosage = "500mg twice daily";
    const ipfsHash = "QmExampleIPFSHash123";
    const qrCode = "QRCODE123456789";

    beforeEach(async function () {
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400; // 1 day from now
      
      await prescription.connect(doctor).createPrescription(
        patientUserId,
        drugId,
        dosage,
        ipfsHash,
        qrCode,
        expiresAt
      );
    });

    describe("getPrescriptionStatus", function () {
      it("Should return correct status for issued prescription", async function () {
        const [status, isRevoked, isExpired] = await prescription.getPrescriptionStatus(1);
        
        expect(status).to.equal("issued");
        expect(isRevoked).to.be.false;
        expect(isExpired).to.be.false;
      });

      it("Should return correct status for verified prescription", async function () {
        await prescription.connect(pharmacist).verifyPrescription(1);
        const [status, isRevoked, isExpired] = await prescription.getPrescriptionStatus(1);
        
        expect(status).to.equal("verified");
        expect(isRevoked).to.be.false;
        expect(isExpired).to.be.false;
      });

      it("Should return correct status for revoked prescription", async function () {
        await prescription.connect(doctor).revokePrescription(1, "Reason");
        const [status, isRevoked, isExpired] = await prescription.getPrescriptionStatus(1);
        
        expect(status).to.equal("revoked");
        expect(isRevoked).to.be.true;
        expect(isExpired).to.be.false;
      });

      it("Should return expired status for expired prescription", async function () {
        const currentTimestamp = await getCurrentTimestamp();
        const shortExpiry = currentTimestamp + 2; // 2 seconds from now
        
        // Create prescription with short expiry
        await prescription.connect(doctor).createPrescription(
          patientUserId,
          124,
          "250mg daily",
          "QmHash2",
          "QRCODE2",
          shortExpiry
        );

        // Advance time beyond expiry
        await ethers.provider.send("evm_increaseTime", [3]);
        await ethers.provider.send("evm_mine", []);

        const [status, isRevoked, isExpired] = await prescription.getPrescriptionStatus(2);
        expect(isExpired).to.be.true;
      });
    });

    describe("isPrescriptionValid", function () {
      it("Should return true for valid issued prescription", async function () {
        expect(await prescription.isPrescriptionValid(1)).to.be.true;
      });

      it("Should return true for valid verified prescription", async function () {
        await prescription.connect(pharmacist).verifyPrescription(1);
        expect(await prescription.isPrescriptionValid(1)).to.be.true;
      });

      it("Should return false for revoked prescription", async function () {
        await prescription.connect(doctor).revokePrescription(1, "Reason");
        expect(await prescription.isPrescriptionValid(1)).to.be.false;
      });

      it("Should return false for dispensed prescription", async function () {
        await prescription.connect(pharmacist).verifyPrescription(1);
        await prescription.connect(pharmacist).dispensePrescription(1);
        expect(await prescription.isPrescriptionValid(1)).to.be.false;
      });

      it("Should return false for expired prescription", async function () {
        const currentTimestamp = await getCurrentTimestamp();
        const shortExpiry = currentTimestamp + 2; // 2 seconds from now
        
        // Create prescription with short expiry
        await prescription.connect(doctor).createPrescription(
          patientUserId,
          124,
          "250mg daily",
          "QmHash2",
          "QRCODE2",
          shortExpiry
        );

        // Advance time beyond expiry
        await ethers.provider.send("evm_increaseTime", [3]);
        await ethers.provider.send("evm_mine", []);

        expect(await prescription.isPrescriptionValid(2)).to.be.false;
      });
    });

    describe("getPrescriptionsByPatient", function () {
      it("Should return prescriptions for specific patient", async function () {
        const currentTimestamp = await getCurrentTimestamp();
        const expiresAt = currentTimestamp + 86400;

        // Create another prescription for same patient
        await prescription.connect(doctor).createPrescription(
          patientUserId,
          124,
          "250mg daily",
          "QmHash2",
          "QRCODE2",
          expiresAt
        );

        // Get additional signers for new users
        const signers = await ethers.getSigners();
        const newPatient = signers[6]; // Use an unused signer
        
        await userManagement.registerUser(newPatient.address, "patient2@test.com", "hash5", 5); // patient role ID is 5

        // Create prescription for different patient
        await prescription.connect(doctor).createPrescription(
          6, // New patient user ID
          125,
          "100mg daily",
          "QmHash3",
          "QRCODE3",
          expiresAt
        );

        const patientPrescriptions = await prescription.getPrescriptionsByPatient(patientUserId);
        expect(patientPrescriptions.length).to.equal(2);
        expect(patientPrescriptions[0]).to.equal(1);
        expect(patientPrescriptions[1]).to.equal(2);
      });

      it("Should return empty array for patient with no prescriptions", async function () {
        const prescriptions = await prescription.getPrescriptionsByPatient(999);
        expect(prescriptions.length).to.equal(0);
      });

      it("Should revert for invalid patient ID", async function () {
        await expect(
          prescription.getPrescriptionsByPatient(0)
        ).to.be.revertedWith("Invalid patient ID");
      });
    });

    describe("getPrescriptionsByDoctor", function () {
      it("Should return prescriptions for specific doctor", async function () {
        const currentTimestamp = await getCurrentTimestamp();
        const expiresAt = currentTimestamp + 86400;

        // Create another prescription by same doctor
        await prescription.connect(doctor).createPrescription(
          patientUserId,
          124,
          "250mg daily",
          "QmHash2",
          "QRCODE2",
          expiresAt
        );

        // Get additional signers for new users
        const signers = await ethers.getSigners();
        const doctor2 = signers[7]; // Use an unused signer
        
        await userManagement.registerUser(doctor2.address, "doctor2@test.com", "hash6", 2); // doctor role ID is 2

        // Create prescription by different doctor
        await prescription.connect(doctor2).createPrescription(
          patientUserId,
          125,
          "100mg daily",
          "QmHash3",
          "QRCODE3",
          expiresAt
        );

        const doctorPrescriptions = await prescription.getPrescriptionsByDoctor(2); // Original doctor ID
        expect(doctorPrescriptions.length).to.equal(2); // Only the first two prescriptions
      });

      it("Should return empty array for doctor with no prescriptions", async function () {
        const prescriptions = await prescription.getPrescriptionsByDoctor(999);
        expect(prescriptions.length).to.equal(0);
      });

      it("Should revert for invalid doctor ID", async function () {
        await expect(
          prescription.getPrescriptionsByDoctor(0)
        ).to.be.revertedWith("Invalid doctor ID");
      });
    });
  });

  describe("Prescription Workflow", function () {
    it("Should complete full prescription workflow", async function () {
      const patientUserId = 5;
      const drugId = 123;
      const dosage = "500mg twice daily";
      const ipfsHash = "QmExampleIPFSHash123";
      const qrCode = "QRCODE123456789";
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      // Doctor creates prescription
      await prescription.connect(doctor).createPrescription(
        patientUserId,
        drugId,
        dosage,
        ipfsHash,
        qrCode,
        expiresAt
      );

      let presc = await prescription.getPrescription(1);
      expect(presc.status).to.equal("issued");
      expect(await prescription.isPrescriptionValid(1)).to.be.true;

      // Pharmacist verifies prescription
      await prescription.connect(pharmacist).verifyPrescription(1);
      presc = await prescription.getPrescription(1);
      expect(presc.status).to.equal("verified");
      expect(await prescription.isPrescriptionValid(1)).to.be.true;

      // Pharmacist dispenses prescription
      await prescription.connect(pharmacist).dispensePrescription(1);
      presc = await prescription.getPrescription(1);
      expect(presc.status).to.equal("dispensed");
      expect(await prescription.isPrescriptionValid(1)).to.be.false;
    });

    it("Should handle prescription revocation workflow", async function () {
      const patientUserId = 5;
      const drugId = 123;
      const dosage = "500mg twice daily";
      const ipfsHash = "QmExampleIPFSHash123";
      const qrCode = "QRCODE123456789";
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      // Doctor creates prescription
      await prescription.connect(doctor).createPrescription(
        patientUserId,
        drugId,
        dosage,
        ipfsHash,
        qrCode,
        expiresAt
      );

      expect(await prescription.isPrescriptionValid(1)).to.be.true;

      // Doctor revokes prescription
      await prescription.connect(doctor).revokePrescription(1, "Patient allergic reaction");

      const presc = await prescription.getPrescription(1);
      expect(presc.status).to.equal("revoked");
      expect(presc.isRevoked).to.be.true;
      expect(await prescription.isPrescriptionValid(1)).to.be.false;

      // Verify cannot perform operations on revoked prescription
      await expect(
        prescription.connect(pharmacist).verifyPrescription(1)
      ).to.be.revertedWith("Prescription has been revoked");
    });

    it("Should handle multiple prescriptions for same patient", async function () {
      const patientUserId = 5;
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      // Create multiple prescriptions
      await prescription.connect(doctor).createPrescription(
        patientUserId,
        123,
        "500mg twice daily",
        "QmHash1",
        "QRCODE1",
        expiresAt
      );

      await prescription.connect(doctor).createPrescription(
        patientUserId,
        124,
        "250mg daily",
        "QmHash2",
        "QRCODE2",
        expiresAt
      );

      await prescription.connect(doctor).createPrescription(
        patientUserId,
        125,
        "100mg as needed",
        "QmHash3",
        "QRCODE3",
        expiresAt
      );

      expect(await prescription.prescriptionCounter()).to.equal(3);

      const presc1 = await prescription.getPrescription(1);
      const presc2 = await prescription.getPrescription(2);
      const presc3 = await prescription.getPrescription(3);

      expect(presc1.patientUserId).to.equal(patientUserId);
      expect(presc2.patientUserId).to.equal(patientUserId);
      expect(presc3.patientUserId).to.equal(patientUserId);
      expect(presc1.drugId).to.equal(123);
      expect(presc2.drugId).to.equal(124);
      expect(presc3.drugId).to.equal(125);

      // Test patient prescription history
      const patientPrescriptions = await prescription.getPrescriptionsByPatient(patientUserId);
      expect(patientPrescriptions.length).to.equal(3);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle large drug IDs", async function () {
      const largeDrugId = ethers.MaxUint256;
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      await prescription.connect(doctor).createPrescription(
        5, // patientUserId
        largeDrugId,
        "500mg twice daily",
        "QmHash",
        "QRCODE",
        expiresAt
      );

      const presc = await prescription.getPrescription(1);
      expect(presc.drugId).to.equal(largeDrugId);
    });

    it("Should handle long dosage strings", async function () {
      const longDosage = "A".repeat(1000); // Long dosage string
      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      await prescription.connect(doctor).createPrescription(
        5, // patientUserId
        123,
        longDosage,
        "QmHash",
        "QRCODE",
        expiresAt
      );

      const presc = await prescription.getPrescription(1);
      expect(presc.dosage).to.equal(longDosage);
    });

    it("Should handle different QR code formats", async function () {
      const qrCodes = [
        "QR123456789",
        "https://example.com/qr/123",
        "data:image/png;base64,ABC123",
        "PRESCRIPTION-2024-001"
      ];

      const currentTimestamp = await getCurrentTimestamp();
      const expiresAt = currentTimestamp + 86400;

      for (let i = 0; i < qrCodes.length; i++) {
        await prescription.connect(doctor).createPrescription(
          5, // patientUserId
          120 + i,
          "500mg twice daily",
          `QmHash${i}`,
          qrCodes[i],
          expiresAt
        );

        const presc = await prescription.getPrescription(i + 1);
        expect(presc.qrCode).to.equal(qrCodes[i]);
      }
    });
  });
});