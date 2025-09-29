// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./UserManagement.sol";

contract DrugSupplyChain {
    UserManagement public userManagement;
    uint public batchCounter;
    uint public dispenseCounter;

    string constant MANUFACTURER = "manufacturer";
    string constant DISTRIBUTOR = "distributor";
    string constant PHARMACIST = "pharmacist";

    struct Batch {
        uint id;
        uint manufacturerUserId; // references Users.id
        uint drugId;             // references Drug.id
        uint currentOwnerUserId; // references Users.id
        string status;           // "Manufactured", "In Transit", "At Pharmacy"
        string ipfsHash;
        uint256 manufactureDate;
        uint256 timestamp;
    }

    struct DispenseRecord {
        uint id;
        uint prescriptionId;   // references Prescription.id
        uint pharmacistUserId; // references Users.id
        uint batchId;          // references DrugBatch.id
        uint quantity;
        uint256 dispensedAt;
        string blockchainTx;
    }

    mapping(uint => Batch) public batches;
    mapping(uint => uint[]) public batchHistory; // ownership history
    mapping(uint => DispenseRecord) public dispenseRecords;

    // Events
    event BatchRegistered(uint batchId, uint manufacturerUserId, uint drugId);
    event BatchTransferred(uint batchId, uint fromUserId, uint toUserId, string status);
    event PrescriptionDispensed(uint dispenseId, uint prescriptionId, uint pharmacistUserId, uint batchId, uint quantity);

    // Modifiers
    modifier onlyManufacturer() {
        uint userId = userManagement.walletToUserId(msg.sender);
        require(userId != 0, "User not registered");
        require(
            keccak256(bytes(userManagement.getRoleName(userManagement.getUser(msg.sender).roleId))) == keccak256(bytes(MANUFACTURER)),
            "Only manufacturers can perform this action"
        );
        _;
    }

    modifier onlyCurrentOwner(uint batchId) {
        uint userId = userManagement.walletToUserId(msg.sender);
        require(batches[batchId].currentOwnerUserId == userId, "Only current owner can transfer batch");
        _;
    }

    modifier onlyPharmacist() {
        uint userId = userManagement.walletToUserId(msg.sender);
        require(userId != 0, "User not registered");
        require(
            keccak256(bytes(userManagement.getRoleName(userManagement.getUser(msg.sender).roleId))) == keccak256(bytes(PHARMACIST)),
            "Only pharmacists can perform this action"
        );
        _;
    }

    modifier validBatch(uint batchId) {
        require(batchId > 0 && batchId <= batchCounter, "Invalid batch ID");
        _;
    }

    constructor(address _userManagementAddress) {
        userManagement = UserManagement(_userManagementAddress);
        batchCounter = 0;
        dispenseCounter = 0;
    }

    // ---------------- Register a new batch ----------------
    function registerBatch(uint drugId, string memory ipfsHash, uint manufactureDate) public onlyManufacturer {
        require(drugId > 0, "Invalid drug ID");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");

        batchCounter++;
        uint manufacturerUserId = userManagement.walletToUserId(msg.sender);

        batches[batchCounter] = Batch({
            id: batchCounter,
            manufacturerUserId: manufacturerUserId,
            drugId: drugId,
            currentOwnerUserId: manufacturerUserId,
            status: "Manufactured",
            ipfsHash: ipfsHash,
            manufactureDate: manufactureDate,
            timestamp: block.timestamp
        });

        batchHistory[batchCounter].push(manufacturerUserId);

        emit BatchRegistered(batchCounter, manufacturerUserId, drugId);
    }

    // ---------------- Transfer batch ----------------
    function transferBatch(uint batchId, address newOwnerWallet) public validBatch(batchId) onlyCurrentOwner(batchId) {
        require(newOwnerWallet != address(0), "Invalid new owner address");

        uint newOwnerUserId = userManagement.walletToUserId(newOwnerWallet);
        require(newOwnerUserId != batches[batchId].currentOwnerUserId, "Cannot transfer to current owner");

        uint previousOwnerUserId = batches[batchId].currentOwnerUserId;
        batches[batchId].currentOwnerUserId = newOwnerUserId;

        // Update status based on role
        string memory newStatus;
        string memory roleName = userManagement.getRoleName(userManagement.getUser(newOwnerWallet).roleId);

        if (keccak256(bytes(roleName)) == keccak256(bytes(PHARMACIST))) {
            newStatus = "At Pharmacy";
        } else if (keccak256(bytes(roleName)) == keccak256(bytes(DISTRIBUTOR))) {
            newStatus = "In Transit";
        } else {
            newStatus = "Transferred";
        }

        batches[batchId].status = newStatus;
        batchHistory[batchId].push(newOwnerUserId);

        emit BatchTransferred(batchId, previousOwnerUserId, newOwnerUserId, newStatus);
    }

    // ---------------- Track a batch ----------------
    function trackBatch(uint batchId) public view validBatch(batchId) returns (
        uint id,
        uint manufacturerUserId,
        uint drugId,
        uint currentOwnerUserId,
        string memory status,
        string memory ipfsHash,
        uint256 manufactureDate,
        uint256 timestamp,
        uint[] memory ownershipHistory
    ) {
        Batch memory batch = batches[batchId];
        return (
            batch.id,
            batch.manufacturerUserId,
            batch.drugId,
            batch.currentOwnerUserId,
            batch.status,
            batch.ipfsHash,
            batch.manufactureDate,
            batch.timestamp,
            batchHistory[batchId]
        );
    }

    // ---------------- Dispense a prescription ----------------
    function dispensePrescription(uint prescriptionId, uint batchId, uint quantity, string memory blockchainTx) public onlyPharmacist validBatch(batchId) {
        require(quantity > 0, "Quantity must be positive");

        uint pharmacistUserId = userManagement.walletToUserId(msg.sender);
        dispenseCounter++;

        dispenseRecords[dispenseCounter] = DispenseRecord({
            id: dispenseCounter,
            prescriptionId: prescriptionId,
            pharmacistUserId: pharmacistUserId,
            batchId: batchId,
            quantity: quantity,
            dispensedAt: block.timestamp,
            blockchainTx: blockchainTx
        });

        emit PrescriptionDispensed(dispenseCounter, prescriptionId, pharmacistUserId, batchId, quantity);
    }

    // ---------------- Getters ----------------
    function getBatch(uint batchId) public view validBatch(batchId) returns (Batch memory) {
        return batches[batchId];
    }

    function getDispenseRecord(uint dispenseId) public view returns (DispenseRecord memory) {
        return dispenseRecords[dispenseId];
    }
}
