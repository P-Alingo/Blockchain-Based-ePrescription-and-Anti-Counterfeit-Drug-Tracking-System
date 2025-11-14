// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./UserManagement.sol";

contract PrescriptionManagement {
        event PrescriptionViewed(
            uint indexed prescriptionId,
            address indexed doctor,
            address indexed patient,
            uint timestamp
        );
        function viewPrescription(uint prescriptionId) public prescriptionExists(prescriptionId) {
            Prescription storage p = prescriptions[prescriptionId];
            emit PrescriptionViewed(prescriptionId, p.doctor, p.patient, block.timestamp);
        }
    // ---------------- Structs ----------------
    struct DrugDetails {
        uint drugId;
        string name;
        string strength;
        string form;
        uint quantity;
        string instructions;
        string dosageAmount;
        string dosageUnit;
        string frequency;
        uint duration;
    }

    struct Prescription {
        uint prescriptionId;
        uint databaseId; // Links to PostgreSQL prescription.id
        address doctor;
        address patient;
        DrugDetails drug;
        uint issueDate;
        uint validUntil;
        string prescriptionCode;
        string blockchainTx;
        Status status;
        address dispensedBy;
        uint dispensedDate;
        uint createdAt;
        uint updatedAt;
        bool isDeleted;
        bool exists;
    }

    enum Status { Issued, Dispensed, Expired, Invalid }

    // ---------------- State Variables ----------------
    UserManagement public userManagement;
    
    mapping(uint => Prescription) public prescriptions;
    mapping(string => bool) public usedPrescriptionCodes; // Prevent duplicate prescription codes
    mapping(address => uint[]) public doctorPrescriptions;
    mapping(address => uint[]) public pharmacistPrescriptions;
    mapping(address => uint[]) public patientPrescriptions;
    
    uint[] public allPrescriptionIds;
    uint public prescriptionCounter;


    // ---------------- Events (PrescriptionManagement) ----------------
    event PrescriptionExpired(
        uint indexed prescriptionId,
        address indexed doctor,
        address indexed patient,
        uint expiredAt
    );
    event PrescriptionCreated(
        uint indexed prescriptionId,
        uint indexed databaseId,
        address indexed doctor,
        address patient,
        string prescriptionCode,
        string drugName,
        uint quantity,
        uint validUntil
    );
    event PrescriptionDispensed(
        uint indexed prescriptionId,
        address indexed pharmacist,
        address indexed patient,
        uint dispensedDate,
        string prescriptionCode
    );
    event PrescriptionInvalid(
        uint indexed prescriptionId,
        address indexed pharmacist,
        string reason,
        string prescriptionCode
    );
    event PrescriptionDeleted(
        uint indexed prescriptionId,
        address indexed doctor,
        string prescriptionCode
    );
    event PrescriptionUpdated(
        uint indexed prescriptionId,
        string prescriptionCode,
        uint updatedAt
    );

    // ---------------- Events (DrugSupplyChain) ----------------
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

    // ---------------- Events (RegulatorOversight) ----------------
    event AuditLogged(
        uint indexed auditId,
        address indexed regulator,
        string description,
        string entityType,
        uint entityId,
        uint timestamp
    );
    event EntityFlagged(
        uint indexed flagId,
        address indexed flaggedBy,
        string entityType,
        uint entityId,
        address userAddress,
        string reason,
        string status,
        bool autoSuspended,
        uint timestamp
    );
    event FlagStatusUpdated(
        uint indexed flagId,
        string oldStatus,
        string newStatus,
        address updatedBy,
        uint timestamp
    );
    event AnomalyDetected(
        uint indexed reportId,
        string anomalyType,
        string severity,
        string description,
        uint timestamp
    );
    event UserAutoSuspended(
        address indexed userAddress,
        uint flagCount,
        address suspendedBy,
        uint suspensionEndTime,
        uint timestamp
    );
    event UserSuspensionLifted(
        address indexed userAddress,
        address liftedBy,
        uint timestamp
    );

    // ---------------- Modifiers ----------------
    modifier onlyDoctor() {
        require(userManagement.isDoctor(msg.sender), "Only doctors can perform this action");
        require(userManagement.isUserActive(msg.sender), "Doctor must be active");
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

    modifier prescriptionExists(uint prescriptionId) {
        require(prescriptions[prescriptionId].exists, "Prescription not found");
        require(!prescriptions[prescriptionId].isDeleted, "Prescription is deleted");
        _;
    }

    modifier notDispensed(uint prescriptionId) {
        require(prescriptions[prescriptionId].status != Status.Dispensed, "Prescription already dispensed");
        _;
    }

    modifier notExpired(uint prescriptionId) {
        require(block.timestamp <= prescriptions[prescriptionId].validUntil, "Prescription expired");
        _;
    }

    // ---------------- Constructor ----------------
    constructor(address _userManagementAddress) {
        userManagement = UserManagement(_userManagementAddress);
    }

    // ---------------- Core Functions ----------------

    /**
     * @dev Create a new prescription that syncs with PostgreSQL
     * @param databaseId The ID from PostgreSQL prescription table
     * @param patient Address of the patient
     * @param prescriptionCode Unique prescription code from PostgreSQL
     * @param drugId Drug ID from PostgreSQL
     * @param drugName Name of the drug
     * @param strength Drug strength (e.g., "500mg")
     * @param form Drug form (e.g., "tablet", "capsule")
     * @param quantity Quantity to dispense
     * @param instructions Usage instructions
     * @param dosageAmount Dosage amount (e.g., "200.00")
     * @param dosageUnit Dosage unit (e.g., "mg")
     * @param frequency Frequency (e.g., "Once daily")
     * @param duration Duration in days
     * @param validUntil Prescription validity timestamp
     */
    function createPrescription(
        uint databaseId,
        address patient,
        string memory prescriptionCode,
        uint drugId,
        string memory drugName,
        string memory strength,
        string memory form,
        uint quantity,
        string memory instructions,
        string memory dosageAmount,
        string memory dosageUnit,
        string memory frequency,
        uint duration,
        uint validUntil
    ) public onlyDoctor {
        // Validate patient exists and is active
        require(userManagement.isPatient(patient), "Invalid patient address");
        require(userManagement.isUserActive(patient), "Patient must be active");
        
        // Validate prescription code uniqueness
        require(bytes(prescriptionCode).length > 0, "Prescription code required");
        require(!usedPrescriptionCodes[prescriptionCode], "Duplicate prescription code");
        
        // Validate drug details
        require(bytes(drugName).length > 0, "Drug name required");
        require(bytes(strength).length > 0, "Drug strength required");
        require(bytes(form).length > 0, "Drug form required");
        require(quantity > 0, "Quantity must be greater than 0");
        require(bytes(instructions).length > 0, "Instructions required");
        require(validUntil > block.timestamp, "Valid until must be in the future");

        // Generate prescription ID
        prescriptionCounter++;
        uint prescriptionId = prescriptionCounter;

        // Create drug details
        DrugDetails memory drug = DrugDetails({
            drugId: drugId,
            name: drugName,
            strength: strength,
            form: form,
            quantity: quantity,
            instructions: instructions,
            dosageAmount: dosageAmount,
            dosageUnit: dosageUnit,
            frequency: frequency,
            duration: duration
        });

        uint currentTime = block.timestamp;

        // Create prescription
        prescriptions[prescriptionId] = Prescription({
            prescriptionId: prescriptionId,
            databaseId: databaseId,
            doctor: msg.sender,
            patient: patient,
            drug: drug,
            issueDate: currentTime,
            validUntil: validUntil,
            prescriptionCode: prescriptionCode,
            blockchainTx: "",
            status: Status.Issued,
            dispensedBy: address(0),
            dispensedDate: 0,
            createdAt: currentTime,
            updatedAt: currentTime,
            isDeleted: false,
            exists: true
        });

        // Update mappings
        usedPrescriptionCodes[prescriptionCode] = true;
        doctorPrescriptions[msg.sender].push(prescriptionId);
        patientPrescriptions[patient].push(prescriptionId);
        allPrescriptionIds.push(prescriptionId);

        emit PrescriptionCreated(
            prescriptionId,
            databaseId,
            msg.sender,
            patient,
            prescriptionCode,
            drugName,
            quantity,
            validUntil
        );
    }

    /**
     * @dev Dispense a prescription
     * @param prescriptionId ID of the prescription to dispense
     */
    function dispensePrescription(uint prescriptionId) 
        public 
        onlyPharmacist 
        prescriptionExists(prescriptionId)
        notDispensed(prescriptionId)
        notExpired(prescriptionId)
    {
        Prescription storage prescription = prescriptions[prescriptionId];
        
        // Update prescription status
        prescription.status = Status.Dispensed;
        prescription.dispensedBy = msg.sender;
        prescription.dispensedDate = block.timestamp;
        prescription.updatedAt = block.timestamp;

        // Update pharmacist's prescriptions
        pharmacistPrescriptions[msg.sender].push(prescriptionId);

        emit PrescriptionDispensed(
            prescriptionId,
            msg.sender,
            prescription.patient,
            block.timestamp,
            prescription.prescriptionCode
        );
    }

    /**
     * @dev Mark prescription as invalid (e.g., counterfeit detection)
     * @param prescriptionId ID of the prescription to mark invalid
     * @param reason Reason for marking as invalid
     */
    function markPrescriptionInvalid(uint prescriptionId, string memory reason) 
        public 
        onlyPharmacist 
        prescriptionExists(prescriptionId)
        notDispensed(prescriptionId)
    {
        require(bytes(reason).length > 0, "Reason required");

        Prescription storage prescription = prescriptions[prescriptionId];
        prescription.status = Status.Invalid;
        prescription.updatedAt = block.timestamp;

        emit PrescriptionInvalid(
            prescriptionId,
            msg.sender,
            reason,
            prescription.prescriptionCode
        );
    }

    /**
     * @dev Delete a prescription (only if not dispensed)
     * @param prescriptionId ID of the prescription to delete
     */
    function deletePrescription(uint prescriptionId) 
        public 
        prescriptionExists(prescriptionId)
        notDispensed(prescriptionId)
    {
        Prescription storage prescription = prescriptions[prescriptionId];
        
        // Only the creating doctor or admin can delete
        require(
            prescription.doctor == msg.sender || userManagement.isAdmin(msg.sender),
            "Only prescribing doctor or admin can delete"
        );

        // Soft delete
        prescription.isDeleted = true;
        prescription.updatedAt = block.timestamp;

        emit PrescriptionDeleted(prescriptionId, msg.sender, prescription.prescriptionCode);
    }

    /**
     * @dev Update prescription blockchain transaction hash
     * @param prescriptionId ID of the prescription
     * @param transactionHash Blockchain transaction hash
     */
    function updateBlockchainTx(uint prescriptionId, string memory transactionHash) 
        public 
        prescriptionExists(prescriptionId)
    {
        Prescription storage prescription = prescriptions[prescriptionId];
        
        require(
            prescription.doctor == msg.sender || userManagement.isAdmin(msg.sender),
            "Not authorized to update transaction"
        );

        prescription.blockchainTx = transactionHash;
        prescription.updatedAt = block.timestamp;

        emit PrescriptionUpdated(prescriptionId, prescription.prescriptionCode, block.timestamp);
    }

    // ---------------- View Functions ----------------

    /**
     * @dev Get prescription details
     */
    function getPrescription(uint prescriptionId) 
        public 
        view 
        prescriptionExists(prescriptionId) 
        returns (Prescription memory) 
    {
        // Only involved parties or authorized roles can view
        Prescription memory prescription = prescriptions[prescriptionId];
        require(
            prescription.doctor == msg.sender ||
            prescription.patient == msg.sender ||
            prescription.dispensedBy == msg.sender ||
            userManagement.isAdmin(msg.sender) ||
            userManagement.isRegulator(msg.sender),
            "Not authorized to view this prescription"
        );
        
        return prescription;
    }

    /**
     * @dev Get prescription by prescription code
     */
    function getPrescriptionByCode(string memory prescriptionCode) 
        public 
        view 
        returns (Prescription memory) 
    {
        for (uint i = 0; i < allPrescriptionIds.length; i++) {
            Prescription memory prescription = prescriptions[allPrescriptionIds[i]];
            if (prescription.exists && 
                !prescription.isDeleted && 
                keccak256(bytes(prescription.prescriptionCode)) == keccak256(bytes(prescriptionCode))) {
                
                // Authorization check
                require(
                    prescription.doctor == msg.sender ||
                    prescription.patient == msg.sender ||
                    prescription.dispensedBy == msg.sender ||
                    userManagement.isAdmin(msg.sender) ||
                    userManagement.isRegulator(msg.sender),
                    "Not authorized to view this prescription"
                );
                
                return prescription;
            }
        }
        
        revert("Prescription not found");
    }

    /**
     * @dev Get all prescriptions created by a doctor
     */
    function getPrescriptionsByDoctor(address doctor) public view returns (Prescription[] memory) {
        require(
            doctor == msg.sender || 
            userManagement.isAdmin(msg.sender) || 
            userManagement.isRegulator(msg.sender),
            "Not authorized"
        );

        uint[] memory docPrescriptions = doctorPrescriptions[doctor];
        return _getValidPrescriptions(docPrescriptions);
    }

    /**
     * @dev Get all prescriptions dispensed by a pharmacist
     */
    function getPrescriptionsByPharmacist(address pharmacist) public view returns (Prescription[] memory) {
        require(
            pharmacist == msg.sender || 
            userManagement.isAdmin(msg.sender) || 
            userManagement.isRegulator(msg.sender),
            "Not authorized"
        );

        uint[] memory pharmaPrescriptions = pharmacistPrescriptions[pharmacist];
        return _getValidPrescriptions(pharmaPrescriptions);
    }

    /**
     * @dev Get all prescriptions for a patient
     */
    function getPrescriptionsByPatient(address patient) public view returns (Prescription[] memory) {
        require(
            patient == msg.sender || 
            userManagement.isAdmin(msg.sender) || 
            userManagement.isRegulator(msg.sender),
            "Not authorized"
        );

        uint[] memory patPrescriptions = patientPrescriptions[patient];
        return _getValidPrescriptions(patPrescriptions);
    }

    /**
     * @dev Get all prescriptions (admin/regulator only)
     */
    function getAllPrescriptions() public view returns (Prescription[] memory) {
        require(
            userManagement.isAdmin(msg.sender) || 
            userManagement.isRegulator(msg.sender),
            "Only admin or regulator can view all prescriptions"
        );

        return _getValidPrescriptions(allPrescriptionIds);
    }

    /**
     * @dev Get prescriptions that are flagged as invalid
     */
    function getFlaggedPrescriptions() public view returns (Prescription[] memory) {
        require(
            userManagement.isAdmin(msg.sender) || 
            userManagement.isRegulator(msg.sender),
            "Only admin or regulator can view flagged prescriptions"
        );

        uint flaggedCount = 0;
        
        // First count flagged prescriptions
        for (uint i = 0; i < allPrescriptionIds.length; i++) {
            if (prescriptions[allPrescriptionIds[i]].exists && 
                !prescriptions[allPrescriptionIds[i]].isDeleted &&
                prescriptions[allPrescriptionIds[i]].status == Status.Invalid) {
                flaggedCount++;
            }
        }
        
        // Create array with exact size
        Prescription[] memory result = new Prescription[](flaggedCount);
        uint currentIndex = 0;
        
        for (uint i = 0; i < allPrescriptionIds.length; i++) {
            if (prescriptions[allPrescriptionIds[i]].exists && 
                !prescriptions[allPrescriptionIds[i]].isDeleted &&
                prescriptions[allPrescriptionIds[i]].status == Status.Invalid) {
                result[currentIndex] = prescriptions[allPrescriptionIds[i]];
                currentIndex++;
            }
        }
        
        return result;
    }

    // ---------------- Utility Functions ----------------

    /**
     * @dev Check if prescription is valid for dispensing
     */
    function isValidForDispensing(uint prescriptionId) public view returns (bool) {
        if (!prescriptions[prescriptionId].exists || prescriptions[prescriptionId].isDeleted) {
            return false;
        }
        
        Prescription memory prescription = prescriptions[prescriptionId];
        return (prescription.status == Status.Issued && 
                block.timestamp <= prescription.validUntil);
    }

    /**
     * @dev Get prescription status as string
     */
    function getPrescriptionStatus(uint prescriptionId) 
        public 
        view 
        prescriptionExists(prescriptionId) 
        returns (string memory) 
    {
        Status status = prescriptions[prescriptionId].status;
        
        if (status == Status.Issued) return "issued";
        if (status == Status.Dispensed) return "dispensed";
        if (status == Status.Expired) return "expired";
        return "invalid";
    }

    /**
     * @dev Auto-expire old prescriptions (can be called by anyone)
     */
    function expireOldPrescriptions() public {
        for (uint i = 0; i < allPrescriptionIds.length; i++) {
            uint prescriptionId = allPrescriptionIds[i];
            if (prescriptions[prescriptionId].exists && 
                !prescriptions[prescriptionId].isDeleted &&
                prescriptions[prescriptionId].status == Status.Issued &&
                block.timestamp > prescriptions[prescriptionId].validUntil) {
                prescriptions[prescriptionId].status = Status.Expired;
                prescriptions[prescriptionId].updatedAt = block.timestamp;
                emit PrescriptionExpired(
                    prescriptionId,
                    prescriptions[prescriptionId].doctor,
                    prescriptions[prescriptionId].patient,
                    block.timestamp
                );
            }
        }
    }

    // ---------------- Internal Helpers ----------------

    function _getValidPrescriptions(uint[] memory prescriptionIds) 
        internal 
        view 
        returns (Prescription[] memory) 
    {
        uint validCount = 0;
        
        // First count valid prescriptions
        for (uint i = 0; i < prescriptionIds.length; i++) {
            if (prescriptions[prescriptionIds[i]].exists && !prescriptions[prescriptionIds[i]].isDeleted) {
                validCount++;
            }
        }
        
        // Create array with exact size
        Prescription[] memory result = new Prescription[](validCount);
        uint currentIndex = 0;
        
        for (uint i = 0; i < prescriptionIds.length; i++) {
            if (prescriptions[prescriptionIds[i]].exists && !prescriptions[prescriptionIds[i]].isDeleted) {
                result[currentIndex] = prescriptions[prescriptionIds[i]];
                currentIndex++;
            }
        }
        
        return result;
    }
}