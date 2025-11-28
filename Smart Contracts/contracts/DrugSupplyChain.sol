// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DrugSupplyChain {
    address public admin;

    constructor(address _admin) {
        admin = _admin;
    }

    // Optional: allow changing admin
    function setAdmin(address _admin) public {
        require(msg.sender == admin, "Only admin can change admin");
        admin = _admin;
    }

    // --- Structs ---
    struct DrugBatch {
        uint batchId;
        uint manufacturerId;
        uint drugId;
        string batchNumber;
        uint manufactureDate;
        uint expiryDate;
        uint quantity;
        string storageTemperature;
        string manufacturingFacility;
        uint qualityControlOfficerId;
        uint dateChecked;
        bool isDeleted;
        uint createdAt;
        uint deletedAt;
    }

    struct BatchRequest {
        uint requestId;
        uint batchId;
        address pharmacist;
        uint quantityRequested;
        uint drugId;
        uint distributorId;
        string status;
        bool isDeleted;
        uint createdAt;
        uint deletedAt;
    }

    struct Shipment {
        uint shipmentId;
        uint batchId;
        address distributor;
        address pharmacist;
        string status;
        bool isDeleted;
        uint createdAt;
        uint deletedAt;
    }

    // --- Storage ---
    mapping(uint => DrugBatch) public drugBatches;
    mapping(uint => BatchRequest) public batchRequests;
    mapping(uint => Shipment) public shipments;

    // --- Events ---
    event DrugBatchCreated(
        uint indexed batchId,
        uint manufacturerId,
        uint drugId,
        string batchNumber,
        uint manufactureDate,
        uint expiryDate,
        uint quantity,
        string storageTemperature,
        string manufacturingFacility,
        uint qualityControlOfficerId,
        uint dateChecked,
        uint timestamp
    );
    event DrugBatchEdited(
        uint indexed batchId,
        uint manufacturerId,
        uint drugId,
        string batchNumber,
        uint manufactureDate,
        uint expiryDate,
        uint quantity,
        string storageTemperature,
        string manufacturingFacility,
        uint qualityControlOfficerId,
        uint dateChecked,
        uint timestamp
    );
    event DrugBatchDeleted(
        uint indexed batchId,
        uint manufacturerId,
        uint drugId,
        string batchNumber,
        uint timestamp
    );

    event BatchRequested(
        uint indexed requestId,
        uint indexed batchId,
        address indexed pharmacist,
        uint quantityRequested,
        uint drugId,
        uint distributorId,
        uint timestamp
    );
    event BatchRequestEdited(
        uint indexed requestId,
        uint indexed batchId,
        address indexed pharmacist,
        uint quantityRequested,
        uint drugId,
        uint distributorId,
        string status,
        uint timestamp
    );
    event BatchRequestDeleted(
        uint indexed requestId,
        uint indexed batchId,
        address indexed pharmacist,
        uint drugId,
        uint timestamp
    );
    event BatchRequestStatusUpdated(
        uint indexed requestId,
        string oldStatus,
        string newStatus,
        uint timestamp
    );

    event ShipmentCreated(
        uint indexed shipmentId,
        uint indexed batchId,
        address indexed distributor,
        address pharmacist,
        string status,
        uint timestamp
    );
    event ShipmentEdited(
        uint indexed shipmentId,
        uint indexed batchId,
        address indexed distributor,
        address pharmacist,
        string status,
        uint timestamp
    );
    event ShipmentDeleted(
        uint indexed shipmentId,
        uint indexed batchId,
        address indexed distributor,
        address pharmacist,
        uint timestamp
    );
    event ShipmentStatusUpdated(
        uint indexed shipmentId,
        string oldStatus,
        string newStatus,
        uint timestamp
    );

    // --- DrugBatch Logic ---
    function createDrugBatch(
        uint batchId,
        uint manufacturerId,
        uint drugId,
        string memory batchNumber,
        uint manufactureDate,
        uint expiryDate,
        uint quantity,
        string memory storageTemperature,
        string memory manufacturingFacility,
        uint qualityControlOfficerId,
        uint dateChecked
    ) public {
        require(drugBatches[batchId].batchId == 0, "Batch exists");
        drugBatches[batchId] = DrugBatch({
            batchId: batchId,
            manufacturerId: manufacturerId,
            drugId: drugId,
            batchNumber: batchNumber,
            manufactureDate: manufactureDate,
            expiryDate: expiryDate,
            quantity: quantity,
            storageTemperature: storageTemperature,
            manufacturingFacility: manufacturingFacility,
            qualityControlOfficerId: qualityControlOfficerId,
            dateChecked: dateChecked,
            isDeleted: false,
            createdAt: block.timestamp,
            deletedAt: 0
        });

        emit DrugBatchCreated(
            batchId,
            manufacturerId,
            drugId,
            batchNumber,
            manufactureDate,
            expiryDate,
            quantity,
            storageTemperature,
            manufacturingFacility,
            qualityControlOfficerId,
            dateChecked,
            block.timestamp
        );
    }

    function editDrugBatch(
        uint batchId,
        uint manufacturerId,
        uint drugId,
        string memory batchNumber,
        uint manufactureDate,
        uint expiryDate,
        uint quantity,
        string memory storageTemperature,
        string memory manufacturingFacility,
        uint qualityControlOfficerId,
        uint dateChecked
    ) public {
        DrugBatch storage batch = drugBatches[batchId];
        require(batch.batchId == batchId, "Not found");
        require(!batch.isDeleted, "Deleted");

        batch.manufacturerId = manufacturerId;
        batch.drugId = drugId;
        batch.batchNumber = batchNumber;
        batch.manufactureDate = manufactureDate;
        batch.expiryDate = expiryDate;
        batch.quantity = quantity;
        batch.storageTemperature = storageTemperature;
        batch.manufacturingFacility = manufacturingFacility;
        batch.qualityControlOfficerId = qualityControlOfficerId;
        batch.dateChecked = dateChecked;

        emit DrugBatchEdited(
            batchId,
            manufacturerId,
            drugId,
            batchNumber,
            manufactureDate,
            expiryDate,
            quantity,
            storageTemperature,
            manufacturingFacility,
            qualityControlOfficerId,
            dateChecked,
            block.timestamp
        );
    }

    function deleteDrugBatch(uint batchId) public {
        DrugBatch storage batch = drugBatches[batchId];
        require(batch.batchId == batchId, "Not found");
        require(!batch.isDeleted, "Already deleted");

        batch.isDeleted = true;
        batch.deletedAt = block.timestamp;

        emit DrugBatchDeleted(
            batchId,
            batch.manufacturerId,
            batch.drugId,
            batch.batchNumber,
            block.timestamp
        );
    }

    // --- Batch Request Logic ---
    function requestBatch(
        uint requestId,
        uint batchId,
        address pharmacist,
        uint quantityRequested,
        uint drugId,
        uint distributorId
    ) public {
        require(pharmacist != address(0), "Pharmacist required");
        require(batchId > 0, "Invalid batchId");
        require(quantityRequested > 0, "Quantity must be positive");
        require(batchRequests[requestId].requestId == 0, "Request exists");

        batchRequests[requestId] = BatchRequest({
            requestId: requestId,
            batchId: batchId,
            pharmacist: pharmacist,
            quantityRequested: quantityRequested,
            drugId: drugId,
            distributorId: distributorId,
            status: "pending",
            isDeleted: false,
            createdAt: block.timestamp,
            deletedAt: 0
        });

        emit BatchRequested(
            requestId,
            batchId,
            pharmacist,
            quantityRequested,
            drugId,
            distributorId,
            block.timestamp
        );
    }

    function editBatchRequest(
        uint requestId,
        uint batchId,
        address pharmacist,
        uint quantityRequested,
        uint drugId,
        uint distributorId,
        string memory status
    ) public {
        BatchRequest storage req = batchRequests[requestId];
        require(req.requestId == requestId, "Not found");
        require(!req.isDeleted, "Deleted");

        req.batchId = batchId;
        req.pharmacist = pharmacist;
        req.quantityRequested = quantityRequested;
        req.drugId = drugId;
        req.distributorId = distributorId;
        req.status = status;

        emit BatchRequestEdited(
            requestId,
            batchId,
            pharmacist,
            quantityRequested,
            drugId,
            distributorId,
            status,
            block.timestamp
        );
    }

    function deleteBatchRequest(uint requestId) public {
        BatchRequest storage req = batchRequests[requestId];
        require(req.requestId == requestId, "Not found");
        require(!req.isDeleted, "Already deleted");

        req.isDeleted = true;
        req.deletedAt = block.timestamp;

        emit BatchRequestDeleted(
            req.requestId,
            req.batchId,
            req.pharmacist,
            req.drugId,
            block.timestamp
        );
    }

    function updateBatchRequestStatus(uint requestId, string memory newStatus) public {
        BatchRequest storage req = batchRequests[requestId];
        require(req.requestId == requestId, "Not found");
        require(!req.isDeleted, "Deleted");

        string memory oldStatus = req.status;
        req.status = newStatus;

        emit BatchRequestStatusUpdated(requestId, oldStatus, newStatus, block.timestamp);
    }

    // --- Shipment Logic ---
    function createShipment(
        uint shipmentId,
        uint batchId,
        address distributor,
        address pharmacist,
        string memory status
    ) public {
        require(distributor != address(0), "Distributor required");
        require(pharmacist != address(0), "Pharmacist required");
        require(batchId > 0, "Invalid batchId");
        require(shipments[shipmentId].shipmentId == 0, "Shipment exists");

        shipments[shipmentId] = Shipment({
            shipmentId: shipmentId,
            batchId: batchId,
            distributor: distributor,
            pharmacist: pharmacist,
            status: status,
            isDeleted: false,
            createdAt: block.timestamp,
            deletedAt: 0
        });

        emit ShipmentCreated(
            shipmentId,
            batchId,
            distributor,
            pharmacist,
            status,
            block.timestamp
        );
    }

    function editShipment(
        uint shipmentId,
        uint batchId,
        address distributor,
        address pharmacist,
        string memory status
    ) public {
        Shipment storage s = shipments[shipmentId];
        require(s.shipmentId == shipmentId, "Not found");
        require(!s.isDeleted, "Deleted");

        s.batchId = batchId;
        s.distributor = distributor;
        s.pharmacist = pharmacist;
        s.status = status;

        emit ShipmentEdited(
            shipmentId,
            batchId,
            distributor,
            pharmacist,
            status,
            block.timestamp
        );
    }

    function deleteShipment(uint shipmentId) public {
        Shipment storage s = shipments[shipmentId];
        require(s.shipmentId == shipmentId, "Not found");
        require(!s.isDeleted, "Already deleted");

        s.isDeleted = true;
        s.deletedAt = block.timestamp;

        emit ShipmentDeleted(
            s.shipmentId,
            s.batchId,
            s.distributor,
            s.pharmacist,
            block.timestamp
        );
    }

    // --- Shipment Status Update ---
    function updateDistributorShipmentStatus(uint shipmentId, string memory newStatus) public {
        Shipment storage s = shipments[shipmentId];
        require(s.shipmentId == shipmentId, "Not found");
        require(!s.isDeleted, "Deleted");
        // Allow distributor or admin wallet to update status
        require(msg.sender == s.distributor || msg.sender == admin, "Only distributor or admin can update status");

        string memory oldStatus = s.status;
        s.status = newStatus;

        emit ShipmentStatusUpdated(shipmentId, oldStatus, newStatus, block.timestamp);
    }

    function updatePharmacistShipmentStatus(uint shipmentId, string memory newStatus) public {
        Shipment storage s = shipments[shipmentId];
        require(s.shipmentId == shipmentId, "Not found");
        require(!s.isDeleted, "Deleted");
        // Allow pharmacist or admin wallet to update status
        require(msg.sender == s.pharmacist || msg.sender == admin, "Only pharmacist or admin can update status");

        string memory oldStatus = s.status;
        s.status = newStatus;

        emit ShipmentStatusUpdated(shipmentId, oldStatus, newStatus, block.timestamp);
    }
}
