const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RegulatorOversight Contract", function () {
  let UserManagement, userManagement;
  let RegulatorOversight, regulatorOversight;
  
  let deployer, admin, regulator, manufacturer, distributor, pharmacist, patient, addr1, addr2;

  beforeEach(async function () {
    [deployer, admin, regulator, manufacturer, distributor, pharmacist, patient, addr1, addr2] = await ethers.getSigners();

    // Deploy UserManagement first
    UserManagement = await ethers.getContractFactory("UserManagement");
    userManagement = await UserManagement.deploy();
    await userManagement.waitForDeployment();

    // Deploy RegulatorOversight
    RegulatorOversight = await ethers.getContractFactory("RegulatorOversight");
    regulatorOversight = await RegulatorOversight.deploy(userManagement.target);
    await regulatorOversight.waitForDeployment();

    // Setup roles in UserManagement
    const manufacturerId = await userManagement.getRoleIdByName("manufacturer");
    const distributorId = await userManagement.getRoleIdByName("distributor");
    const pharmacistId = await userManagement.getRoleIdByName("pharmacist");
    const regulatorId = await userManagement.getRoleIdByName("regulator");
    const adminId = await userManagement.getRoleIdByName("admin");
    const patientId = await userManagement.getRoleIdByName("patient");

    // Register and approve users
    await userManagement.registerUser(manufacturer.address, manufacturerId, "Manufacturer Co");
    await userManagement.registerUser(distributor.address, distributorId, "Distributor Inc");
    await userManagement.registerUser(pharmacist.address, pharmacistId, "Pharmacy Ltd");
    await userManagement.registerUser(regulator.address, regulatorId, "Regulator Agency");
    await userManagement.registerUser(admin.address, adminId, "Admin User");
    await userManagement.registerUser(patient.address, patientId, "Patient Name");

    await userManagement.approveUser(manufacturer.address);
    await userManagement.approveUser(distributor.address);
    await userManagement.approveUser(pharmacist.address);
    await userManagement.approveUser(regulator.address);
    await userManagement.approveUser(admin.address);
    await userManagement.approveUser(patient.address);
  });

  // ---------------- Deployment ----------------
  it("Should deploy with correct contract addresses", async function () {
    expect(await regulatorOversight.userManagement()).to.equal(userManagement.target);
  });

  // ---------------- Audit Logging ----------------
  it("Regulator can log audit", async function () {
    await expect(
      regulatorOversight.connect(regulator).logAudit(
        "Compliance check for batch verification",
        "BATCH",
        1
      )
    )
      .to.emit(regulatorOversight, "AuditLogged");

    const auditLogs = await regulatorOversight.connect(regulator).getAuditLogs();
    expect(auditLogs.length).to.equal(1);
    expect(auditLogs[0].description).to.equal("Compliance check for batch verification");
    expect(auditLogs[0].entityType).to.equal("BATCH");
    expect(auditLogs[0].entityId).to.equal(1);
    expect(auditLogs[0].regulator).to.equal(regulator.address);
  });

  it("Cannot log audit with empty description", async function () {
    await expect(
      regulatorOversight.connect(regulator).logAudit("", "BATCH", 1)
    ).to.be.revertedWith("Description required");
  });

  it("Cannot log audit with empty entity type", async function () {
    await expect(
      regulatorOversight.connect(regulator).logAudit("Test audit", "", 1)
    ).to.be.revertedWith("Entity type required");
  });

  it("Cannot log audit with invalid entity type", async function () {
    await expect(
      regulatorOversight.connect(regulator).logAudit("Test audit", "INVALID", 1)
    ).to.be.revertedWith("Invalid entity type");
  });

  it("Non-regulator cannot log audit", async function () {
    await expect(
      regulatorOversight.connect(manufacturer).logAudit("Test audit", "BATCH", 1)
    ).to.be.revertedWith("Only regulators can perform this action");
  });

  // ---------------- Entity Flagging ----------------
  it("Regulator can flag batch", async function () {
    await expect(
      regulatorOversight.connect(regulator).flagEntity(
        "BATCH",
        1,
        manufacturer.address,
        "Suspicious manufacturing practices"
      )
    )
      .to.emit(regulatorOversight, "EntityFlagged");

    const flaggedBatches = await regulatorOversight.connect(regulator).getFlaggedBatches();
    expect(flaggedBatches.length).to.equal(1);
    expect(flaggedBatches[0].entityType).to.equal("BATCH");
    expect(flaggedBatches[0].entityId).to.equal(1);
    expect(flaggedBatches[0].reason).to.equal("Suspicious manufacturing practices");
    expect(flaggedBatches[0].status).to.equal("ACTIVE");
  });

  it("Regulator can flag prescription", async function () {
    await expect(
      regulatorOversight.connect(regulator).flagEntity(
        "PRESCRIPTION",
        101,
        pharmacist.address,
        "Potential prescription fraud"
      )
    )
      .to.emit(regulatorOversight, "EntityFlagged");

    const flaggedPrescriptions = await regulatorOversight.connect(regulator).getFlaggedPrescriptions();
    expect(flaggedPrescriptions.length).to.equal(1);
    expect(flaggedPrescriptions[0].entityType).to.equal("PRESCRIPTION");
    expect(flaggedPrescriptions[0].entityId).to.equal(101);
    expect(flaggedPrescriptions[0].reason).to.equal("Potential prescription fraud");
  });

  it("Regulator can flag user", async function () {
    await expect(
      regulatorOversight.connect(regulator).flagEntity(
        "USER",
        201,
        distributor.address,
        "Multiple compliance violations"
      )
    )
      .to.emit(regulatorOversight, "EntityFlagged");

    const flaggedUsers = await regulatorOversight.connect(regulator).getFlaggedUsers();
    expect(flaggedUsers.length).to.equal(1);
    expect(flaggedUsers[0].entityType).to.equal("USER");
    expect(flaggedUsers[0].userAddress).to.equal(distributor.address);
    expect(flaggedUsers[0].reason).to.equal("Multiple compliance violations");
  });

  it("Cannot flag entity with empty reason", async function () {
    await expect(
      regulatorOversight.connect(regulator).flagEntity("BATCH", 1, manufacturer.address, "")
    ).to.be.revertedWith("Reason required");
  });

  it("Cannot flag entity with empty entity type", async function () {
    await expect(
      regulatorOversight.connect(regulator).flagEntity("", 1, manufacturer.address, "Reason")
    ).to.be.revertedWith("Entity type required");
  });

  it("Cannot flag entity with invalid entity type", async function () {
    await expect(
      regulatorOversight.connect(regulator).flagEntity("INVALID", 1, manufacturer.address, "Reason")
    ).to.be.revertedWith("Invalid entity type");
  });

  it("Cannot flag already flagged active entity", async function () {
    await regulatorOversight.connect(regulator).flagEntity(
      "BATCH",
      1,
      manufacturer.address,
      "First flag"
    );

    await expect(
      regulatorOversight.connect(regulator).flagEntity(
        "BATCH",
        1,
        manufacturer.address,
        "Second flag"
      )
    ).to.be.revertedWith("Entity is already flagged");
  });

  it("Non-regulator cannot flag entity", async function () {
    await expect(
      regulatorOversight.connect(manufacturer).flagEntity("BATCH", 1, manufacturer.address, "Reason")
    ).to.be.revertedWith("Only regulators can perform this action");
  });

  // ---------------- Automatic Suspension ----------------
  it("User gets automatically suspended after flag threshold", async function () {
    const suspensionPolicy = await regulatorOversight.getSuspensionPolicy();
    const maxFlags = suspensionPolicy.maxFlagsBeforeSuspension;

    // Flag user multiple times to reach suspension threshold
    for (let i = 1; i <= maxFlags; i++) {
      await regulatorOversight.connect(regulator).flagEntity(
        "USER",
        i,
        distributor.address,
        `Violation ${i}`
      );
    }

    // Check if user is suspended using local suspension system
    const isSuspended = await regulatorOversight.isUserSuspended(distributor.address);
    expect(isSuspended).to.be.true;

    // Check flag count and suspension status
    const complianceStatus = await regulatorOversight.connect(regulator).getUserComplianceStatus(distributor.address);
    expect(complianceStatus.flagCount).to.equal(maxFlags);
    expect(complianceStatus.isSuspended).to.be.true;
  });

  it("User flag count increments correctly", async function () {
    // First flag
    await regulatorOversight.connect(regulator).flagEntity(
      "USER",
      1,
      distributor.address,
      "First violation"
    );

    let complianceStatus = await regulatorOversight.connect(regulator).getUserComplianceStatus(distributor.address);
    expect(complianceStatus.flagCount).to.equal(1);
    expect(complianceStatus.isSuspended).to.be.false;

    // Second flag
    await regulatorOversight.connect(regulator).flagEntity(
      "USER",
      2,
      distributor.address,
      "Second violation"
    );

    complianceStatus = await regulatorOversight.connect(regulator).getUserComplianceStatus(distributor.address);
    expect(complianceStatus.flagCount).to.equal(2);
    expect(complianceStatus.isSuspended).to.be.false;
  });

  it("Auto-suspension can be disabled", async function () {
    // Disable auto-suspension
    await regulatorOversight.connect(admin).updateSuspensionPolicy(3, 30 * 24 * 60 * 60, false);

    // Flag user multiple times
    for (let i = 1; i <= 5; i++) {
      await regulatorOversight.connect(regulator).flagEntity(
        "USER",
        i,
        distributor.address,
        `Violation ${i}`
      );
    }

    // User should not be suspended even with many flags
    const isSuspended = await regulatorOversight.isUserSuspended(distributor.address);
    expect(isSuspended).to.be.false;

    const complianceStatus = await regulatorOversight.connect(regulator).getUserComplianceStatus(distributor.address);
    expect(complianceStatus.flagCount).to.equal(5);
    expect(complianceStatus.isSuspended).to.be.false;
  });

  // ---------------- Manual Suspension ----------------
  it("Regulator can manually suspend user", async function () {
    await expect(
      regulatorOversight.connect(regulator).suspendUser(distributor.address, "Manual suspension for investigation")
    )
      .to.emit(regulatorOversight, "EntityFlagged");

    const isSuspended = await regulatorOversight.isUserSuspended(distributor.address);
    expect(isSuspended).to.be.true;

    const complianceStatus = await regulatorOversight.connect(regulator).getUserComplianceStatus(distributor.address);
    expect(complianceStatus.isSuspended).to.be.true;
  });

  it("Admin can manually suspend user", async function () {
    await expect(
      regulatorOversight.connect(admin).suspendUser(pharmacist.address, "Admin suspension for audit")
    )
      .to.emit(regulatorOversight, "EntityFlagged");

    const isSuspended = await regulatorOversight.isUserSuspended(pharmacist.address);
    expect(isSuspended).to.be.true;
  });

  it("Cannot suspend already suspended user", async function () {
    await regulatorOversight.connect(regulator).suspendUser(distributor.address, "First suspension");

    await expect(
      regulatorOversight.connect(regulator).suspendUser(distributor.address, "Second suspension")
    ).to.be.revertedWith("User is not active");
  });

  it("Cannot suspend inactive user", async function () {
    // Deactivate user first
    await userManagement.connect(admin).deactivateUser(distributor.address);

    await expect(
      regulatorOversight.connect(regulator).suspendUser(distributor.address, "Suspension reason")
    ).to.be.revertedWith("User is not active");
  });

  it("Non-regulator/admin cannot suspend user", async function () {
    await expect(
      regulatorOversight.connect(manufacturer).suspendUser(distributor.address, "Suspension reason")
    ).to.be.revertedWith("Only regulator or admin can perform this action");
  });

  // ---------------- Suspension Lifting ----------------
  it("Regulator can lift user suspension", async function () {
    // First suspend the user
    await regulatorOversight.connect(regulator).suspendUser(distributor.address, "Suspension for investigation");

    // Then lift the suspension
    await expect(
      regulatorOversight.connect(regulator).liftUserSuspension(distributor.address)
    )
      .to.emit(regulatorOversight, "UserSuspensionLifted");

    const isSuspended = await regulatorOversight.isUserSuspended(distributor.address);
    expect(isSuspended).to.be.false;
  });

  it("Admin can lift user suspension", async function () {
    await regulatorOversight.connect(regulator).suspendUser(distributor.address, "Suspension for investigation");

    await expect(
      regulatorOversight.connect(admin).liftUserSuspension(distributor.address)
    )
      .to.emit(regulatorOversight, "UserSuspensionLifted");

    const isSuspended = await regulatorOversight.isUserSuspended(distributor.address);
    expect(isSuspended).to.be.false;
  });

  it("Cannot lift suspension of non-suspended user", async function () {
    await expect(
      regulatorOversight.connect(regulator).liftUserSuspension(distributor.address)
    ).to.be.revertedWith("User is not suspended");
  });

  // ---------------- Flag Status Management ----------------
  it("Regulator can update flag status", async function () {
    // First flag an entity
    await regulatorOversight.connect(regulator).flagEntity(
      "BATCH",
      1,
      manufacturer.address,
      "Suspicious batch"
    );

    // Then update its status
    await expect(
      regulatorOversight.connect(regulator).updateFlagStatus(1, "RESOLVED")
    )
      .to.emit(regulatorOversight, "FlagStatusUpdated");

    const flaggedBatches = await regulatorOversight.connect(regulator).getFlaggedBatches();
    expect(flaggedBatches[0].status).to.equal("RESOLVED");
  });

  it("Cannot update non-existent flag", async function () {
    await expect(
      regulatorOversight.connect(regulator).updateFlagStatus(999, "RESOLVED")
    ).to.be.revertedWith("Flag not found");
  });

  it("Cannot update flag with invalid status", async function () {
    await regulatorOversight.connect(regulator).flagEntity(
      "BATCH",
      1,
      manufacturer.address,
      "Suspicious batch"
    );

    await expect(
      regulatorOversight.connect(regulator).updateFlagStatus(1, "INVALID_STATUS")
    ).to.be.revertedWith("Invalid status");
  });

  // ---------------- Anomaly Detection ----------------
  it("Regulator can detect anomalies", async function () {
    // Call detectAnomalies and wait for the transaction
    const tx = await regulatorOversight.connect(regulator).detectAnomalies();
    await tx.wait(); // Wait for the transaction to be mined

    // Now get the anomaly reports
    const reports = await regulatorOversight.connect(regulator).getAnomalyReports();
    
    // Should return array of anomaly reports
    expect(reports).to.be.an('array');
    expect(reports.length).to.be.greaterThan(0);
  });

  it("Non-regulator cannot detect anomalies", async function () {
    await expect(
      regulatorOversight.connect(manufacturer).detectAnomalies()
    ).to.be.revertedWith("Only regulators can perform this action");
  });

  // ---------------- View Functions ----------------
  it("Regulator can view all audit logs", async function () {
    // Create multiple audit logs
    await regulatorOversight.connect(regulator).logAudit("Audit 1", "BATCH", 1);
    await regulatorOversight.connect(regulator).logAudit("Audit 2", "PRESCRIPTION", 101);
    await regulatorOversight.connect(regulator).logAudit("Audit 3", "USER", 201);

    const auditLogs = await regulatorOversight.connect(regulator).getAuditLogs();
    expect(auditLogs.length).to.equal(3);
  });

  it("Admin can view all audit logs", async function () {
    await regulatorOversight.connect(regulator).logAudit("Test audit", "BATCH", 1);

    const auditLogs = await regulatorOversight.connect(admin).getAuditLogs();
    expect(auditLogs.length).to.equal(1);
  });

  it("Regulator can view audit logs by specific regulator", async function () {
    await regulatorOversight.connect(regulator).logAudit("Audit by regulator", "BATCH", 1);

    const regulatorLogs = await regulatorOversight.connect(regulator).getAuditLogsByRegulator(regulator.address);
    expect(regulatorLogs.length).to.equal(1);
    expect(regulatorLogs[0].regulator).to.equal(regulator.address);
  });

  it("Cannot view audit logs by non-regulator address", async function () {
    await expect(
      regulatorOversight.connect(regulator).getAuditLogsByRegulator(manufacturer.address)
    ).to.be.revertedWith("Not a regulator");
  });

  it("Regulator can get system overview", async function () {
    // Create some test data
    await regulatorOversight.connect(regulator).logAudit("Audit 1", "BATCH", 1);
    await regulatorOversight.connect(regulator).flagEntity("BATCH", 1, manufacturer.address, "Reason");

    const overview = await regulatorOversight.connect(regulator).getSystemOverview();
    
    expect(overview.totalAudits).to.equal(1);
    expect(overview.activeFlags).to.equal(1);
  });

  it("Regulator can get compliance reports", async function () {
    const prescriptionReport = await regulatorOversight.connect(regulator).getPrescriptionComplianceReport();
    const supplyChainReport = await regulatorOversight.connect(regulator).getSupplyChainComplianceReport();
    
    // These return placeholder values
    expect(prescriptionReport.totalPrescriptions).to.equal(100);
    expect(supplyChainReport.totalBatches).to.equal(200);
  });

  it("Can check if entity is flagged", async function () {
    await regulatorOversight.connect(regulator).flagEntity("BATCH", 1, manufacturer.address, "Reason");

    const isFlagged = await regulatorOversight.connect(regulator).isEntityFlagged("BATCH", 1);
    expect(isFlagged).to.be.true;

    const notFlagged = await regulatorOversight.connect(regulator).isEntityFlagged("BATCH", 999);
    expect(notFlagged).to.be.false;
  });

  it("Can get entity flag history", async function () {
    await regulatorOversight.connect(regulator).flagEntity("USER", 1, distributor.address, "First flag");
    await regulatorOversight.connect(regulator).updateFlagStatus(1, "RESOLVED");
    await regulatorOversight.connect(regulator).flagEntity("USER", 1, distributor.address, "Second flag");

    const flagHistory = await regulatorOversight.connect(regulator).getEntityFlagHistory("USER", 1);
    expect(flagHistory.length).to.equal(2);
  });

  it("Can get recent activities", async function () {
    // Create multiple activities
    await regulatorOversight.connect(regulator).logAudit("Audit 1", "BATCH", 1);
    await regulatorOversight.connect(regulator).flagEntity("BATCH", 1, manufacturer.address, "Flag 1");
    await regulatorOversight.connect(regulator).logAudit("Audit 2", "PRESCRIPTION", 101);

    const recentActivities = await regulatorOversight.connect(regulator).getRecentActivities(2);
    
    expect(recentActivities.recentAudits.length).to.equal(2);
    expect(recentActivities.recentFlags.length).to.equal(1);
  });

  // ---------------- Suspension Policy Management ----------------
  it("Admin can update suspension policy", async function () {
    await regulatorOversight.connect(admin).updateSuspensionPolicy(5, 60 * 24 * 60 * 60, true);

    const newPolicy = await regulatorOversight.connect(regulator).getSuspensionPolicy();
    expect(newPolicy.maxFlagsBeforeSuspension).to.equal(5);
    expect(newPolicy.suspensionDuration).to.equal(60 * 24 * 60 * 60);
    expect(newPolicy.autoSuspensionEnabled).to.be.true;
  });

  it("Cannot update suspension policy with zero values", async function () {
    await expect(
      regulatorOversight.connect(admin).updateSuspensionPolicy(0, 30 * 24 * 60 * 60, true)
    ).to.be.revertedWith("Max flags must be greater than 0");

    await expect(
      regulatorOversight.connect(admin).updateSuspensionPolicy(3, 0, true)
    ).to.be.revertedWith("Suspension duration must be greater than 0");
  });

  it("Non-admin cannot update suspension policy", async function () {
    await expect(
      regulatorOversight.connect(regulator).updateSuspensionPolicy(5, 60 * 24 * 60 * 60, true)
    ).to.be.revertedWith("Only admin can perform this action");
  });

  // ---------------- Utility Functions ----------------
  it("Can check suspension expiration", async function () {
    // Manually suspend user
    await regulatorOversight.connect(regulator).suspendUser(distributor.address, "Manual suspension");

    const isExpired = await regulatorOversight.connect(regulator).isSuspensionExpired(distributor.address);
    expect(isExpired).to.be.false; // Just suspended, not expired yet
  });

  it("Can check if user is suspended using combined system", async function () {
    // Initially not suspended
    expect(await regulatorOversight.isUserSuspended(distributor.address)).to.be.false;
    expect(await regulatorOversight.isUserActive(distributor.address)).to.be.true;

    // Suspend user
    await regulatorOversight.connect(regulator).suspendUser(distributor.address, "Test suspension");

    // Should be suspended
    expect(await regulatorOversight.isUserSuspended(distributor.address)).to.be.true;
    expect(await regulatorOversight.isUserActive(distributor.address)).to.be.false;
  });

  // ---------------- Access Control ----------------
  it("Non-regulator/admin cannot access oversight data", async function () {
    await regulatorOversight.connect(regulator).logAudit("Test audit", "BATCH", 1);

    await expect(
      regulatorOversight.connect(manufacturer).getAuditLogs()
    ).to.be.revertedWith("Only regulator or admin can perform this action");

    await expect(
      regulatorOversight.connect(manufacturer).getFlaggedBatches()
    ).to.be.revertedWith("Only regulator or admin can perform this action");

    await expect(
      regulatorOversight.connect(manufacturer).getUserComplianceStatus(distributor.address)
    ).to.be.revertedWith("Only regulator or admin can perform this action");
  });

  // ---------------- Edge Cases ----------------
  it("Handles empty results gracefully", async function () {
    const flaggedBatches = await regulatorOversight.connect(regulator).getFlaggedBatches();
    const flaggedPrescriptions = await regulatorOversight.connect(regulator).getFlaggedPrescriptions();
    const flaggedUsers = await regulatorOversight.connect(regulator).getFlaggedUsers();
    
    expect(flaggedBatches.length).to.equal(0);
    expect(flaggedPrescriptions.length).to.equal(0);
    expect(flaggedUsers.length).to.equal(0);
  });

  it("Can flag same entity type with different IDs", async function () {
    await regulatorOversight.connect(regulator).flagEntity("BATCH", 1, manufacturer.address, "Reason 1");
    await regulatorOversight.connect(regulator).flagEntity("BATCH", 2, manufacturer.address, "Reason 2");

    const flaggedBatches = await regulatorOversight.connect(regulator).getFlaggedBatches();
    expect(flaggedBatches.length).to.equal(2);
  });

  it("Resolved flags don't prevent new flags on same entity", async function () {
    // Flag and resolve
    await regulatorOversight.connect(regulator).flagEntity("BATCH", 1, manufacturer.address, "First flag");
    await regulatorOversight.connect(regulator).updateFlagStatus(1, "RESOLVED");

    // Should be able to flag again since previous flag is resolved
    await regulatorOversight.connect(regulator).flagEntity("BATCH", 1, manufacturer.address, "Second flag");

    const flaggedBatches = await regulatorOversight.connect(regulator).getFlaggedBatches();
    expect(flaggedBatches.length).to.equal(2);
  });

  it("Auto-suspension only affects active users", async function () {
    // Deactivate user first
    await userManagement.connect(admin).deactivateUser(distributor.address);

    const suspensionPolicy = await regulatorOversight.getSuspensionPolicy();
    const maxFlags = suspensionPolicy.maxFlagsBeforeSuspension;

    // Try to flag inactive user multiple times
    for (let i = 1; i <= maxFlags; i++) {
      await regulatorOversight.connect(regulator).flagEntity(
        "USER",
        i,
        distributor.address,
        `Violation ${i}`
      );
    }

    // User should remain inactive (not suspended) since they weren't active to begin with
    const isActive = await regulatorOversight.isUserActive(distributor.address);
    expect(isActive).to.be.false;
    
    const isSuspended = await regulatorOversight.isUserSuspended(distributor.address);
    expect(isSuspended).to.be.false;
  });

  // ---------------- Integration Tests ----------------
  it("Integration: Full compliance workflow", async function () {
    // 1. Regulator logs audit
    await regulatorOversight.connect(regulator).logAudit("Routine compliance check", "BATCH", 1);

    // 2. Regulator flags a batch
    await regulatorOversight.connect(regulator).flagEntity("BATCH", 1, manufacturer.address, "Quality concerns");

    // 3. Regulator flags the manufacturer multiple times
    await regulatorOversight.connect(regulator).flagEntity("USER", 1, manufacturer.address, "First violation");
    await regulatorOversight.connect(regulator).flagEntity("USER", 2, manufacturer.address, "Second violation");

    // 4. Check manufacturer status (should not be suspended yet)
    let complianceStatus = await regulatorOversight.connect(regulator).getUserComplianceStatus(manufacturer.address);
    expect(complianceStatus.flagCount).to.equal(2);
    expect(complianceStatus.isSuspended).to.be.false;

    // 5. Add one more flag to trigger auto-suspension
    await regulatorOversight.connect(regulator).flagEntity("USER", 3, manufacturer.address, "Third violation - auto-suspend");

    // 6. Verify manufacturer is now suspended
    complianceStatus = await regulatorOversight.connect(regulator).getUserComplianceStatus(manufacturer.address);
    expect(complianceStatus.flagCount).to.equal(3);
    expect(complianceStatus.isSuspended).to.be.true;

    // 7. Resolve some flags
    await regulatorOversight.connect(regulator).updateFlagStatus(1, "RESOLVED");
    await regulatorOversight.connect(regulator).updateFlagStatus(2, "RESOLVED");

    // 8. Lift suspension
    await regulatorOversight.connect(regulator).liftUserSuspension(manufacturer.address);

    // 9. Verify manufacturer is active again
    const finalStatus = await regulatorOversight.isUserActive(manufacturer.address);
    expect(finalStatus).to.be.true;
  });

  // ---------------- Additional Tests for New Functions ----------------
  it("Can get anomaly reports", async function () {
    // Trigger anomaly detection to create a report
    const tx = await regulatorOversight.connect(regulator).detectAnomalies();
    await tx.wait();

    const reports = await regulatorOversight.connect(regulator).getAnomalyReports();
    expect(reports.length).to.be.greaterThan(0);
  });

  it("Can get user compliance status with detailed info", async function () {
    await regulatorOversight.connect(regulator).flagEntity("USER", 1, distributor.address, "First violation");

    const complianceStatus = await regulatorOversight.connect(regulator).getUserComplianceStatus(distributor.address);
    
    expect(complianceStatus.flagCount).to.equal(1);
    expect(complianceStatus.isSuspended).to.be.false;
    expect(complianceStatus.suspensionTime).to.equal(0);
    expect(complianceStatus.flagsUntilSuspension).to.equal(2); // Default threshold is 3
  });

  it("Can get suspension policy", async function () {
    const policy = await regulatorOversight.connect(regulator).getSuspensionPolicy();
    
    expect(policy.maxFlagsBeforeSuspension).to.equal(3);
    expect(policy.suspensionDuration).to.equal(30 * 24 * 60 * 60); // 30 days in seconds
    expect(policy.autoSuspensionEnabled).to.be.true;
  });

  it("Cannot get recent activities with zero limit", async function () {
    await expect(
      regulatorOversight.connect(regulator).getRecentActivities(0)
    ).to.be.revertedWith("Limit must be greater than 0");
  });
});