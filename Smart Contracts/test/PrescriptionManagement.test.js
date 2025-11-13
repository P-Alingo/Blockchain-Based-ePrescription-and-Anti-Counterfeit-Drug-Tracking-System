const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrescriptionManagement Contract", function () {
  let UserManagement, userManagement;
  let PrescriptionManagement, prescriptionManagement;
  let deployer, doctor, pharmacist, patient, regulator, admin, addr1, addr2;

  // Test data
  const prescriptionCode1 = "PRESC-106061";
  const prescriptionCode2 = "PRESC-153570"; 
  const prescriptionCode3 = "PRESC-136594";

  beforeEach(async function () {
    [deployer, doctor, pharmacist, patient, regulator, admin, addr1, addr2] = await ethers.getSigners();

    // Deploy UserManagement first
    UserManagement = await ethers.getContractFactory("UserManagement");
    userManagement = await UserManagement.deploy();
    await userManagement.waitForDeployment();

    // Deploy PrescriptionManagement with UserManagement address
    PrescriptionManagement = await ethers.getContractFactory("PrescriptionManagement");
    prescriptionManagement = await PrescriptionManagement.deploy(userManagement.target);
    await prescriptionManagement.waitForDeployment();

    // Setup roles in UserManagement
    const doctorId = await userManagement.getRoleIdByName("doctor");
    const pharmacistId = await userManagement.getRoleIdByName("pharmacist");
    const patientId = await userManagement.getRoleIdByName("patient");
    const regulatorId = await userManagement.getRoleIdByName("regulator");
    const adminId = await userManagement.getRoleIdByName("admin");

    // Register and approve users
    await userManagement.registerUser(doctor.address, doctorId, "Dr. Smith");
    await userManagement.registerUser(pharmacist.address, pharmacistId, "Pharm. Johnson");
    await userManagement.registerUser(patient.address, patientId, "Patient Alice");
    await userManagement.registerUser(regulator.address, regulatorId, "Regulator Bob");
    await userManagement.registerUser(admin.address, adminId, "Admin Charlie");

    await userManagement.approveUser(doctor.address);
    await userManagement.approveUser(pharmacist.address);
    await userManagement.approveUser(patient.address);
    await userManagement.approveUser(regulator.address);
    await userManagement.approveUser(admin.address);
  });

  // Helper function to get current block timestamp
  async function getCurrentTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }

  // ---------------- Deployment ----------------
  it("Should deploy with correct UserManagement address", async function () {
    expect(await prescriptionManagement.userManagement()).to.equal(userManagement.target);
  });

  // ---------------- Prescription Creation ----------------
  it("Doctor can create prescription", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60; // 7 days from now

    await expect(
      prescriptionManagement.connect(doctor).createPrescription(
        32, // databaseId
        patient.address,
        prescriptionCode1,
        2, // drugId
        "Amoxicillin",
        "500mg",
        "tablet",
        2, // quantity
        "Take after eating",
        "500.00",
        "mg",
        "Twice daily",
        8, // duration
        validUntil
      )
    )
      .to.emit(prescriptionManagement, "PrescriptionCreated")
      .withArgs(
        1n, // prescriptionId
        32n, // databaseId
        doctor.address,
        patient.address,
        prescriptionCode1,
        "Amoxicillin",
        2n, // quantity
        BigInt(validUntil)
      );

    // Verify prescription was created
    const prescription = await prescriptionManagement.getPrescription(1);
    expect(prescription.databaseId).to.equal(32);
    expect(prescription.doctor).to.equal(doctor.address);
    expect(prescription.patient).to.equal(patient.address);
    expect(prescription.prescriptionCode).to.equal(prescriptionCode1);
    expect(prescription.status).to.equal(0); // Status.Issued
  });

  it("Cannot create prescription with duplicate code", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await expect(
      prescriptionManagement.connect(doctor).createPrescription(
        33,
        patient.address,
        prescriptionCode1, // Same code
        1,
        "Paracetamol",
        "400mg",
        "tablet",
        2,
        "Take after eating",
        "400.00",
        "mg",
        "Once daily",
        5,
        validUntil
      )
    ).to.be.revertedWith("Duplicate prescription code");
  });

  it("Non-doctor cannot create prescription", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await expect(
      prescriptionManagement.connect(pharmacist).createPrescription(
        32,
        patient.address,
        prescriptionCode1,
        2,
        "Amoxicillin",
        "500mg",
        "tablet",
        2,
        "Take after eating",
        "500.00",
        "mg",
        "Twice daily",
        8,
        validUntil
      )
    ).to.be.revertedWith("Only doctors can perform this action");
  });

  it("Cannot create prescription for invalid patient", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await expect(
      prescriptionManagement.connect(doctor).createPrescription(
        32,
        addr1.address, // Not a registered patient
        prescriptionCode1,
        2,
        "Amoxicillin",
        "500mg",
        "tablet",
        2,
        "Take after eating",
        "500.00",
        "mg",
        "Twice daily",
        8,
        validUntil
      )
    ).to.be.revertedWith("Invalid patient address");
  });

  it("Cannot create prescription with expired validity", async function () {
    const currentTime = await getCurrentTimestamp();
    const expiredTime = currentTime - 24 * 60 * 60; // Yesterday

    await expect(
      prescriptionManagement.connect(doctor).createPrescription(
        32,
        patient.address,
        prescriptionCode1,
        2,
        "Amoxicillin",
        "500mg",
        "tablet",
        2,
        "Take after eating",
        "500.00",
        "mg",
        "Twice daily",
        8,
        expiredTime
      )
    ).to.be.revertedWith("Valid until must be in the future");
  });

  // ---------------- Prescription Dispensing ----------------
  it("Pharmacist can dispense prescription", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    // Create prescription
    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    // Get current timestamp for the event
    const tx = await prescriptionManagement.connect(pharmacist).dispensePrescription(1);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const dispensedAt = block.timestamp;

    await expect(tx)
      .to.emit(prescriptionManagement, "PrescriptionDispensed")
      .withArgs(
        1n,
        pharmacist.address,
        patient.address,
        BigInt(dispensedAt),
        prescriptionCode1
      );

    // Verify status updated
    const prescription = await prescriptionManagement.getPrescription(1);
    expect(prescription.status).to.equal(1); // Status.Dispensed
    expect(prescription.dispensedBy).to.equal(pharmacist.address);
    expect(prescription.dispensedDate).to.equal(dispensedAt);
  });

  it("Cannot dispense already dispensed prescription", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await prescriptionManagement.connect(pharmacist).dispensePrescription(1);

    await expect(
      prescriptionManagement.connect(pharmacist).dispensePrescription(1)
    ).to.be.revertedWith("Prescription already dispensed");
  });

  it("Cannot dispense expired prescription", async function () {
    const currentTime = await getCurrentTimestamp();
    
    // Create prescription that expires in 5 seconds (safe margin)
    const validUntil = currentTime + 5;
    
    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    // Wait for 10 seconds to ensure expiration
    await ethers.provider.send("evm_increaseTime", [10]);
    await ethers.provider.send("evm_mine");

    await expect(
      prescriptionManagement.connect(pharmacist).dispensePrescription(1)
    ).to.be.revertedWith("Prescription expired");
  });

  it("Non-pharmacist cannot dispense prescription", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await expect(
      prescriptionManagement.connect(patient).dispensePrescription(1)
    ).to.be.revertedWith("Only pharmacists can perform this action");
  });

  // ---------------- Prescription Marking Invalid ----------------
  it("Pharmacist can mark prescription as invalid", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await expect(
      prescriptionManagement.connect(pharmacist).markPrescriptionInvalid(1, "Suspected counterfeit")
    )
      .to.emit(prescriptionManagement, "PrescriptionInvalid")
      .withArgs(1n, pharmacist.address, "Suspected counterfeit", prescriptionCode1);

    const prescription = await prescriptionManagement.getPrescription(1);
    expect(prescription.status).to.equal(3); // Status.Invalid
  });

  it("Cannot mark dispensed prescription as invalid", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await prescriptionManagement.connect(pharmacist).dispensePrescription(1);

    await expect(
      prescriptionManagement.connect(pharmacist).markPrescriptionInvalid(1, "Suspected counterfeit")
    ).to.be.revertedWith("Prescription already dispensed");
  });

  // ---------------- Prescription Deletion ----------------
  it("Doctor can delete their prescription", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await expect(
      prescriptionManagement.connect(doctor).deletePrescription(1)
    )
      .to.emit(prescriptionManagement, "PrescriptionDeleted")
      .withArgs(1n, doctor.address, prescriptionCode1);

    // Verify prescription is marked as deleted
    await expect(
      prescriptionManagement.getPrescription(1)
    ).to.be.revertedWith("Prescription is deleted");
  });

  it("Admin can delete any prescription", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await expect(
      prescriptionManagement.connect(admin).deletePrescription(1)
    )
      .to.emit(prescriptionManagement, "PrescriptionDeleted")
      .withArgs(1n, admin.address, prescriptionCode1);
  });

  it("Cannot delete dispensed prescription", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await prescriptionManagement.connect(pharmacist).dispensePrescription(1);

    await expect(
      prescriptionManagement.connect(doctor).deletePrescription(1)
    ).to.be.revertedWith("Prescription already dispensed");
  });

  it("Unauthorized user cannot delete prescription", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await expect(
      prescriptionManagement.connect(pharmacist).deletePrescription(1)
    ).to.be.revertedWith("Only prescribing doctor or admin can delete");
  });

  // ---------------- View Functions ----------------
  it("Doctor can view their prescriptions", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    // Create multiple prescriptions
    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await prescriptionManagement.connect(doctor).createPrescription(
      33,
      patient.address,
      prescriptionCode2,
      3,
      "Paracetamol",
      "200mg",
      "tablet",
      1,
      "Take as needed",
      "200.00",
      "mg",
      "Once daily",
      3,
      validUntil
    );

    const prescriptions = await prescriptionManagement.connect(doctor).getPrescriptionsByDoctor(doctor.address);
    expect(prescriptions.length).to.equal(2);
    expect(prescriptions[0].prescriptionCode).to.equal(prescriptionCode1);
    expect(prescriptions[1].prescriptionCode).to.equal(prescriptionCode2);
  });

  it("Pharmacist can view their dispensed prescriptions", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await prescriptionManagement.connect(pharmacist).dispensePrescription(1);

    const prescriptions = await prescriptionManagement.connect(pharmacist).getPrescriptionsByPharmacist(pharmacist.address);
    expect(prescriptions.length).to.equal(1);
    expect(prescriptions[0].prescriptionCode).to.equal(prescriptionCode1);
    expect(prescriptions[0].dispensedBy).to.equal(pharmacist.address);
  });

  it("Patient can view their prescriptions", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    const prescriptions = await prescriptionManagement.connect(patient).getPrescriptionsByPatient(patient.address);
    expect(prescriptions.length).to.equal(1);
    expect(prescriptions[0].prescriptionCode).to.equal(prescriptionCode1);
    expect(prescriptions[0].patient).to.equal(patient.address);
  });

  it("Admin can view all prescriptions", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await prescriptionManagement.connect(doctor).createPrescription(
      33,
      patient.address,
      prescriptionCode2,
      3,
      "Paracetamol",
      "200mg",
      "tablet",
      1,
      "Take as needed",
      "200.00",
      "mg",
      "Once daily",
      3,
      validUntil
    );

    const prescriptions = await prescriptionManagement.connect(admin).getAllPrescriptions();
    expect(prescriptions.length).to.equal(2);
  });

  it("Regulator can view all prescriptions", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    const prescriptions = await prescriptionManagement.connect(regulator).getAllPrescriptions();
    expect(prescriptions.length).to.equal(1);
  });

  it("Unauthorized user cannot view prescriptions", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await expect(
      prescriptionManagement.connect(addr1).getPrescriptionsByDoctor(doctor.address)
    ).to.be.revertedWith("Not authorized");

    await expect(
      prescriptionManagement.connect(addr1).getAllPrescriptions()
    ).to.be.revertedWith("Only admin or regulator can view all prescriptions");
  });

  // ---------------- Utility Functions ----------------
  it("Can get prescription by code", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    const prescription = await prescriptionManagement.connect(doctor).getPrescriptionByCode(prescriptionCode1);
    expect(prescription.prescriptionCode).to.equal(prescriptionCode1);
    expect(prescription.databaseId).to.equal(32);
  });

  it("Can check if prescription is valid for dispensing", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    expect(await prescriptionManagement.isValidForDispensing(1)).to.be.true;

    // Dispense and check again
    await prescriptionManagement.connect(pharmacist).dispensePrescription(1);
    expect(await prescriptionManagement.isValidForDispensing(1)).to.be.false;
  });

  it("Can get prescription status as string", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    expect(await prescriptionManagement.getPrescriptionStatus(1)).to.equal("issued");

    await prescriptionManagement.connect(pharmacist).dispensePrescription(1);
    expect(await prescriptionManagement.getPrescriptionStatus(1)).to.equal("dispensed");
  });

  it("Can update blockchain transaction hash", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    const txHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    
    // Get current timestamp for the event
    const tx = await prescriptionManagement.connect(doctor).updateBlockchainTx(1, txHash);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const updatedAt = block.timestamp;

    await expect(tx)
      .to.emit(prescriptionManagement, "PrescriptionUpdated")
      .withArgs(1n, prescriptionCode1, BigInt(updatedAt));

    const prescription = await prescriptionManagement.getPrescription(1);
    expect(prescription.blockchainTx).to.equal(txHash);
  });

  it("Can get flagged prescriptions", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    await prescriptionManagement.connect(pharmacist).markPrescriptionInvalid(1, "Counterfeit detected");

    const flagged = await prescriptionManagement.connect(admin).getFlaggedPrescriptions();
    expect(flagged.length).to.equal(1);
    expect(flagged[0].prescriptionCode).to.equal(prescriptionCode1);
    expect(flagged[0].status).to.equal(3); // Status.Invalid
  });

  it("Can expire old prescriptions", async function () {
    const currentTime = await getCurrentTimestamp();
    
    // Create prescription that expires in 5 seconds (safe margin)
    const validUntil = currentTime + 5;
    
    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    // Wait for 10 seconds to ensure expiration
    await ethers.provider.send("evm_increaseTime", [10]);
    await ethers.provider.send("evm_mine");

    await prescriptionManagement.expireOldPrescriptions();

    const prescription = await prescriptionManagement.getPrescription(1);
    expect(prescription.status).to.equal(2); // Status.Expired
  });

  // ---------------- Edge Cases ----------------
  it("Suspended doctor cannot create prescription", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    // Suspend the doctor
    await userManagement.suspendUser(doctor.address);

    await expect(
      prescriptionManagement.connect(doctor).createPrescription(
        32,
        patient.address,
        prescriptionCode1,
        2,
        "Amoxicillin",
        "500mg",
        "tablet",
        2,
        "Take after eating",
        "500.00",
        "mg",
        "Twice daily",
        8,
        validUntil
      )
    ).to.be.revertedWith("Doctor must be active");
  });

  it("Suspended pharmacist cannot dispense prescription", async function () {
    const currentTime = await getCurrentTimestamp();
    const validUntil = currentTime + 7 * 24 * 60 * 60;

    await prescriptionManagement.connect(doctor).createPrescription(
      32,
      patient.address,
      prescriptionCode1,
      2,
      "Amoxicillin",
      "500mg",
      "tablet",
      2,
      "Take after eating",
      "500.00",
      "mg",
      "Twice daily",
      8,
      validUntil
    );

    // Suspend the pharmacist
    await userManagement.suspendUser(pharmacist.address);

    await expect(
      prescriptionManagement.connect(pharmacist).dispensePrescription(1)
    ).to.be.revertedWith("Pharmacist must be active");
  });

  it("Cannot access non-existent prescription", async function () {
    await expect(
      prescriptionManagement.getPrescription(999)
    ).to.be.revertedWith("Prescription not found");

    await expect(
      prescriptionManagement.getPrescriptionByCode("NONEXISTENT")
    ).to.be.revertedWith("Prescription not found");
  });
});