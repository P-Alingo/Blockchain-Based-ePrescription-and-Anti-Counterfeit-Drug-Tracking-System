// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UserManagement {
    struct Role {
        uint id;
        string name;
    }

    struct User {
        uint id;
        address wallet;
        string email;
        string passwordHash;
        uint roleId;
        bool exists;
    }

    uint public roleCounter;
    uint public userCounter;

    mapping(uint => Role) public roles;           // roleId => Role
    mapping(uint => User) public users;           // userId => User
    mapping(address => uint) public walletToUserId; // wallet => userId
    mapping(address => bool) public admins;

    string constant DOCTOR = "doctor";
    string constant PHARMACIST = "pharmacist";
    string constant PATIENT = "patient";
    string constant REGULATOR = "regulator";
    string constant MANUFACTURER = "manufacturer";
    string constant DISTRIBUTOR = "distributor";
    string constant ADMIN = "admin";

    event RoleCreated(uint indexed roleId, string name);
    event UserRegistered(uint indexed userId, address indexed wallet, uint roleId);
    event UserUpdated(uint indexed userId, uint newRoleId);
    event UserRemoved(uint indexed userId);
    event AdminAdded(address indexed newAdmin);
    event AdminRemoved(address indexed removedAdmin);

    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin can perform this action");
        _;
    }

    constructor() {
        // Initial admin setup
        admins[msg.sender] = true;

        // Create default "admin" role
        roleCounter++;
        roles[roleCounter] = Role(roleCounter, ADMIN);

        // Register deployer as admin
        userCounter++;
        users[userCounter] = User(userCounter, msg.sender, "", "", roleCounter, true);
        walletToUserId[msg.sender] = userCounter;

        emit RoleCreated(roleCounter, ADMIN);
        emit UserRegistered(userCounter, msg.sender, roleCounter);
    }

    // ---------------- Roles ----------------
    function createRole(string memory name) public onlyAdmin {
        roleCounter++;
        roles[roleCounter] = Role(roleCounter, name);
        emit RoleCreated(roleCounter, name);
    }

    function getRole(uint roleId) public view returns (Role memory) {
        return roles[roleId];
    }

    // ---------------- Users ----------------
    function registerUser(
        address wallet,
        string memory email,
        string memory passwordHash,
        uint roleId
    ) public onlyAdmin {
        require(wallet != address(0), "Invalid wallet address");
        require(walletToUserId[wallet] == 0, "User already registered");
        require(roleId > 0 && roleId <= roleCounter, "Invalid role");

        userCounter++;
        users[userCounter] = User(userCounter, wallet, email, passwordHash, roleId, true);
        walletToUserId[wallet] = userCounter;

        if (keccak256(bytes(roles[roleId].name)) == keccak256(bytes(ADMIN))) {
            admins[wallet] = true;
        }

        emit UserRegistered(userCounter, wallet, roleId);
    }

    function updateUserRole(address wallet, uint newRoleId) public onlyAdmin {
        uint userId = walletToUserId[wallet];
        require(userId != 0, "User not registered");
        require(newRoleId > 0 && newRoleId <= roleCounter, "Invalid role");

        users[userId].roleId = newRoleId;

        if (keccak256(bytes(roles[newRoleId].name)) == keccak256(bytes(ADMIN))) {
            admins[wallet] = true;
        } else {
            admins[wallet] = false;
        }

        emit UserUpdated(userId, newRoleId);
    }

    function removeUser(address wallet) public onlyAdmin {
        uint userId = walletToUserId[wallet];
        require(userId != 0, "User not registered");

        if (admins[wallet]) {
            admins[wallet] = false;
        }

        delete users[userId];
        delete walletToUserId[wallet];

        emit UserRemoved(userId);
    }

    // ---------------- Admin Management ----------------
    function addAdmin(address wallet) public onlyAdmin {
        uint userId = walletToUserId[wallet];
        require(userId != 0, "User must exist");
        admins[wallet] = true;
        emit AdminAdded(wallet);
    }

    function removeAdmin(address wallet) public onlyAdmin {
        require(wallet != msg.sender, "Cannot remove self");
        require(admins[wallet], "Not an admin");
        admins[wallet] = false;
        emit AdminRemoved(wallet);
    }

    // ---------------- Views ----------------
    function getUser(address wallet) public view returns (User memory) {
        uint userId = walletToUserId[wallet];
        require(userId != 0, "User not registered");
        return users[userId];
    }

    function isAdmin(address wallet) public view returns (bool) {
        return admins[wallet];
    }

    function getRoleName(uint roleId) public view returns (string memory) {
        return roles[roleId].name;
    }

    // ---------------- Role Checks ----------------
    function isDoctor(address wallet) public view returns (bool) {
        uint userId = walletToUserId[wallet];
        if (userId == 0) return false;
        return keccak256(bytes(roles[users[userId].roleId].name)) == keccak256(bytes(DOCTOR));
    }

    function isPharmacist(address wallet) public view returns (bool) {
        uint userId = walletToUserId[wallet];
        if (userId == 0) return false;
        return keccak256(bytes(roles[users[userId].roleId].name)) == keccak256(bytes(PHARMACIST));
    }

    function isPatient(address wallet) public view returns (bool) {
        uint userId = walletToUserId[wallet];
        if (userId == 0) return false;
        return keccak256(bytes(roles[users[userId].roleId].name)) == keccak256(bytes(PATIENT));
    }

    function isRegulator(address wallet) public view returns (bool) {
        uint userId = walletToUserId[wallet];
        if (userId == 0) return false;
        return keccak256(bytes(roles[users[userId].roleId].name)) == keccak256(bytes(REGULATOR));
    }

    function isManufacturer(address wallet) public view returns (bool) {
        uint userId = walletToUserId[wallet];
        if (userId == 0) return false;
        return keccak256(bytes(roles[users[userId].roleId].name)) == keccak256(bytes(MANUFACTURER));
    }

    function isDistributor(address wallet) public view returns (bool) {
        uint userId = walletToUserId[wallet];
        if (userId == 0) return false;
        return keccak256(bytes(roles[users[userId].roleId].name)) == keccak256(bytes(DISTRIBUTOR));
    }
}
