const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserManagement Contract", function () {
  let UserManagement, userManagement;
  let DummyActive, dummy;
  let deployer, addr1, addr2, addr3, addr4, addr5, addr6;

  beforeEach(async function () {
    [deployer, addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners();
    UserManagement = await ethers.getContractFactory("UserManagement");
    userManagement = await UserManagement.deploy();
    await userManagement.waitForDeployment();

    // Deploy DummyActive with the deployed UserManagement address
    DummyActive = await ethers.getContractFactory("DummyActive");
    dummy = await DummyActive.deploy(userManagement.target);
    await dummy.waitForDeployment();
  });

  // ---------------- Deployment ----------------
  it("Should deploy and set deployer as admin with default role", async function () {
    expect(await userManagement.isAdmin(deployer.address)).to.be.true;
    expect(await userManagement.getUserRole(deployer.address)).to.equal("admin");
    expect(await userManagement.getUserStatusString(deployer.address)).to.equal("active");
  });

  it("Should preload default roles", async function () {
    const roles = ["admin", "doctor", "pharmacist", "patient", "regulator", "manufacturer", "distributor"];
    for (const role of roles) {
      const id = await userManagement.getRoleIdByName(role);
      expect(await userManagement.getRoleName(id)).to.equal(role);
    }
  });

  // ---------------- Role Management ----------------
  it("Admin can create a new role", async function () {
    const counterBefore = await userManagement.roleCounter();
    await expect(userManagement.createRole("auditor"))
      .to.emit(userManagement, "RoleCreated")
      .withArgs(counterBefore + 1n, "auditor");
  });

  it("Cannot create duplicate roles", async function () {
    await expect(userManagement.createRole("doctor"))
      .to.be.revertedWith("Role already exists");
  });

  it("Non-admin cannot create roles", async function () {
    await expect(userManagement.connect(addr1).createRole("tester"))
      .to.be.revertedWith("Only admin can perform this action");
  });

  it("Cannot create role with empty name", async function () {
    await expect(userManagement.createRole("")).to.be.revertedWith("Role name cannot be empty");
  });

  // ---------------- User Registration ----------------
  it("Should register a user and emit event", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await expect(userManagement.registerUser(addr1.address, doctorId, "Dr. Alice"))
      .to.emit(userManagement, "UserRegistered")
      .withArgs(addr1.address, doctorId, 0, "Dr. Alice"); // Pending = 0
    expect(await userManagement.getUserStatusString(addr1.address)).to.equal("pending");
  });

  it("Registering an admin role automatically makes them admin", async function () {
    const adminId = await userManagement.getRoleIdByName("admin");
    await userManagement.registerUser(addr1.address, adminId, "Admin Alice");
    expect(await userManagement.isAdmin(addr1.address)).to.be.true;
  });

  it("Cannot register duplicate users", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId, "Dr. Alice");
    await expect(userManagement.registerUser(addr1.address, doctorId, "Dr. Alice"))
      .to.be.revertedWith("User already registered");
  });

  it("Cannot register with zero address", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await expect(userManagement.registerUser(ethers.ZeroAddress, doctorId, "NoName"))
      .to.be.revertedWith("Invalid wallet address");
  });

  it("Cannot register without metadata", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await expect(userManagement.registerUser(addr2.address, doctorId, ""))
      .to.be.revertedWith("Missing metadata");
  });

  // ---------------- Status Management ----------------
  it("Admin can approve pending user", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId, "Dr. Alice");
    await expect(userManagement.approveUser(addr1.address))
      .to.emit(userManagement, "UserStatusUpdated")
      .withArgs(addr1.address, 1); // Active = 1
    expect(await userManagement.getUserStatusString(addr1.address)).to.equal("active");
  });

  it("Cannot approve non-pending user", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId, "Dr. Alice");
    await userManagement.approveUser(addr1.address);
    await expect(userManagement.approveUser(addr1.address))
      .to.be.revertedWith("User not pending");
  });

  it("Admin or regulator can suspend active user", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    const regulatorId = await userManagement.getRoleIdByName("regulator");

    // Register and approve doctor
    await userManagement.registerUser(addr1.address, doctorId, "Dr. Alice");
    await userManagement.approveUser(addr1.address);

    // Register and approve regulator
    await userManagement.registerUser(addr2.address, regulatorId, "Reg Bob");
    await userManagement.approveUser(addr2.address);

    // Admin suspends doctor
    await expect(userManagement.suspendUser(addr1.address))
      .to.emit(userManagement, "UserStatusUpdated")
      .withArgs(addr1.address, 2); // Suspended = 2

    // Reactivate doctor for regulator test
    await userManagement.reactivateUser(addr1.address);

    // Regulator suspends doctor
    await expect(userManagement.connect(addr2).suspendUser(addr1.address))
      .to.emit(userManagement, "UserStatusUpdated")
      .withArgs(addr1.address, 2);
  });

  it("Non-admin/regulator cannot suspend", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId, "Dr. Alice");
    await userManagement.approveUser(addr1.address);

    await userManagement.registerUser(addr3.address, doctorId, "Dr. NonAuth");
    await userManagement.approveUser(addr3.address);

    await expect(userManagement.connect(addr3).suspendUser(addr1.address))
      .to.be.revertedWith("Not authorized");
  });

  it("Cannot suspend admin", async function () {
    await expect(userManagement.suspendUser(deployer.address))
      .to.be.revertedWith("Cannot suspend an admin");
  });

  it("Admin can deactivate user, cannot deactivate self", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId, "Dr. Alice");
    await userManagement.approveUser(addr1.address);

    await expect(userManagement.deactivateUser(addr1.address))
      .to.emit(userManagement, "UserStatusUpdated")
      .withArgs(addr1.address, 3); // Inactive = 3
    expect(await userManagement.getUserStatusString(addr1.address)).to.equal("inactive");

    await expect(userManagement.deactivateUser(deployer.address))
      .to.be.revertedWith("Cannot deactivate self");
  });

  it("Admin can reactivate inactive user", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId, "Dr. Alice");
    await userManagement.approveUser(addr1.address);
    await userManagement.deactivateUser(addr1.address);

    await expect(userManagement.reactivateUser(addr1.address))
      .to.emit(userManagement, "UserStatusUpdated")
      .withArgs(addr1.address, 1); // Active = 1
    expect(await userManagement.getUserStatusString(addr1.address)).to.equal("active");
  });

  it("Admin can reactivate suspended user", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId, "Dr. Alice");
    await userManagement.approveUser(addr1.address);
    await userManagement.suspendUser(addr1.address);

    await expect(userManagement.reactivateUser(addr1.address))
      .to.emit(userManagement, "UserStatusUpdated")
      .withArgs(addr1.address, 1); // Active = 1
    expect(await userManagement.getUserStatusString(addr1.address)).to.equal("active");
  });

  // ---------------- Admin Management ----------------
  it("Add and remove admins", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId, "Dr. Alice");

    await expect(userManagement.addAdmin(addr1.address)).to.emit(userManagement, "AdminAdded");
    expect(await userManagement.isAdmin(addr1.address)).to.be.true;

    await expect(userManagement.removeAdmin(addr1.address)).to.emit(userManagement, "AdminRemoved");
    expect(await userManagement.isAdmin(addr1.address)).to.be.false;
  });

  it("Non-admin cannot manage admins", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId, "Dr. Alice");
    await expect(userManagement.connect(addr1).addAdmin(addr2.address))
      .to.be.revertedWith("Only admin can perform this action");
  });

  // ---------------- Role Helper Functions ----------------
  it("Correctly verifies predefined role helpers", async function () {
    const roleNames = ["doctor", "pharmacist", "patient", "regulator", "manufacturer", "distributor"];
    const roleChecks = ["isDoctor", "isPharmacist", "isPatient", "isRegulator", "isManufacturer", "isDistributor"];
    const signers = [addr1, addr2, addr3, addr4, addr5, addr6];

    for (let i = 0; i < roleNames.length; i++) {
      const id = await userManagement.getRoleIdByName(roleNames[i]);
      await userManagement.registerUser(signers[i].address, id, `User ${i}`);
      await userManagement.approveUser(signers[i].address);
      expect(await userManagement[roleChecks[i]](signers[i].address)).to.be.true;
    }
  });

  // ---------------- getAllUsers ----------------
  it("Returns all registered users", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    const patientId = await userManagement.getRoleIdByName("patient");

    await userManagement.registerUser(addr1.address, doctorId, "Dr. Alice");
    await userManagement.registerUser(addr2.address, patientId, "Patient Bob");

    const allUsers = await userManagement.getAllUsers();
    expect(allUsers.length).to.be.gte(3); // includes deployer
    expect(allUsers.map(u => u.wallet)).to.include(addr1.address);
    expect(allUsers.map(u => u.wallet)).to.include(addr2.address);
  });

  // ---------------- onlyActiveUser modifier ----------------
  it("onlyActiveUser modifier works correctly", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId, "Dr. Alice");
    await userManagement.approveUser(addr1.address);

    // Active user works
    await expect(dummy.connect(addr1).callActiveFunction()).not.to.be.reverted;

    // Suspend user
    await userManagement.suspendUser(addr1.address);
    await expect(dummy.connect(addr1).callActiveFunction()).to.be.revertedWith("User is not active");

    // Reactivate user from suspended state
    await userManagement.reactivateUser(addr1.address);
    await expect(dummy.connect(addr1).callActiveFunction()).not.to.be.reverted;

    // Deactivate user
    await userManagement.deactivateUser(addr1.address);
    await expect(dummy.connect(addr1).callActiveFunction()).to.be.revertedWith("User is not active");

    // Reactivate user from inactive state
    await userManagement.reactivateUser(addr1.address);
    await expect(dummy.connect(addr1).callActiveFunction()).not.to.be.reverted;
  });
});