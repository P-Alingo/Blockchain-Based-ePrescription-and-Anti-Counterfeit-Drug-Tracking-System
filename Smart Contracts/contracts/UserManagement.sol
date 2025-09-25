// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UserManagement {
    // Storage Variables
    mapping(address => string) public roles;
    mapping(address => bool) public admins;

    // Events
    event UserRegistered(address indexed user, string role);
    event UserRoleRemoved(address indexed user);
    event AdminAdded(address indexed newAdmin);
    event AdminRemoved(address indexed removedAdmin);

    // Modifiers
    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin can perform this action");
        _;
    }

    constructor() {
        admins[msg.sender] = true; // initial deployer is admin
        roles[msg.sender] = "admin";
    }

    // Add a new admin
    function addAdmin(address newAdmin) public onlyAdmin {
        require(!admins[newAdmin], "Already an admin");
        admins[newAdmin] = true;
        roles[newAdmin] = "admin";
        emit AdminAdded(newAdmin);
    }

    // Remove an admin
    function removeAdmin(address adminAddress) public onlyAdmin {
        require(admins[adminAddress], "Not an admin");
        require(adminAddress != msg.sender, "Cannot remove self");
        admins[adminAddress] = false;
        roles[adminAddress] = "";
        emit AdminRemoved(adminAddress);
    }

    // Register a user with a role
    function registerUser(address user, string memory role) public onlyAdmin {
        require(bytes(role).length > 0, "Role cannot be empty");
        require(
            keccak256(bytes(role)) == keccak256(bytes("doctor")) ||
            keccak256(bytes(role)) == keccak256(bytes("pharmacist")) ||
            keccak256(bytes(role)) == keccak256(bytes("patient")) ||
            keccak256(bytes(role)) == keccak256(bytes("regulator")) ||
            keccak256(bytes(role)) == keccak256(bytes("manufacturer")) ||
            keccak256(bytes(role)) == keccak256(bytes("admin")),
            "Invalid role"
        );
        require(bytes(roles[user]).length == 0, "User already registered");
        roles[user] = role;
        emit UserRegistered(user, role);
    }

    // Update a user's role
    function updateUserRole(address user, string memory newRole) public onlyAdmin {
        require(bytes(roles[user]).length != 0, "User not registered");
        require(
            keccak256(bytes(newRole)) == keccak256(bytes("doctor")) ||
            keccak256(bytes(newRole)) == keccak256(bytes("pharmacist")) ||
            keccak256(bytes(newRole)) == keccak256(bytes("patient")) ||
            keccak256(bytes(newRole)) == keccak256(bytes("regulator")) ||
            keccak256(bytes(newRole)) == keccak256(bytes("manufacturer")) ||
            keccak256(bytes(newRole)) == keccak256(bytes("admin")),
            "Invalid role"
        );
        roles[user] = newRole;
        if (keccak256(bytes(newRole)) == keccak256(bytes("admin"))) {
            admins[user] = true;
        } else {
            admins[user] = false;
        }
        emit UserRegistered(user, newRole);
    }

    // Deregister a user
    function removeUser(address user) public onlyAdmin {
        require(bytes(roles[user]).length != 0, "User not registered");
        if (admins[user]) {
            admins[user] = false;
        }
        roles[user] = "";
        emit UserRoleRemoved(user);
    }

    // Read user role
    function getUserRole(address user) public view returns (string memory) {
        return roles[user];
    }

    // Role-specific helpers
    function isDoctor(address user) public view returns (bool) {
        return keccak256(bytes(roles[user])) == keccak256(bytes("doctor"));
    }

    function isPharmacist(address user) public view returns (bool) {
        return keccak256(bytes(roles[user])) == keccak256(bytes("pharmacist"));
    }

    function isManufacturer(address user) public view returns (bool) {
        return keccak256(bytes(roles[user])) == keccak256(bytes("manufacturer"));
    }

    function isRegulator(address user) public view returns (bool) {
        return keccak256(bytes(roles[user])) == keccak256(bytes("regulator"));
    }

    function isPatient(address user) public view returns (bool) {
        return keccak256(bytes(roles[user])) == keccak256(bytes("patient"));
    }

    function isAdmin(address user) public view returns (bool) {
        return admins[user];
    }
}
