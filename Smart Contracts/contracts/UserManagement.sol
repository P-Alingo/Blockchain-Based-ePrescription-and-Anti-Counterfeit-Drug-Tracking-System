// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UserManagement {
    // ---------------- Structs ----------------
    struct Role {
        uint id;
        string name;
    }

    enum Status { Pending, Active, Suspended, Inactive }

    struct User {
        address wallet;
        uint roleId;
        Status status;
        bool exists;
        string metadata; // e.g., name, license number
    }

    // ---------------- State Variables ----------------
    uint public roleCounter;
    mapping(uint => Role) public roles;             // roleId → Role
    mapping(address => User) public users;          // wallet → User
    mapping(address => bool) public admins;         // admin → bool
    mapping(string => uint) private roleNameToId;   // roleName → roleId (reverse lookup)
    address[] public userList;                      // for getAllUsers

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
    event UserRegistered(address indexed wallet, uint roleId, Status status, string metadata);
    event UserRoleUpdated(address indexed wallet, uint newRoleId);
    event UserStatusUpdated(address indexed wallet, Status newStatus);
    event AdminAdded(address indexed newAdmin);
    event AdminRemoved(address indexed removedAdmin);
    event UserDeleted(address indexed wallet);
    event UserEdited(address indexed wallet, string metadata);
    event UserSynced(address indexed wallet);
    event UserViewed(address indexed wallet);
    event UserRestored(address indexed wallet);
    // ---------------- User Actions ----------------
    function deleteUser(address wallet) public onlyAdmin userExists(wallet) {
        require(!admins[wallet], "Cannot delete admin");
        users[wallet].exists = false;
        emit UserDeleted(wallet);
    }

    // Restore a previously deleted user (sets exists=true)
    function restoreUser(address wallet) public onlyAdmin {
        require(!users[wallet].exists, "User already exists");
        // Optionally, restore status to Pending or Active, here we use Pending
        users[wallet].exists = true;
        users[wallet].status = Status.Pending;
        emit UserRestored(wallet);
    }

    function editUser(address wallet, string memory metadata) public onlyAdmin userExists(wallet) {
        users[wallet].metadata = metadata;
        emit UserEdited(wallet, metadata);
    }

    function syncUser(address wallet) public onlyAdmin userExists(wallet) {
        emit UserSynced(wallet);
    }

    function viewUser(address wallet) public userExists(wallet) {
        emit UserViewed(wallet);
    }

    // ---------------- Modifiers ----------------
    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin can perform this action");
        _;
    }

    modifier onlyActiveUser() {
        require(users[msg.sender].exists, "User does not exist");
        require(users[msg.sender].status == Status.Active, "User is not active");
        _;
    }

    modifier userExists(address wallet) {
        require(users[wallet].exists, "User does not exist");
        _;
    }

    // ---------------- Constructor ----------------
    constructor() {
        // Deployer becomes first admin
        admins[msg.sender] = true;
        emit AdminAdded(msg.sender);

        // Create default admin role
        roleCounter++;
        roles[roleCounter] = Role(roleCounter, ADMIN);
        roleNameToId[ADMIN] = roleCounter;

        // Register deployer as admin
        users[msg.sender] = User(msg.sender, roleCounter, Status.Active, true, "Deployer Admin");
        userList.push(msg.sender);

        emit RoleCreated(roleCounter, ADMIN);
        emit UserRegistered(msg.sender, roleCounter, Status.Active, "Deployer Admin");

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
        require(bytes(name).length > 0, "Role name cannot be empty");
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

    // Store only wallet and role; ignore metadata
    users[wallet] = User(wallet, roleId, Status.Pending, true, ""); // empty string for metadata
    userList.push(wallet);

    // Auto-make admin if role is admin
    if (keccak256(bytes(roles[roleId].name)) == keccak256(bytes(ADMIN))) {
        admins[wallet] = true;
        emit AdminAdded(wallet);
    }

    // Emit event without metadata
    emit UserRegistered(wallet, roleId, Status.Pending, "");
}


    function updateUserRole(address wallet, uint newRoleId) public onlyAdmin userExists(wallet) {
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

    // ---------------- Status Management ----------------
    function approveUser(address wallet) public onlyAdmin userExists(wallet) {
        require(users[wallet].status == Status.Pending, "User not pending");
        users[wallet].status = Status.Active;
        emit UserStatusUpdated(wallet, Status.Active);
    }

    function suspendUser(address wallet) public userExists(wallet) {
        // Only admin or regulator can suspend
        require(admins[msg.sender] || hasRole(msg.sender, REGULATOR), "Not authorized");
        require(!admins[wallet], "Cannot suspend an admin");
        // Allow suspension from any status except admin
        users[wallet].status = Status.Suspended;
        emit UserStatusUpdated(wallet, Status.Suspended);
    }

    function deactivateUser(address wallet) public onlyAdmin userExists(wallet) {
        require(wallet != msg.sender, "Cannot deactivate self");
        require(!admins[wallet], "Cannot deactivate admin");
        // Allow deactivation from any status except admin/self
        users[wallet].status = Status.Inactive;
        emit UserStatusUpdated(wallet, Status.Inactive);
    }

    function reactivateUser(address wallet) public onlyAdmin userExists(wallet) {
        require(users[wallet].status == Status.Inactive || users[wallet].status == Status.Suspended, 
                "User must be inactive or suspended");
        users[wallet].status = Status.Active;
        emit UserStatusUpdated(wallet, Status.Active);
    }

    // ---------------- Admin Management ----------------
    function addAdmin(address wallet) public onlyAdmin userExists(wallet) {
        require(!admins[wallet], "Already an admin");
        admins[wallet] = true;
        emit AdminAdded(wallet);
    }

    function removeAdmin(address wallet) public onlyAdmin userExists(wallet) {
        require(wallet != msg.sender, "Cannot remove self");
        require(admins[wallet], "Not an admin");

        admins[wallet] = false;
        emit AdminRemoved(wallet);
    }

    // ---------------- Views ----------------
    function isAdmin(address wallet) public view returns (bool) {
        return admins[wallet];
    }

    function getUserRole(address wallet) public view userExists(wallet) returns (string memory) {
        return roles[users[wallet].roleId].name;
    }

    function getUserStatus(address wallet) public view userExists(wallet) returns (Status) {
        return users[wallet].status;
    }

    function getUserStatusString(address wallet) public view userExists(wallet) returns (string memory) {
        if (users[wallet].status == Status.Pending) return "pending";
        if (users[wallet].status == Status.Active) return "active";
        if (users[wallet].status == Status.Suspended) return "suspended";
        return "inactive";
    }

    function getUser(address wallet) public view userExists(wallet) returns (User memory) {
        return users[wallet];
    }

    function getAllUsers() public view onlyAdmin returns (User[] memory) {
        User[] memory all = new User[](userList.length);
        for (uint i = 0; i < userList.length; i++) {
            all[i] = users[userList[i]];
        }
        return all;
    }

    // ---------------- Role Check Helpers ----------------
    function hasRole(address wallet, string memory roleName) public view userExists(wallet) returns (bool) {
        return keccak256(bytes(roles[users[wallet].roleId].name)) == keccak256(bytes(roleName));
    }

    function isDoctor(address wallet) public view returns (bool) {
        return users[wallet].exists && hasRole(wallet, DOCTOR);
    }

    function isPharmacist(address wallet) public view returns (bool) {
        return users[wallet].exists && hasRole(wallet, PHARMACIST);
    }

    function isPatient(address wallet) public view returns (bool) {
        return users[wallet].exists && hasRole(wallet, PATIENT);
    }

    function isRegulator(address wallet) public view returns (bool) {
        return users[wallet].exists && hasRole(wallet, REGULATOR);
    }

    function isManufacturer(address wallet) public view returns (bool) {
        return users[wallet].exists && hasRole(wallet, MANUFACTURER);
    }

    function isDistributor(address wallet) public view returns (bool) {
        return users[wallet].exists && hasRole(wallet, DISTRIBUTOR);
    }

    // ---------------- Utility Functions ----------------
    function isUserActive(address wallet) public view returns (bool) {
        return users[wallet].exists && users[wallet].status == Status.Active;
    }

    function isUserSuspended(address wallet) public view returns (bool) {
        return users[wallet].exists && users[wallet].status == Status.Suspended;
    }

    function isUserPending(address wallet) public view returns (bool) {
        return users[wallet].exists && users[wallet].status == Status.Pending;
    }

    function isUserInactive(address wallet) public view returns (bool) {
        return users[wallet].exists && users[wallet].status == Status.Inactive;
    }
}