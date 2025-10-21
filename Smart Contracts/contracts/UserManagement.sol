// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UserManagement {
    // ---------------- Structs ----------------
    struct Role {
        uint id;
        string name;
    }

    enum Status { Pending, Active, Suspended }

    struct User {
        address wallet;
        uint roleId;
        Status status;
        bool exists;
    }

    // ---------------- State Variables ----------------
    uint public roleCounter;
    mapping(uint => Role) public roles;             // roleId → Role
    mapping(address => User) public users;          // wallet → User
    mapping(address => bool) public admins;         // admin → bool
    mapping(string => uint) private roleNameToId;   // roleName → roleId (reverse lookup)

    // ---------------- Constants ----------------
    string constant DOCTOR = "doctor";
    string constant PHARMACIST = "pharmacist";
    string constant PATIENT = "patient";
    string constant REGULATOR = "regulator";
    string constant MANUFACTURER = "manufacturer";
    string constant DISTRIBUTOR = "distributor";
    string constant ADMIN = "admin";

    // ---------------- Events ----------------
    event RoleCreated(uint indexed roleId, string name);
    event UserRegistered(address indexed wallet, uint roleId, Status status);
    event UserRoleUpdated(address indexed wallet, uint newRoleId);
    event UserStatusUpdated(address indexed wallet, Status newStatus);
    event UserRemoved(address indexed wallet);
    event AdminAdded(address indexed newAdmin);
    event AdminRemoved(address indexed removedAdmin);

    // ---------------- Modifiers ----------------
    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin can perform this action");
        _;
    }

    modifier userExists(address wallet) {
        require(users[wallet].exists, "User does not exist");
        _;
    }

    // ---------------- Constructor ----------------
    constructor() {
        // Create default admin role
        roleCounter++;
        roles[roleCounter] = Role(roleCounter, ADMIN);
        roleNameToId[ADMIN] = roleCounter;

        // Deployer becomes first admin
        admins[msg.sender] = true;
        users[msg.sender] = User(msg.sender, roleCounter, Status.Active, true);

        emit RoleCreated(roleCounter, ADMIN);
        emit UserRegistered(msg.sender, roleCounter, Status.Active);
        emit AdminAdded(msg.sender);

        // Preload default roles
        _createDefaultRoles();
    }

    // ---------------- Internal Helpers ----------------
    function _createDefaultRoles() internal {
        string[6] memory defaultRoles = [
            DOCTOR,
            PHARMACIST,
            PATIENT,
            REGULATOR,
            MANUFACTURER,
            DISTRIBUTOR
        ];

        for (uint i = 0; i < defaultRoles.length; i++) {
            roleCounter++;
            roles[roleCounter] = Role(roleCounter, defaultRoles[i]);
            roleNameToId[defaultRoles[i]] = roleCounter;
            emit RoleCreated(roleCounter, defaultRoles[i]);
        }
    }

    // ---------------- Role Management ----------------
    function createRole(string memory name) public onlyAdmin {
        bytes memory nameBytes = bytes(name);
        require(nameBytes.length > 0, "Role name cannot be empty");
        require(roleNameToId[name] == 0, "Role already exists");

        roleCounter++;
        roles[roleCounter] = Role(roleCounter, name);
        roleNameToId[name] = roleCounter;
        emit RoleCreated(roleCounter, name);
    }

    function getRoleName(uint roleId) public view returns (string memory) {
        require(roleId > 0 && roleId <= roleCounter, "Invalid role");
        return roles[roleId].name;
    }

    function getRoleIdByName(string memory name) public view returns (uint) {
        require(roleNameToId[name] != 0, "Role does not exist");
        return roleNameToId[name];
    }

    // ---------------- User Management ----------------
    function registerUser(address wallet, uint roleId) public onlyAdmin {
        require(wallet != address(0), "Invalid wallet address");
        require(!users[wallet].exists, "User already registered");
        require(roleId > 0 && roleId <= roleCounter, "Invalid role");

        users[wallet] = User(wallet, roleId, Status.Pending, true);

        if (keccak256(bytes(roles[roleId].name)) == keccak256(bytes(ADMIN))) {
            admins[wallet] = true;
            emit AdminAdded(wallet);
        }

        emit UserRegistered(wallet, roleId, Status.Pending);
    }

    function updateUserRole(address wallet, uint newRoleId)
        public
        onlyAdmin
        userExists(wallet)
    {
        require(newRoleId > 0 && newRoleId <= roleCounter, "Invalid role");
        users[wallet].roleId = newRoleId;

        bool isNowAdmin = keccak256(bytes(roles[newRoleId].name)) == keccak256(bytes(ADMIN));
        bool wasAdmin = admins[wallet];

        if (isNowAdmin && !wasAdmin) {
            admins[wallet] = true;
            emit AdminAdded(wallet);
        } else if (!isNowAdmin && wasAdmin) {
            admins[wallet] = false;
            emit AdminRemoved(wallet);
        }

        emit UserRoleUpdated(wallet, newRoleId);
    }

    function updateUserStatus(address wallet, Status newStatus)
        public
        onlyAdmin
        userExists(wallet)
    {
        users[wallet].status = newStatus;
        emit UserStatusUpdated(wallet, newStatus);
    }

    function removeUser(address wallet)
        public
        onlyAdmin
        userExists(wallet)
    {
        if (admins[wallet]) {
            admins[wallet] = false;
            emit AdminRemoved(wallet);
        }

        users[wallet].status = Status.Suspended;
        users[wallet].exists = false;
        emit UserRemoved(wallet);
    }

    // ---------------- Admin Management ----------------
    function addAdmin(address wallet)
        public
        onlyAdmin
        userExists(wallet)
    {
        require(!admins[wallet], "Already an admin");
        admins[wallet] = true;
        emit AdminAdded(wallet);
    }

    function removeAdmin(address wallet)
        public
        onlyAdmin
        userExists(wallet)
    {
        require(wallet != msg.sender, "Cannot remove self");
        require(admins[wallet], "Not an admin");

        admins[wallet] = false;
        emit AdminRemoved(wallet);
    }

    // ---------------- Views ----------------
    function isAdmin(address wallet) public view returns (bool) {
        return admins[wallet];
    }

    function getUserRole(address wallet)
        public
        view
        userExists(wallet)
        returns (string memory)
    {
        return roles[users[wallet].roleId].name;
    }

    function getUserStatus(address wallet)
        public
        view
        userExists(wallet)
        returns (string memory)
    {
        if (users[wallet].status == Status.Pending) return "pending";
        if (users[wallet].status == Status.Active) return "active";
        return "suspended";
    }

    // ---------------- Role Check Helpers ----------------
    function hasRole(address wallet, string memory roleName)
        public
        view
        userExists(wallet)
        returns (bool)
    {
        return keccak256(bytes(roles[users[wallet].roleId].name)) ==
               keccak256(bytes(roleName));
    }

    function isDoctor(address wallet) public view returns (bool) {
        return hasRole(wallet, DOCTOR);
    }

    function isPharmacist(address wallet) public view returns (bool) {
        return hasRole(wallet, PHARMACIST);
    }

    function isPatient(address wallet) public view returns (bool) {
        return hasRole(wallet, PATIENT);
    }

    function isRegulator(address wallet) public view returns (bool) {
        return hasRole(wallet, REGULATOR);
    }

    function isManufacturer(address wallet) public view returns (bool) {
        return hasRole(wallet, MANUFACTURER);
    }

    function isDistributor(address wallet) public view returns (bool) {
        return hasRole(wallet, DISTRIBUTOR);
    }
}
