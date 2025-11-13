// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./UserManagement.sol";

contract DrugSupplyChain {
    // ---------------- Structs ----------------
    struct BatchDetails {
        uint databaseId;
        string batchNumber;
        uint drugId;
        string drugName;
        uint manufacturerId;
        uint quantity;
        uint manufactureDate;
        uint expiryDate;
        string storageTemperature;
        string manufacturingFacility;
        uint qualityControlOfficerId;
        uint dateChecked;
        string shipmentNumber;
        uint distributorCompanyId;
        uint distributorFacilityId;
        string qrCodePath;
    }

    struct Batch {
        uint batchId;
        BatchDetails details;
        address currentOwner;
        address manufacturer;
        bool isCounterfeit;
        bool exists;
        bool isDeleted;
        uint createdAt;
        uint updatedAt;
    }

    struct Transfer {
        uint transferId;
        uint batchId;
        address from;
        address to;
        uint timestamp;
        string shipmentNumber;
        string status;
        string blockchainTx;
    }

    enum ShipmentStatus { 
        InTransit, 
        Delivered, 
        Completed, 
        Cancelled, 
        Failed, 
        Flagged 
    }

    // ---------------- State Variables ----------------
    UserManagement public userManagement;
    
    mapping(uint => Batch) public batches;
    mapping(string => bool) public usedBatchNumbers;
    mapping(uint => Transfer[]) public batchTransfers;
    mapping(uint => address[]) public batchOwnershipHistory;
    mapping(address => uint[]) public manufacturerBatches;
    mapping(address => uint[]) public distributorBatches;
    mapping(address => uint[]) public pharmacistBatches;
    
    uint[] public allBatchIds;
    uint public batchCounter;
    uint public transferCounter;

    // ---------------- Events ----------------
    event BatchCreated(
        uint indexed batchId,
        uint indexed databaseId,
        address indexed manufacturer,
        string batchNumber,
        string drugName,
        uint quantity,
        uint expiryDate
    );
    
    event BatchTransferred(
        uint indexed transferId,
        uint indexed batchId,
        address indexed from,
        address to,
        string shipmentNumber,
        string status,
        uint timestamp
    );
    
    event BatchCounterfeit(
        uint indexed batchId,
        address indexed flaggedBy,
        string reason,
        uint timestamp
    );
    
    event ShipmentStatusUpdated(
        uint indexed batchId,
        string shipmentNumber,
        string newStatus,
        address updatedBy,
        uint timestamp
    );
    
    event BatchBlockchainTxUpdated(
        uint indexed batchId,
        string batchNumber,
        string transactionHash,
        uint timestamp
    );

    // ---------------- Modifiers ----------------
    modifier onlyManufacturer() {
        require(userManagement.isManufacturer(msg.sender), "Only manufacturers can perform this action");
        require(userManagement.isUserActive(msg.sender), "Manufacturer must be active");
        _;
    }

    modifier onlyDistributor() {
        require(userManagement.isDistributor(msg.sender), "Only distributors can perform this action");
        require(userManagement.isUserActive(msg.sender), "Distributor must be active");
        _;
    }

    modifier onlyPharmacist() {
        require(userManagement.isPharmacist(msg.sender), "Only pharmacists can perform this action");
        require(userManagement.isUserActive(msg.sender), "Pharmacist must be active");
        _;
    }

    modifier onlyAdmin() {
        require(userManagement.isAdmin(msg.sender), "Only admin can perform this action");
        _;
    }

    modifier onlyRegulator() {
        require(userManagement.isRegulator(msg.sender), "Only regulator can perform this action");
        _;
    }

    modifier batchExists(uint batchId) {
        require(batches[batchId].exists, "Batch not found");
        require(!batches[batchId].isDeleted, "Batch is deleted");
        _;
    }

    modifier onlyBatchOwner(uint batchId) {
        require(batches[batchId].currentOwner == msg.sender, "Not the batch owner");
        _;
    }

    modifier notCounterfeit(uint batchId) {
        require(!batches[batchId].isCounterfeit, "Batch is flagged as counterfeit");
        _;
    }

    // ---------------- Constructor ----------------
    constructor(address _userManagementAddress) {
        userManagement = UserManagement(_userManagementAddress);
    }

    // ---------------- Core Functions ----------------

    /**
     * @dev Create a new drug batch (Manufacturer only)
     */
    function createBatch(
        uint databaseId,
        string memory batchNumber,
        uint drugId,
        string memory drugName,
        uint manufacturerId,
        uint quantity,
        uint manufactureDate,
        uint expiryDate,
        string memory storageTemperature,
        string memory manufacturingFacility,
        uint qualityControlOfficerId,
        uint dateChecked,
        string memory shipmentNumber,
        uint distributorCompanyId,
        uint distributorFacilityId,
        string memory qrCodePath
    ) public onlyManufacturer {
        // Validate batch number uniqueness
        require(bytes(batchNumber).length > 0, "Batch number required");
        require(!usedBatchNumbers[batchNumber], "Duplicate batch number");
        
        // Validate required fields
        require(drugId > 0, "Drug ID required");
        require(bytes(drugName).length > 0, "Drug name required");
        require(quantity > 0, "Quantity must be greater than 0");
        require(expiryDate > block.timestamp, "Expiry date must be in the future");
        require(manufactureDate <= block.timestamp, "Manufacture date cannot be in the future");

        // Generate batch ID
        batchCounter++;
        uint batchId = batchCounter;

        // Create batch details
        BatchDetails memory details = BatchDetails({
            databaseId: databaseId,
            batchNumber: batchNumber,
            drugId: drugId,
            drugName: drugName,
            manufacturerId: manufacturerId,
            quantity: quantity,
            manufactureDate: manufactureDate,
            expiryDate: expiryDate,
            storageTemperature: storageTemperature,
            manufacturingFacility: manufacturingFacility,
            qualityControlOfficerId: qualityControlOfficerId,
            dateChecked: dateChecked,
            shipmentNumber: shipmentNumber,
            distributorCompanyId: distributorCompanyId,
            distributorFacilityId: distributorFacilityId,
            qrCodePath: qrCodePath
        });

        uint currentTime = block.timestamp;

        // Create batch
        batches[batchId] = Batch({
            batchId: batchId,
            details: details,
            currentOwner: msg.sender,
            manufacturer: msg.sender,
            isCounterfeit: false,
            exists: true,
            isDeleted: false,
            createdAt: currentTime,
            updatedAt: currentTime
        });

        // Update mappings
        usedBatchNumbers[batchNumber] = true;
        manufacturerBatches[msg.sender].push(batchId);
        batchOwnershipHistory[batchId].push(msg.sender);
        allBatchIds.push(batchId);

        emit BatchCreated(
            batchId,
            databaseId,
            msg.sender,
            batchNumber,
            drugName,
            quantity,
            expiryDate
        );
    }

    /**
     * @dev Transfer batch to another entity (Manufacturer → Distributor → Pharmacist)
     */
    function transferBatch(
        uint batchId,
        address to,
        string memory shipmentNumber,
        string memory status
    ) public 
        batchExists(batchId)
        onlyBatchOwner(batchId)
        notCounterfeit(batchId)
    {
        // Validate recipient
        require(to != address(0), "Invalid recipient address");
        require(to != msg.sender, "Cannot transfer to self");
        
        // Validate recipient role and active status
        require(
            userManagement.isDistributor(to) || userManagement.isPharmacist(to),
            "Recipient must be distributor or pharmacist"
        );
        require(userManagement.isUserActive(to), "Recipient must be active");

        // Validate transfer chain
        _validateTransferChain(msg.sender, to);

        Batch storage batch = batches[batchId];
        
        // Update batch ownership
        address previousOwner = batch.currentOwner;
        batch.currentOwner = to;
        batch.updatedAt = block.timestamp;

        // Create transfer record
        transferCounter++;
        uint transferId = transferCounter;
        
        Transfer memory newTransfer = Transfer({
            transferId: transferId,
            batchId: batchId,
            from: previousOwner,
            to: to,
            timestamp: block.timestamp,
            shipmentNumber: shipmentNumber,
            status: status,
            blockchainTx: ""
        });

        batchTransfers[batchId].push(newTransfer);
        batchOwnershipHistory[batchId].push(to);

        // Update recipient batches
        if (userManagement.isDistributor(to)) {
            distributorBatches[to].push(batchId);
        } else if (userManagement.isPharmacist(to)) {
            pharmacistBatches[to].push(batchId);
        }

        emit BatchTransferred(
            transferId,
            batchId,
            previousOwner,
            to,
            shipmentNumber,
            status,
            block.timestamp
        );
    }

    /**
     * @dev Mark batch as counterfeit (Distributor or Pharmacist only)
     */
    function markBatchAsCounterfeit(uint batchId, string memory reason) 
        public 
        batchExists(batchId) 
    {
        // Only current owner (distributor/pharmacist) or regulator can flag
        require(
            batches[batchId].currentOwner == msg.sender || 
            userManagement.isRegulator(msg.sender),
            "Only batch owner or regulator can flag as counterfeit"
        );

        require(bytes(reason).length > 0, "Reason required");

        Batch storage batch = batches[batchId];
        batch.isCounterfeit = true;
        batch.updatedAt = block.timestamp;

        emit BatchCounterfeit(
            batchId,
            msg.sender,
            reason,
            block.timestamp
        );
    }

    /**
     * @dev Update shipment status
     */
    function updateShipmentStatus(
        uint batchId,
        string memory shipmentNumber,
        string memory newStatus
    ) public 
        batchExists(batchId)
        onlyBatchOwner(batchId)
    {
        require(bytes(shipmentNumber).length > 0, "Shipment number required");
        require(bytes(newStatus).length > 0, "Status required");

        // Find and update the transfer record
        bool found = false;
        for (uint i = 0; i < batchTransfers[batchId].length; i++) {
            if (keccak256(bytes(batchTransfers[batchId][i].shipmentNumber)) == keccak256(bytes(shipmentNumber))) {
                batchTransfers[batchId][i].status = newStatus;
                found = true;
                break;
            }
        }

        require(found, "Shipment not found for this batch");

        batches[batchId].updatedAt = block.timestamp;

        emit ShipmentStatusUpdated(
            batchId,
            shipmentNumber,
            newStatus,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Update blockchain transaction hash for batch
     */
    function updateBatchBlockchainTx(uint batchId, string memory transactionHash) 
        public 
        batchExists(batchId)
    {
        require(
            batches[batchId].currentOwner == msg.sender || 
            batches[batchId].manufacturer == msg.sender ||
            userManagement.isAdmin(msg.sender),
            "Not authorized to update transaction"
        );

        batches[batchId].updatedAt = block.timestamp;

        emit BatchBlockchainTxUpdated(
            batchId,
            batches[batchId].details.batchNumber,
            transactionHash,
            block.timestamp
        );
    }

    // ---------------- View Functions ----------------

    /**
     * @dev Get batch details
     */
    function getBatch(uint batchId) 
        public 
        view 
        batchExists(batchId) 
        returns (Batch memory) 
    {
        Batch memory batch = batches[batchId];
        
        // Authorization check
        require(
            batch.currentOwner == msg.sender ||
            batch.manufacturer == msg.sender ||
            userManagement.isAdmin(msg.sender) ||
            userManagement.isRegulator(msg.sender),
            "Not authorized to view this batch"
        );
        
        return batch;
    }

    /**
     * @dev Get batch by batch number
     */
    function getBatchByNumber(string memory batchNumber) 
        public 
        view 
        returns (Batch memory) 
    {
        for (uint i = 0; i < allBatchIds.length; i++) {
            Batch memory batch = batches[allBatchIds[i]];
            if (batch.exists && 
                !batch.isDeleted && 
                keccak256(bytes(batch.details.batchNumber)) == keccak256(bytes(batchNumber))) {
                
                // Authorization check
                require(
                    batch.currentOwner == msg.sender ||
                    batch.manufacturer == msg.sender ||
                    userManagement.isAdmin(msg.sender) ||
                    userManagement.isRegulator(msg.sender),
                    "Not authorized to view this batch"
                );
                
                return batch;
            }
        }
        
        revert("Batch not found");
    }

    /**
     * @dev Get all transfers for a batch
     */
    function getBatchTransfers(uint batchId) 
        public 
        view 
        batchExists(batchId) 
        returns (Transfer[] memory) 
    {
        Batch memory batch = batches[batchId];
        
        require(
            batch.currentOwner == msg.sender ||
            batch.manufacturer == msg.sender ||
            userManagement.isAdmin(msg.sender) ||
            userManagement.isRegulator(msg.sender),
            "Not authorized to view batch transfers"
        );
        
        return batchTransfers[batchId];
    }

    /**
     * @dev Get batches created by a manufacturer
     */
    function getBatchesByManufacturer(address manufacturer) 
        public 
        view 
        returns (Batch[] memory) 
    {
        require(
            manufacturer == msg.sender || 
            userManagement.isAdmin(msg.sender) || 
            userManagement.isRegulator(msg.sender),
            "Not authorized"
        );

        uint[] memory mfgBatches = manufacturerBatches[manufacturer];
        return _getValidBatches(mfgBatches);
    }

    /**
     * @dev Get batches owned by a distributor
     */
    function getBatchesByDistributor(address distributor) 
        public 
        view 
        returns (Batch[] memory) 
    {
        require(
            distributor == msg.sender || 
            userManagement.isAdmin(msg.sender) || 
            userManagement.isRegulator(msg.sender),
            "Not authorized"
        );

        uint[] memory distBatches = distributorBatches[distributor];
        return _getValidBatches(distBatches);
    }

    /**
     * @dev Get batches owned by a pharmacist
     */
    function getBatchesByPharmacist(address pharmacist) 
        public 
        view 
        returns (Batch[] memory) 
    {
        require(
            pharmacist == msg.sender || 
            userManagement.isAdmin(msg.sender) || 
            userManagement.isRegulator(msg.sender),
            "Not authorized"
        );

        uint[] memory pharmaBatches = pharmacistBatches[pharmacist];
        return _getValidBatches(pharmaBatches);
    }

    /**
     * @dev Get all batches (Admin/Regulator only)
     */
    function getAllBatches() 
        public 
        view 
        returns (Batch[] memory) 
    {
        require(
            userManagement.isAdmin(msg.sender) || 
            userManagement.isRegulator(msg.sender),
            "Only admin or regulator can view all batches"
        );

        return _getValidBatches(allBatchIds);
    }

    /**
     * @dev Get batches flagged as counterfeit
     */
    function getFlaggedBatches() 
        public 
        view 
        returns (Batch[] memory) 
    {
        require(
            userManagement.isAdmin(msg.sender) || 
            userManagement.isRegulator(msg.sender),
            "Only admin or regulator can view flagged batches"
        );

        uint flaggedCount = 0;
        
        // Count flagged batches
        for (uint i = 0; i < allBatchIds.length; i++) {
            if (batches[allBatchIds[i]].exists && 
                !batches[allBatchIds[i]].isDeleted &&
                batches[allBatchIds[i]].isCounterfeit) {
                flaggedCount++;
            }
        }
        
        // Create array with exact size
        Batch[] memory result = new Batch[](flaggedCount);
        uint currentIndex = 0;
        
        for (uint i = 0; i < allBatchIds.length; i++) {
            if (batches[allBatchIds[i]].exists && 
                !batches[allBatchIds[i]].isDeleted &&
                batches[allBatchIds[i]].isCounterfeit) {
                result[currentIndex] = batches[allBatchIds[i]];
                currentIndex++;
            }
        }
        
        return result;
    }

    /**
     * @dev Get batch ownership history
     */
    function getBatchOwnershipHistory(uint batchId) 
        public 
        view 
        batchExists(batchId) 
        returns (address[] memory) 
    {
        Batch memory batch = batches[batchId];
        
        require(
            batch.currentOwner == msg.sender ||
            batch.manufacturer == msg.sender ||
            userManagement.isAdmin(msg.sender) ||
            userManagement.isRegulator(msg.sender),
            "Not authorized to view ownership history"
        );
        
        return batchOwnershipHistory[batchId];
    }

    /**
     * @dev Verify batch authenticity
     */
    function verifyBatchAuthenticity(uint batchId) 
        public 
        view 
        batchExists(batchId) 
        returns (bool) 
    {
        Batch memory batch = batches[batchId];
        
        // Check if batch is not counterfeit
        if (batch.isCounterfeit) {
            return false;
        }
        
        // Check if batch has valid transfer chain
        if (batchTransfers[batchId].length == 0) {
            return false; // No transfers recorded
        }
        
        // Verify transfer chain follows manufacturer → distributor → pharmacist
        return _isValidTransferChain(batchId);
    }

    /**
     * @dev Detect anomalies in supply chain
     */
    function detectAnomalies(uint batchId) 
        public 
        view 
        batchExists(batchId) 
        returns (string[] memory) 
    {
        require(
            userManagement.isAdmin(msg.sender) || 
            userManagement.isRegulator(msg.sender),
            "Only admin or regulator can detect anomalies"
        );

        string[] memory anomalies = new string[](5); // Max 5 anomalies
        uint anomalyCount = 0;

        Batch memory batch = batches[batchId];
        Transfer[] memory transfers = batchTransfers[batchId];

        // Check for missing manufacturer
        if (batch.manufacturer == address(0)) {
            anomalies[anomalyCount++] = "Missing manufacturer";
        }

        // Check for direct manufacturer to pharmacist transfer (skipping distributor)
        bool hasDistributor = false;
        for (uint i = 0; i < transfers.length; i++) {
            if (userManagement.isDistributor(transfers[i].to)) {
                hasDistributor = true;
                break;
            }
        }
        
        if (!hasDistributor && userManagement.isPharmacist(batch.currentOwner)) {
            anomalies[anomalyCount++] = "Direct manufacturer to pharmacist transfer";
        }

        // Check for expired batch
        if (block.timestamp > batch.details.expiryDate) {
            anomalies[anomalyCount++] = "Batch expired";
        }

        // Check for counterfeit batch
        if (batch.isCounterfeit) {
            anomalies[anomalyCount++] = "Batch flagged as counterfeit";
        }

        // Check for incomplete transfer chain
        if (transfers.length < 1) {
            anomalies[anomalyCount++] = "Incomplete transfer chain";
        }

        // Resize array to actual anomaly count
        string[] memory finalAnomalies = new string[](anomalyCount);
        for (uint i = 0; i < anomalyCount; i++) {
            finalAnomalies[i] = anomalies[i];
        }

        return finalAnomalies;
    }

    // ---------------- Utility Functions ----------------

    /**
     * @dev Check if address is current batch owner
     */
    function isBatchOwner(uint batchId, address wallet) 
        public 
        view 
        batchExists(batchId) 
        returns (bool) 
    {
        return batches[batchId].currentOwner == wallet;
    }

    /**
     * @dev Check if batch is expired
     */
    function isBatchExpired(uint batchId) 
        public 
        view 
        batchExists(batchId) 
        returns (bool) 
    {
        return block.timestamp > batches[batchId].details.expiryDate;
    }

    /**
     * @dev Get current batch owner
     */
    function getCurrentBatchOwner(uint batchId) 
        public 
        view 
        batchExists(batchId) 
        returns (address) 
    {
        Batch memory batch = batches[batchId];
        
        require(
            batch.currentOwner == msg.sender ||
            batch.manufacturer == msg.sender ||
            userManagement.isAdmin(msg.sender) ||
            userManagement.isRegulator(msg.sender),
            "Not authorized to view batch owner"
        );
        
        return batch.currentOwner;
    }

    // ---------------- Internal Helpers ----------------

    function _validateTransferChain(address from, address to) internal view {
        // Manufacturer can only transfer to Distributor
        if (userManagement.isManufacturer(from)) {
            require(userManagement.isDistributor(to), "Manufacturer can only transfer to Distributor");
        }
        // Distributor can transfer to Pharmacist or another Distributor
        else if (userManagement.isDistributor(from)) {
            require(
                userManagement.isPharmacist(to) || userManagement.isDistributor(to),
                "Distributor can only transfer to Pharmacist or another Distributor"
            );
        }
        // Pharmacist cannot transfer (end of chain)
        else if (userManagement.isPharmacist(from)) {
            revert("Pharmacist cannot transfer batches");
        }
    }

    function _isValidTransferChain(uint batchId) internal view returns (bool) {
        address[] memory owners = batchOwnershipHistory[batchId];
        
        if (owners.length < 2) return false; // Must have at least manufacturer + one transfer
        
        // First owner must be manufacturer
        if (!userManagement.isManufacturer(owners[0])) {
            return false;
        }
        
        // Check transfer sequence
        for (uint i = 1; i < owners.length; i++) {
            address previous = owners[i - 1];
            address current = owners[i];
            
            if (userManagement.isManufacturer(previous)) {
                if (!userManagement.isDistributor(current)) return false;
            } else if (userManagement.isDistributor(previous)) {
                if (!userManagement.isPharmacist(current) && !userManagement.isDistributor(current)) return false;
            } else if (userManagement.isPharmacist(previous)) {
                return false; // Pharmacist shouldn't transfer
            }
        }
        
        return true;
    }

    function _getValidBatches(uint[] memory batchIds) 
        internal 
        view 
        returns (Batch[] memory) 
    {
        uint validCount = 0;
        
        // Count valid batches
        for (uint i = 0; i < batchIds.length; i++) {
            if (batches[batchIds[i]].exists && !batches[batchIds[i]].isDeleted) {
                validCount++;
            }
        }
        
        // Create array with exact size
        Batch[] memory result = new Batch[](validCount);
        uint currentIndex = 0;
        
        for (uint i = 0; i < batchIds.length; i++) {
            if (batches[batchIds[i]].exists && !batches[batchIds[i]].isDeleted) {
                result[currentIndex] = batches[batchIds[i]];
                currentIndex++;
            }
        }
        
        return result;
    }
}