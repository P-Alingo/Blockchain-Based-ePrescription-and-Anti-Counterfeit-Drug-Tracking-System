const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserManagement", function () {
  let UserManagement, userManagement;
  let deployer, addr1, addr2, addr3, addr4, addr5, addr6;

  beforeEach(async function () {
    [deployer, addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners();
    UserManagement = await ethers.getContractFactory("UserManagement");
    userManagement = await UserManagement.deploy();
    await userManagement.waitForDeployment(); // ethers v6+
  });

  // ---------------- Deployment ----------------
  it("Should deploy and set deployer as admin", async function () {
    expect(await userManagement.isAdmin(deployer.address)).to.be.true;
    expect(await userManagement.getUserRole(deployer.address)).to.equal("admin");
  });

  it("Should preload all default roles", async function () {
    const roles = [
      "admin", "doctor", "pharmacist", "patient",
      "regulator", "manufacturer", "distributor"
    ];
    for (const role of roles) {
      const id = await userManagement.getRoleIdByName(role);
      expect(await userManagement.getRoleName(id)).to.equal(role);
    }
  });

  // ---------------- Roles ----------------
  it("Should allow admin to create a new role", async function () {
    const roleCounterBefore = await userManagement.roleCounter();
    await expect(userManagement.createRole("auditor"))
      .to.emit(userManagement, "RoleCreated")
      .withArgs(roleCounterBefore + 1n, "auditor");
  });

  it("Should prevent duplicate role names", async function () {
    await expect(userManagement.createRole("doctor"))
      .to.be.revertedWith("Role already exists");
  });

  it("Should prevent non-admin from creating roles", async function () {
    await expect(userManagement.connect(addr1).createRole("tester"))
      .to.be.revertedWith("Only admin can perform this action");
  });

  it("Should revert when creating a role with empty name", async function () {
    await expect(userManagement.createRole("")).to.be.revertedWith("Role name cannot be empty");
  });

  // ---------------- User Registration ----------------
  it("Should register user and emit event", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await expect(userManagement.registerUser(addr1.address, doctorId))
      .to.emit(userManagement, "UserRegistered")
      .withArgs(addr1.address, doctorId);
  });

  it("Should auto-make user admin if role is admin", async function () {
    const adminId = await userManagement.getRoleIdByName("admin");
    await userManagement.registerUser(addr1.address, adminId);
    expect(await userManagement.isAdmin(addr1.address)).to.be.true;
  });

  it("Should not allow duplicate user registration", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId);
    await expect(userManagement.registerUser(addr1.address, doctorId))
      .to.be.revertedWith("User already registered");
  });

  it("Should revert when registering user with zero address", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await expect(userManagement.registerUser(ethers.ZeroAddress, doctorId))
      .to.be.revertedWith("Invalid wallet address");
  });

  // ---------------- User Updates ----------------
  it("Should update user role and handle admin transitions", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    const adminId = await userManagement.getRoleIdByName("admin");

    await userManagement.registerUser(addr1.address, doctorId);
    await expect(userManagement.updateUserRole(addr1.address, adminId))
      .to.emit(userManagement, "AdminAdded");
    expect(await userManagement.isAdmin(addr1.address)).to.be.true;

    await expect(userManagement.updateUserRole(addr1.address, doctorId))
      .to.emit(userManagement, "AdminRemoved");
    expect(await userManagement.isAdmin(addr1.address)).to.be.false;
  });

  it("Should revert updating role for non-registered user", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await expect(userManagement.updateUserRole(addr1.address, doctorId))
      .to.be.revertedWith("User does not exist");
  });

  // ---------------- Soft Delete ----------------
  it("Should soft delete a user and remove admin if applicable", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId);
    await userManagement.addAdmin(addr1.address);

    await expect(userManagement.removeUser(addr1.address))
      .to.emit(userManagement, "UserRemoved");

    await expect(userManagement.getUserRole(addr1.address))
      .to.be.revertedWith("User does not exist");
  });

  it("Should revert removing non-registered user", async function () {
    await expect(userManagement.removeUser(addr1.address))
      .to.be.revertedWith("User does not exist");
  });

  // ---------------- Admin Management ----------------
  it("Should add and remove admins correctly", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId);

    await expect(userManagement.addAdmin(addr1.address))
      .to.emit(userManagement, "AdminAdded");
    expect(await userManagement.isAdmin(addr1.address)).to.be.true;

    await expect(userManagement.addAdmin(addr1.address))
      .to.be.revertedWith("Already an admin");

    await expect(userManagement.removeAdmin(addr1.address))
      .to.emit(userManagement, "AdminRemoved");

    await expect(userManagement.removeAdmin(deployer.address))
      .to.be.revertedWith("Cannot remove self");
  });

  it("Should revert non-admin trying restricted actions", async function () {
    const doctorId = await userManagement.getRoleIdByName("doctor");
    await userManagement.registerUser(addr1.address, doctorId);

    await expect(userManagement.connect(addr1).addAdmin(addr2.address))
      .to.be.revertedWith("Only admin can perform this action");

    await expect(userManagement.connect(addr1).removeAdmin(addr2.address))
      .to.be.revertedWith("Only admin can perform this action");

    await expect(userManagement.connect(addr1).updateUserRole(addr2.address, doctorId))
      .to.be.revertedWith("Only admin can perform this action");
  });

  // ---------------- Role Checks ----------------
  it("Should correctly verify all predefined role helpers", async function () {
    const roleNames = [
      "doctor", "pharmacist", "patient", "regulator", "manufacturer", "distributor"
    ];
    const roleChecks = [
      "isDoctor", "isPharmacist", "isPatient", "isRegulator", "isManufacturer", "isDistributor"
    ];

    const signers = [addr1, addr2, addr3, addr4, addr5, addr6];

    for (let i = 0; i < roleNames.length; i++) {
      const id = await userManagement.getRoleIdByName(roleNames[i]);
      await userManagement.registerUser(signers[i].address, id);
      expect(await userManagement[roleChecks[i]](signers[i].address)).to.be.true;
    }
  });
});
