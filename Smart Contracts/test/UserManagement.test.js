const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserManagement", function () {
  let UserManagement;
  let userManagement;
  let owner;
  let admin;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [owner, admin, user1, user2, user3] = await ethers.getSigners();
    
    UserManagement = await ethers.getContractFactory("UserManagement");
    userManagement = await UserManagement.deploy();
    await userManagement.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await userManagement.admins(owner.address)).to.be.true;
    });

    it("Should create default admin role", async function () {
      const role = await userManagement.getRole(1);
      expect(role.name).to.equal("admin");
    });

    it("Should register deployer as admin user", async function () {
      const user = await userManagement.getUser(owner.address);
      expect(user.exists).to.be.true;
      expect(user.roleId).to.equal(1);
      expect(user.wallet).to.equal(owner.address);
    });
  });

  describe("Role Management", function () {
    it("Should create new role", async function () {
      await userManagement.createRole("doctor");
      
      const role = await userManagement.getRole(2);
      expect(role.name).to.equal("doctor");
      expect(role.id).to.equal(2);
    });

    it("Should emit RoleCreated event", async function () {
      await expect(userManagement.createRole("pharmacist"))
        .to.emit(userManagement, "RoleCreated")
        .withArgs(2, "pharmacist");
    });

    it("Should not allow non-admin to create role", async function () {
      await expect(
        userManagement.connect(user1).createRole("doctor")
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });

  describe("User Registration", function () {
    beforeEach(async function () {
      await userManagement.createRole("doctor");
      await userManagement.createRole("patient");
    });

    it("Should register new user", async function () {
      await userManagement.registerUser(
        user1.address,
        "doctor@example.com",
        "hash123",
        2 // doctor role
      );

      const user = await userManagement.getUser(user1.address);
      expect(user.exists).to.be.true;
      expect(user.email).to.equal("doctor@example.com");
      expect(user.passwordHash).to.equal("hash123");
      expect(user.roleId).to.equal(2);
      expect(user.wallet).to.equal(user1.address);
    });

    it("Should emit UserRegistered event", async function () {
      await expect(
        userManagement.registerUser(
          user1.address,
          "doctor@example.com",
          "hash123",
          2
        )
      )
        .to.emit(userManagement, "UserRegistered")
        .withArgs(2, user1.address, 2);
    });

    it("Should make user admin if registered with admin role", async function () {
      await userManagement.registerUser(
        user1.address,
        "admin@example.com",
        "hash123",
        1 // admin role
      );

      expect(await userManagement.admins(user1.address)).to.be.true;
    });

    it("Should not register user with invalid wallet", async function () {
      await expect(
        userManagement.registerUser(
          ethers.ZeroAddress, // FIXED: Changed from ethers.constants.AddressZero
          "test@example.com",
          "hash123",
          2
        )
      ).to.be.revertedWith("Invalid wallet address");
    });

    it("Should not register duplicate user", async function () {
      await userManagement.registerUser(
        user1.address,
        "test@example.com",
        "hash123",
        2
      );

      await expect(
        userManagement.registerUser(
          user1.address,
          "test2@example.com",
          "hash456",
          3
        )
      ).to.be.revertedWith("User already registered");
    });

    it("Should not register user with invalid role", async function () {
      await expect(
        userManagement.registerUser(
          user1.address,
          "test@example.com",
          "hash123",
          999
        )
      ).to.be.revertedWith("Invalid role");
    });

    it("Should not allow non-admin to register user", async function () {
      await expect(
        userManagement.connect(user1).registerUser(
          user2.address,
          "test@example.com",
          "hash123",
          2
        )
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });

  describe("User Role Update", function () {
    beforeEach(async function () {
      await userManagement.createRole("doctor");
      await userManagement.createRole("patient");
      await userManagement.registerUser(
        user1.address,
        "doctor@example.com",
        "hash123",
        2
      );
    });

    it("Should update user role", async function () {
      await userManagement.updateUserRole(user1.address, 3);
      
      const user = await userManagement.getUser(user1.address);
      expect(user.roleId).to.equal(3);
    });

    it("Should emit UserUpdated event", async function () {
      await expect(userManagement.updateUserRole(user1.address, 3))
        .to.emit(userManagement, "UserUpdated")
        .withArgs(2, 3);
    });

    it("Should grant admin privileges when updating to admin role", async function () {
      await userManagement.updateUserRole(user1.address, 1);
      
      expect(await userManagement.admins(user1.address)).to.be.true;
    });

    it("Should revoke admin privileges when updating from admin role", async function () {
      // First make user1 admin
      await userManagement.updateUserRole(user1.address, 1);
      expect(await userManagement.admins(user1.address)).to.be.true;

      // Then change to non-admin role
      await userManagement.updateUserRole(user1.address, 2);
      expect(await userManagement.admins(user1.address)).to.be.false;
    });

    it("Should not update non-existent user", async function () {
      await expect(
        userManagement.updateUserRole(user2.address, 2)
      ).to.be.revertedWith("User not registered");
    });

    it("Should not update to invalid role", async function () {
      await expect(
        userManagement.updateUserRole(user1.address, 999)
      ).to.be.revertedWith("Invalid role");
    });
  });

  describe("User Removal", function () {
    beforeEach(async function () {
      await userManagement.createRole("doctor");
      await userManagement.registerUser(
        user1.address,
        "doctor@example.com",
        "hash123",
        2
      );
    });

    it("Should remove user", async function () {
      await userManagement.removeUser(user1.address);
      
      await expect(userManagement.getUser(user1.address))
        .to.be.revertedWith("User not registered");
    });

    it("Should emit UserRemoved event", async function () {
      await expect(userManagement.removeUser(user1.address))
        .to.emit(userManagement, "UserRemoved")
        .withArgs(2);
    });

    it("Should revoke admin privileges when removing admin user", async function () {
      // Make user1 admin first
      await userManagement.addAdmin(user1.address);
      expect(await userManagement.admins(user1.address)).to.be.true;

      await userManagement.removeUser(user1.address);
      expect(await userManagement.admins(user1.address)).to.be.false;
    });

    it("Should not remove non-existent user", async function () {
      await expect(
        userManagement.removeUser(user2.address)
      ).to.be.revertedWith("User not registered");
    });
  });

  describe("Admin Management", function () {
    beforeEach(async function () {
      await userManagement.createRole("doctor");
      await userManagement.registerUser(
        user1.address,
        "doctor@example.com",
        "hash123",
        2
      );
    });

    it("Should add admin", async function () {
      await userManagement.addAdmin(user1.address);
      
      expect(await userManagement.admins(user1.address)).to.be.true;
    });

    it("Should emit AdminAdded event", async function () {
      await expect(userManagement.addAdmin(user1.address))
        .to.emit(userManagement, "AdminAdded")
        .withArgs(user1.address);
    });

    it("Should remove admin", async function () {
      await userManagement.addAdmin(user1.address);
      await userManagement.removeAdmin(user1.address);
      
      expect(await userManagement.admins(user1.address)).to.be.false;
    });

    it("Should emit AdminRemoved event", async function () {
      await userManagement.addAdmin(user1.address);
      
      await expect(userManagement.removeAdmin(user1.address))
        .to.emit(userManagement, "AdminRemoved")
        .withArgs(user1.address);
    });

    it("Should not remove self as admin", async function () {
      await expect(
        userManagement.removeAdmin(owner.address)
      ).to.be.revertedWith("Cannot remove self");
    });

    it("Should not remove non-admin", async function () {
      await expect(
        userManagement.removeAdmin(user1.address)
      ).to.be.revertedWith("Not an admin");
    });

    it("Should not add admin for non-existent user", async function () {
      await expect(
        userManagement.addAdmin(user2.address)
      ).to.be.revertedWith("User must exist");
    });
  });

  describe("Role Check Functions", function () {
    beforeEach(async function () {
      // Create all default roles
      await userManagement.createRole("doctor");
      await userManagement.createRole("pharmacist");
      await userManagement.createRole("patient");
      await userManagement.createRole("regulator");
      await userManagement.createRole("manufacturer");
      await userManagement.createRole("distributor");

      // Register users with different roles
      await userManagement.registerUser(user1.address, "doctor@test.com", "hash1", 2);
      await userManagement.registerUser(user2.address, "pharmacist@test.com", "hash2", 3);
      await userManagement.registerUser(user3.address, "patient@test.com", "hash3", 4);
    });

    it("Should correctly identify doctor", async function () {
      expect(await userManagement.isDoctor(user1.address)).to.be.true;
      expect(await userManagement.isDoctor(user2.address)).to.be.false;
    });

    it("Should correctly identify pharmacist", async function () {
      expect(await userManagement.isPharmacist(user2.address)).to.be.true;
      expect(await userManagement.isPharmacist(user1.address)).to.be.false;
    });

    it("Should correctly identify patient", async function () {
      expect(await userManagement.isPatient(user3.address)).to.be.true;
      expect(await userManagement.isPatient(user1.address)).to.be.false;
    });

    it("Should return false for unregistered wallet", async function () {
      const unregisteredWallet = ethers.Wallet.createRandom().address;
      
      expect(await userManagement.isDoctor(unregisteredWallet)).to.be.false;
      expect(await userManagement.isPharmacist(unregisteredWallet)).to.be.false;
      expect(await userManagement.isPatient(unregisteredWallet)).to.be.false;
    });

    it("Should correctly identify regulator", async function () {
      await userManagement.registerUser(
        admin.address,
        "regulator@test.com",
        "hash4",
        5 // regulator
      );
      
      expect(await userManagement.isRegulator(admin.address)).to.be.true;
    });

    it("Should correctly identify manufacturer", async function () {
      await userManagement.registerUser(
        admin.address,
        "manufacturer@test.com",
        "hash5",
        6 // manufacturer
      );
      
      expect(await userManagement.isManufacturer(admin.address)).to.be.true;
    });

    it("Should correctly identify distributor", async function () {
      await userManagement.registerUser(
        admin.address,
        "distributor@test.com",
        "hash6",
        7 // distributor
      );
      
      expect(await userManagement.isDistributor(admin.address)).to.be.true;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await userManagement.createRole("doctor");
      await userManagement.registerUser(
        user1.address,
        "test@example.com",
        "hash123",
        2
      );
    });

    it("Should return role name", async function () {
      expect(await userManagement.getRoleName(1)).to.equal("admin");
      expect(await userManagement.getRoleName(2)).to.equal("doctor");
    });

    it("Should check admin status", async function () {
      expect(await userManagement.isAdmin(owner.address)).to.be.true;
      expect(await userManagement.isAdmin(user1.address)).to.be.false;
    });

    it("Should get user by wallet", async function () {
      const user = await userManagement.getUser(user1.address);
      
      expect(user.id).to.equal(2);
      expect(user.wallet).to.equal(user1.address);
      expect(user.email).to.equal("test@example.com");
      expect(user.roleId).to.equal(2);
      expect(user.exists).to.be.true;
    });

    it("Should revert when getting non-existent user", async function () {
      await expect(
        userManagement.getUser(user2.address)
      ).to.be.revertedWith("User not registered");
    });
  });

  describe("Counters", function () {
    it("Should increment role counter", async function () {
      expect(await userManagement.roleCounter()).to.equal(1); // initial admin role
      
      await userManagement.createRole("doctor");
      expect(await userManagement.roleCounter()).to.equal(2);
      
      await userManagement.createRole("patient");
      expect(await userManagement.roleCounter()).to.equal(3);
    });

    it("Should increment user counter", async function () {
      await userManagement.createRole("doctor");
      
      expect(await userManagement.userCounter()).to.equal(1); // initial admin user
      
      await userManagement.registerUser(user1.address, "test1@example.com", "hash1", 2);
      expect(await userManagement.userCounter()).to.equal(2);
      
      await userManagement.registerUser(user2.address, "test2@example.com", "hash2", 2);
      expect(await userManagement.userCounter()).to.equal(3);
    });
  });
});