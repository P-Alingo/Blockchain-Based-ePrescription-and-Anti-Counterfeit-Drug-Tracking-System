const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DrugSupplyChain Contract", function () {
  let UserManagement, userManagement;
  let DrugSupplyChain, drugSupplyChain;
  let deployer, manufacturer, distributor, pharmacist, regulator, admin, addr1, addr2;

  // Test data
  const batchNumber1 = "BATCH-001";
  const batchNumber2 = "BATCH-002";
  const shipmentNumber1 = "SHIP-001";
  const shipmentNumber2 = "SHIP-002";

  beforeEach(async function () {
    [deployer, manufacturer, distributor, pharmacist, regulator, admin, addr1, addr2] = await ethers.getSigners();

    // Deploy UserManagement first
    UserManagement = await ethers.getContractFactory("UserManagement");
    userManagement = await UserManagement.deploy();
    await userManagement.waitForDeployment();

    // Deploy DrugSupplyChain with UserManagement address
    DrugSupplyChain = await ethers.getContractFactory("DrugSupplyChain");
    drugSupplyChain = await DrugSupplyChain.deploy(userManagement.target);
    await drugSupplyChain.waitForDeployment();

    // Setup roles in UserManagement
    const manufacturerId = await userManagement.getRoleIdByName("manufacturer");
    const distributorId = await userManagement.getRoleIdByName("distributor");
    const pharmacistId = await userManagement.getRoleIdByName("pharmacist");
    const regulatorId = await userManagement.getRoleIdByName("regulator");
    const adminId = await userManagement.getRoleIdByName("admin");

    // Register and approve users
    await userManagement.registerUser(manufacturer.address, manufacturerId, "Manufacturer Co");
    await userManagement.registerUser(distributor.address, distributorId, "Distributor Inc");
    await userManagement.registerUser(pharmacist.address, pharmacistId, "Pharmacy Ltd");
    await userManagement.registerUser(regulator.address, regulatorId, "Regulator Agency");
    await userManagement.registerUser(admin.address, adminId, "Admin User");

    await userManagement.approveUser(manufacturer.address);
    await userManagement.approveUser(distributor.address);
    await userManagement.approveUser(pharmacist.address);
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
    expect(await drugSupplyChain.userManagement()).to.equal(userManagement.target);
  });

  // ---------------- Batch Creation ----------------
  it("Manufacturer can create batch", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60; // 7 days ago
    const expiryDate = currentTime + 365 * 24 * 60 * 60; // 1 year from now

    await expect(
      drugSupplyChain.connect(manufacturer).createBatch(
        1, // databaseId
        batchNumber1,
        101, // drugId
        "Amoxicillin 500mg",
        201, // manufacturerId
        1000, // quantity
        manufactureDate,
        expiryDate,
        "15-25°C",
        "Manufacturing Facility A",
        301, // qualityControlOfficerId
        currentTime,
        shipmentNumber1,
        401, // distributorCompanyId
        501, // distributorFacilityId
        "/qr/codes/batch-001"
      )
    )
      .to.emit(drugSupplyChain, "BatchCreated")
      .withArgs(
        1n, // batchId
        1n, // databaseId
        manufacturer.address,
        batchNumber1,
        "Amoxicillin 500mg",
        1000n, // quantity
        BigInt(expiryDate)
      );

    // Verify batch was created
    const batch = await drugSupplyChain.getBatch(1);
    expect(batch.details.databaseId).to.equal(1);
    expect(batch.details.batchNumber).to.equal(batchNumber1);
    expect(batch.details.drugName).to.equal("Amoxicillin 500mg");
    expect(batch.currentOwner).to.equal(manufacturer.address);
    expect(batch.manufacturer).to.equal(manufacturer.address);
    expect(batch.isCounterfeit).to.be.false;
  });

  it("Cannot create batch with duplicate batch number", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await expect(
      drugSupplyChain.connect(manufacturer).createBatch(
        2,
        batchNumber1, // Same batch number
        102,
        "Paracetamol 500mg",
        202,
        500,
        manufactureDate,
        expiryDate,
        "15-25°C",
        "Manufacturing Facility B",
        302,
        currentTime,
        shipmentNumber2,
        402,
        502,
        "/qr/codes/batch-002"
      )
    ).to.be.revertedWith("Duplicate batch number");
  });

  it("Non-manufacturer cannot create batch", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await expect(
      drugSupplyChain.connect(distributor).createBatch(
        1,
        batchNumber1,
        101,
        "Amoxicillin 500mg",
        201,
        1000,
        manufactureDate,
        expiryDate,
        "15-25°C",
        "Manufacturing Facility A",
        301,
        currentTime,
        shipmentNumber1,
        401,
        501,
        "/qr/codes/batch-001"
      )
    ).to.be.revertedWith("Only manufacturers can perform this action");
  });

  it("Cannot create batch with future manufacture date", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime + 24 * 60 * 60; // Tomorrow
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await expect(
      drugSupplyChain.connect(manufacturer).createBatch(
        1,
        batchNumber1,
        101,
        "Amoxicillin 500mg",
        201,
        1000,
        manufactureDate,
        expiryDate,
        "15-25°C",
        "Manufacturing Facility A",
        301,
        currentTime,
        shipmentNumber1,
        401,
        501,
        "/qr/codes/batch-001"
      )
    ).to.be.revertedWith("Manufacture date cannot be in the future");
  });

  it("Cannot create batch with expired expiry date", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime - 24 * 60 * 60; // Yesterday

    await expect(
      drugSupplyChain.connect(manufacturer).createBatch(
        1,
        batchNumber1,
        101,
        "Amoxicillin 500mg",
        201,
        1000,
        manufactureDate,
        expiryDate,
        "15-25°C",
        "Manufacturing Facility A",
        301,
        currentTime,
        shipmentNumber1,
        401,
        501,
        "/qr/codes/batch-001"
      )
    ).to.be.revertedWith("Expiry date must be in the future");
  });

  // ---------------- Batch Transfer ----------------
  it("Manufacturer can transfer batch to distributor", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    // Create batch
    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    // Transfer batch to distributor - don't check exact timestamp
    await expect(
      drugSupplyChain.connect(manufacturer).transferBatch(
        1,
        distributor.address,
        shipmentNumber1,
        "in_transit"
      )
    )
      .to.emit(drugSupplyChain, "BatchTransferred");

    // Verify transfer
    const batch = await drugSupplyChain.getBatch(1);
    expect(batch.currentOwner).to.equal(distributor.address);

    const transfers = await drugSupplyChain.getBatchTransfers(1);
    expect(transfers.length).to.equal(1);
    expect(transfers[0].from).to.equal(manufacturer.address);
    expect(transfers[0].to).to.equal(distributor.address);
  });

  it("Distributor can transfer batch to pharmacist", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    // Create and transfer batch to distributor
    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await drugSupplyChain.connect(manufacturer).transferBatch(
      1,
      distributor.address,
      shipmentNumber1,
      "in_transit"
    );

    // Transfer batch to pharmacist - don't check exact timestamp
    await expect(
      drugSupplyChain.connect(distributor).transferBatch(
        1,
        pharmacist.address,
        shipmentNumber2,
        "in_transit"
      )
    )
      .to.emit(drugSupplyChain, "BatchTransferred");

    // Verify transfer
    const batch = await drugSupplyChain.getBatch(1);
    expect(batch.currentOwner).to.equal(pharmacist.address);

    const transfers = await drugSupplyChain.getBatchTransfers(1);
    expect(transfers.length).to.equal(2);
    expect(transfers[1].from).to.equal(distributor.address);
    expect(transfers[1].to).to.equal(pharmacist.address);
  });

  it("Cannot transfer batch not owned", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await expect(
      drugSupplyChain.connect(distributor).transferBatch(
        1,
        pharmacist.address,
        shipmentNumber1,
        "in_transit"
      )
    ).to.be.revertedWith("Not the batch owner");
  });

  it("Manufacturer cannot transfer directly to pharmacist", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await expect(
      drugSupplyChain.connect(manufacturer).transferBatch(
        1,
        pharmacist.address, // Direct to pharmacist
        shipmentNumber1,
        "in_transit"
      )
    ).to.be.revertedWith("Manufacturer can only transfer to Distributor");
  });

  it("Pharmacist cannot transfer batch", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    // Create and transfer batch to distributor then pharmacist
    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await drugSupplyChain.connect(manufacturer).transferBatch(
      1,
      distributor.address,
      shipmentNumber1,
      "in_transit"
    );

    await drugSupplyChain.connect(distributor).transferBatch(
      1,
      pharmacist.address,
      shipmentNumber2,
      "delivered"
    );

    // Pharmacist tries to transfer
    await expect(
      drugSupplyChain.connect(pharmacist).transferBatch(
        1,
        distributor.address, // Try to transfer back
        shipmentNumber2,
        "in_transit"
      )
    ).to.be.revertedWith("Pharmacist cannot transfer batches");
  });

  it("Cannot transfer counterfeit batch", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    // Mark as counterfeit
    await drugSupplyChain.connect(manufacturer).markBatchAsCounterfeit(1, "Suspected counterfeit");

    // Try to transfer
    await expect(
      drugSupplyChain.connect(manufacturer).transferBatch(
        1,
        distributor.address,
        shipmentNumber1,
        "in_transit"
      )
    ).to.be.revertedWith("Batch is flagged as counterfeit");
  });

  // ---------------- Counterfeit Flagging ----------------
  it("Batch owner can mark batch as counterfeit", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    // Don't check exact timestamp in event
    await expect(
      drugSupplyChain.connect(manufacturer).markBatchAsCounterfeit(1, "Quality test failed")
    )
      .to.emit(drugSupplyChain, "BatchCounterfeit");

    const batch = await drugSupplyChain.getBatch(1);
    expect(batch.isCounterfeit).to.be.true;
  });

  it("Regulator can mark batch as counterfeit", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await drugSupplyChain.connect(manufacturer).transferBatch(
      1,
      distributor.address,
      shipmentNumber1,
      "in_transit"
    );

    // Regulator flags batch - don't check exact timestamp
    await expect(
      drugSupplyChain.connect(regulator).markBatchAsCounterfeit(1, "Regulatory inspection failed")
    )
      .to.emit(drugSupplyChain, "BatchCounterfeit");

    const batch = await drugSupplyChain.getBatch(1);
    expect(batch.isCounterfeit).to.be.true;
  });

  it("Non-owner cannot mark batch as counterfeit", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await expect(
      drugSupplyChain.connect(addr1).markBatchAsCounterfeit(1, "Random flag")
    ).to.be.revertedWith("Only batch owner or regulator can flag as counterfeit");
  });

  // ---------------- Shipment Status Updates ----------------
  it("Batch owner can update shipment status", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await drugSupplyChain.connect(manufacturer).transferBatch(
      1,
      distributor.address,
      shipmentNumber1,
      "in_transit"
    );

    // Update shipment status - don't check exact timestamp
    await expect(
      drugSupplyChain.connect(distributor).updateShipmentStatus(
        1,
        shipmentNumber1,
        "delivered"
      )
    )
      .to.emit(drugSupplyChain, "ShipmentStatusUpdated");

    // Verify status update
    const transfers = await drugSupplyChain.getBatchTransfers(1);
    expect(transfers[0].status).to.equal("delivered");
  });

  it("Cannot update shipment status for non-existent shipment", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await expect(
      drugSupplyChain.connect(manufacturer).updateShipmentStatus(
        1,
        "NONEXISTENT-SHIPMENT",
        "delivered"
      )
    ).to.be.revertedWith("Shipment not found for this batch");
  });

  // ---------------- View Functions ----------------
  it("Manufacturer can view their batches", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    // Create multiple batches
    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await drugSupplyChain.connect(manufacturer).createBatch(
      2,
      batchNumber2,
      102,
      "Paracetamol 500mg",
      202,
      500,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility B",
      302,
      currentTime,
      shipmentNumber2,
      402,
      502,
      "/qr/codes/batch-002"
    );

    const batches = await drugSupplyChain.connect(manufacturer).getBatchesByManufacturer(manufacturer.address);
    expect(batches.length).to.equal(2);
    expect(batches[0].details.batchNumber).to.equal(batchNumber1);
    expect(batches[1].details.batchNumber).to.equal(batchNumber2);
  });

  it("Distributor can view their batches", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await drugSupplyChain.connect(manufacturer).transferBatch(
      1,
      distributor.address,
      shipmentNumber1,
      "in_transit"
    );

    const batches = await drugSupplyChain.connect(distributor).getBatchesByDistributor(distributor.address);
    expect(batches.length).to.equal(1);
    expect(batches[0].details.batchNumber).to.equal(batchNumber1);
    expect(batches[0].currentOwner).to.equal(distributor.address);
  });

  it("Pharmacist can view their batches", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await drugSupplyChain.connect(manufacturer).transferBatch(
      1,
      distributor.address,
      shipmentNumber1,
      "in_transit"
    );

    await drugSupplyChain.connect(distributor).transferBatch(
      1,
      pharmacist.address,
      shipmentNumber2,
      "delivered"
    );

    const batches = await drugSupplyChain.connect(pharmacist).getBatchesByPharmacist(pharmacist.address);
    expect(batches.length).to.equal(1);
    expect(batches[0].details.batchNumber).to.equal(batchNumber1);
    expect(batches[0].currentOwner).to.equal(pharmacist.address);
  });

  it("Admin can view all batches", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await drugSupplyChain.connect(manufacturer).createBatch(
      2,
      batchNumber2,
      102,
      "Paracetamol 500mg",
      202,
      500,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility B",
      302,
      currentTime,
      shipmentNumber2,
      402,
      502,
      "/qr/codes/batch-002"
    );

    const batches = await drugSupplyChain.connect(admin).getAllBatches();
    expect(batches.length).to.equal(2);
  });

  it("Regulator can view flagged batches", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await drugSupplyChain.connect(manufacturer).markBatchAsCounterfeit(1, "Quality issues");

    const flaggedBatches = await drugSupplyChain.connect(regulator).getFlaggedBatches();
    expect(flaggedBatches.length).to.equal(1);
    expect(flaggedBatches[0].details.batchNumber).to.equal(batchNumber1);
    expect(flaggedBatches[0].isCounterfeit).to.be.true;
  });

  it("Can get batch by batch number", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    const batch = await drugSupplyChain.connect(manufacturer).getBatchByNumber(batchNumber1);
    expect(batch.details.batchNumber).to.equal(batchNumber1);
    expect(batch.details.drugName).to.equal("Amoxicillin 500mg");
  });

  it("Can get batch ownership history", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await drugSupplyChain.connect(manufacturer).transferBatch(
      1,
      distributor.address,
      shipmentNumber1,
      "in_transit"
    );

    await drugSupplyChain.connect(distributor).transferBatch(
      1,
      pharmacist.address,
      shipmentNumber2,
      "delivered"
    );

    const ownershipHistory = await drugSupplyChain.connect(pharmacist).getBatchOwnershipHistory(1);
    expect(ownershipHistory.length).to.equal(3);
    expect(ownershipHistory[0]).to.equal(manufacturer.address);
    expect(ownershipHistory[1]).to.equal(distributor.address);
    expect(ownershipHistory[2]).to.equal(pharmacist.address);
  });

  // ---------------- Utility Functions ----------------
  it("Can verify batch authenticity", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await drugSupplyChain.connect(manufacturer).transferBatch(
      1,
      distributor.address,
      shipmentNumber1,
      "in_transit"
    );

    await drugSupplyChain.connect(distributor).transferBatch(
      1,
      pharmacist.address,
      shipmentNumber2,
      "delivered"
    );

    const isAuthentic = await drugSupplyChain.verifyBatchAuthenticity(1);
    expect(isAuthentic).to.be.true;
  });

  it("Cannot verify counterfeit batch", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await drugSupplyChain.connect(manufacturer).markBatchAsCounterfeit(1, "Quality issues");

    const isAuthentic = await drugSupplyChain.verifyBatchAuthenticity(1);
    expect(isAuthentic).to.be.false;
  });

  it("Can detect anomalies in supply chain", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    // Create an anomaly by marking as counterfeit
    await drugSupplyChain.connect(manufacturer).markBatchAsCounterfeit(1, "Quality issues");

    const anomalies = await drugSupplyChain.connect(regulator).detectAnomalies(1);
    expect(anomalies.length).to.be.greaterThan(0);
    expect(anomalies[0]).to.equal("Batch flagged as counterfeit");
  });

  it("Can check if batch is expired", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 5; // 5 seconds from now

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    // Wait for expiration
    await ethers.provider.send("evm_increaseTime", [10]);
    await ethers.provider.send("evm_mine");

    const isExpired = await drugSupplyChain.isBatchExpired(1);
    expect(isExpired).to.be.true;
  });

  it("Can update blockchain transaction hash", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    const txHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    // Don't check exact timestamp in event
    await expect(
      drugSupplyChain.connect(manufacturer).updateBatchBlockchainTx(1, txHash)
    )
      .to.emit(drugSupplyChain, "BatchBlockchainTxUpdated");

    // Verify the function executed without reverting
    const batch = await drugSupplyChain.getBatch(1);
    expect(batch.exists).to.be.true;
  });

  // ---------------- Edge Cases ----------------
  it("Suspended manufacturer cannot create batch", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    // Suspend the manufacturer
    await userManagement.suspendUser(manufacturer.address);

    await expect(
      drugSupplyChain.connect(manufacturer).createBatch(
        1,
        batchNumber1,
        101,
        "Amoxicillin 500mg",
        201,
        1000,
        manufactureDate,
        expiryDate,
        "15-25°C",
        "Manufacturing Facility A",
        301,
        currentTime,
        shipmentNumber1,
        401,
        501,
        "/qr/codes/batch-001"
      )
    ).to.be.revertedWith("Manufacturer must be active");
  });

  it("Suspended distributor cannot receive batch", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    // Suspend the distributor
    await userManagement.suspendUser(distributor.address);

    await expect(
      drugSupplyChain.connect(manufacturer).transferBatch(
        1,
        distributor.address,
        shipmentNumber1,
        "in_transit"
      )
    ).to.be.revertedWith("Recipient must be active");
  });

  it("Cannot access non-existent batch", async function () {
    await expect(
      drugSupplyChain.getBatch(999)
    ).to.be.revertedWith("Batch not found");

    await expect(
      drugSupplyChain.getBatchByNumber("NONEXISTENT")
    ).to.be.revertedWith("Batch not found");
  });

  it("Unauthorized user cannot view batches", async function () {
    const currentTime = await getCurrentTimestamp();
    const manufactureDate = currentTime - 7 * 24 * 60 * 60;
    const expiryDate = currentTime + 365 * 24 * 60 * 60;

    await drugSupplyChain.connect(manufacturer).createBatch(
      1,
      batchNumber1,
      101,
      "Amoxicillin 500mg",
      201,
      1000,
      manufactureDate,
      expiryDate,
      "15-25°C",
      "Manufacturing Facility A",
      301,
      currentTime,
      shipmentNumber1,
      401,
      501,
      "/qr/codes/batch-001"
    );

    await expect(
      drugSupplyChain.connect(addr1).getBatchesByManufacturer(manufacturer.address)
    ).to.be.revertedWith("Not authorized");

    await expect(
      drugSupplyChain.connect(addr1).getAllBatches()
    ).to.be.revertedWith("Only admin or regulator can view all batches");
  });
});