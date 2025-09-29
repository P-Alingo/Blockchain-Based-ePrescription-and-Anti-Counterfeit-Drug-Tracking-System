// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./UserManagement.sol";

contract Prescription {
    UserManagement public userManagement;
    uint public prescriptionCounter;

    string constant DOCTOR = "doctor";
    string constant PHARMACIST = "pharmacist";
    string constant REGULATOR = "regulator";

    struct PrescriptionData {
        uint id;
        uint doctorUserId;
        uint patientUserId;
        uint drugId;
        string dosage;
        string ipfsHash;
        string qrCode;
        string status;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isRevoked;
        uint revokedByUserId;
        string revocationReason;
        uint256 revokedAt;
    }

    mapping(uint => PrescriptionData) public prescriptions;

    event PrescriptionCreated(uint id, uint doctorUserId, uint patientUserId, uint drugId, string qrCode);
    event PrescriptionVerified(uint id, uint pharmacistUserId);
    event PrescriptionDispensed(uint id, uint pharmacistUserId);
    event PrescriptionRevoked(uint indexed prescriptionId, uint revokedByUserId, string reason);

    modifier onlyDoctor() {
        uint userId = userManagement.walletToUserId(msg.sender);
        require(userId != 0, "User not registered");
        require(
            keccak256(bytes(userManagement.getRoleName(userManagement.getUser(msg.sender).roleId))) == keccak256(bytes(DOCTOR)),
            "Only doctors can perform this action"
        );
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

    modifier onlyRegulator() {
        uint userId = userManagement.walletToUserId(msg.sender);
        require(userId != 0, "User not registered");
        require(
            keccak256(bytes(userManagement.getRoleName(userManagement.getUser(msg.sender).roleId))) == keccak256(bytes(REGULATOR)),
            "Only regulators can perform this action"
        );
        _;
    }

    modifier validPrescription(uint prescriptionId) {
        require(prescriptionId > 0 && prescriptionId <= prescriptionCounter, "Invalid prescription ID");
        _;
    }

    modifier notRevoked(uint prescriptionId) {
        require(!prescriptions[prescriptionId].isRevoked, "Prescription has been revoked");
        _;
    }

    constructor(address _userManagementAddress) {
        userManagement = UserManagement(_userManagementAddress);
        prescriptionCounter = 0;
    }

    function createPrescription(
        uint patientUserId,
        uint drugId,
        string memory dosage,
        string memory ipfsHash,
        string memory qrCode,
        uint256 expiresAt
    ) public onlyDoctor {
        require(patientUserId > 0, "Invalid patient ID");
        require(drugId > 0, "Invalid drug ID");
        require(bytes(dosage).length > 0, "Dosage cannot be empty");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(qrCode).length > 0, "QR code cannot be empty");
        require(expiresAt > block.timestamp, "Expiry must be in the future");

        uint doctorUserId = userManagement.walletToUserId(msg.sender);
        prescriptionCounter++;

        prescriptions[prescriptionCounter] = PrescriptionData({
            id: prescriptionCounter,
            doctorUserId: doctorUserId,
            patientUserId: patientUserId,
            drugId: drugId,
            dosage: dosage,
            ipfsHash: ipfsHash,
            qrCode: qrCode,
            status: "issued",
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            isRevoked: false,
            revokedByUserId: 0,
            revocationReason: "",
            revokedAt: 0
        });

        emit PrescriptionCreated(prescriptionCounter, doctorUserId, patientUserId, drugId, qrCode);
    }

    function verifyPrescription(uint prescriptionId) 
        public 
        onlyPharmacist 
        validPrescription(prescriptionId)
        notRevoked(prescriptionId)
    {
        PrescriptionData storage p = prescriptions[prescriptionId];
        require(keccak256(bytes(p.status)) == keccak256(bytes("issued")), "Prescription cannot be verified");
        require(block.timestamp <= p.expiresAt, "Prescription expired");

        p.status = "verified";
        uint pharmacistUserId = userManagement.walletToUserId(msg.sender);
        emit PrescriptionVerified(prescriptionId, pharmacistUserId);
    }

    function dispensePrescription(uint prescriptionId) 
        public 
        onlyPharmacist 
        validPrescription(prescriptionId)
        notRevoked(prescriptionId)
    {
        PrescriptionData storage p = prescriptions[prescriptionId];
        require(keccak256(bytes(p.status)) == keccak256(bytes("verified")), "Prescription must be verified first");

        p.status = "dispensed";
        uint pharmacistUserId = userManagement.walletToUserId(msg.sender);
        emit PrescriptionDispensed(prescriptionId, pharmacistUserId);
    }

    function revokePrescription(uint prescriptionId, string memory reason) 
        public 
        validPrescription(prescriptionId)
    {
        PrescriptionData storage p = prescriptions[prescriptionId];
        require(!p.isRevoked, "Prescription already revoked");
        
        uint userId = userManagement.walletToUserId(msg.sender);
        string memory userRole = userManagement.getRoleName(userManagement.getUser(msg.sender).roleId);
        
        // Only prescribing doctor or regulator can revoke
        bool isPrescribingDoctor = p.doctorUserId == userId;
        bool isRegulatorUser = keccak256(bytes(userRole)) == keccak256(bytes(REGULATOR));
        
        require(isPrescribingDoctor || isRegulatorUser, "Not authorized to revoke prescription");
        require(bytes(reason).length > 0, "Revocation reason cannot be empty");

        p.isRevoked = true;
        p.revokedByUserId = userId;
        p.revocationReason = reason;
        p.revokedAt = block.timestamp;
        p.status = "revoked";

        emit PrescriptionRevoked(prescriptionId, userId, reason);
    }

    function getPrescription(uint prescriptionId) 
        public 
        view 
        validPrescription(prescriptionId)
        returns (
            uint id,
            uint doctorUserId,
            uint patientUserId,
            uint drugId,
            string memory dosage,
            string memory ipfsHash,
            string memory qrCode,
            string memory status,
            uint256 issuedAt,
            uint256 expiresAt,
            bool isRevoked,
            uint revokedByUserId,
            string memory revocationReason,
            uint256 revokedAt
        ) 
    {
        PrescriptionData memory p = prescriptions[prescriptionId];
        return (
            p.id,
            p.doctorUserId,
            p.patientUserId,
            p.drugId,
            p.dosage,
            p.ipfsHash,
            p.qrCode,
            p.status,
            p.issuedAt,
            p.expiresAt,
            p.isRevoked,
            p.revokedByUserId,
            p.revocationReason,
            p.revokedAt
        );
    }

    function getPrescriptionStatus(uint prescriptionId) 
        public 
        view 
        validPrescription(prescriptionId)
        returns (string memory status, bool isRevoked, bool isExpired) 
    {
        PrescriptionData memory p = prescriptions[prescriptionId];
        bool expired = block.timestamp > p.expiresAt;
        return (p.status, p.isRevoked, expired);
    }

    function isPrescriptionValid(uint prescriptionId) 
        public 
        view 
        validPrescription(prescriptionId)
        returns (bool) 
    {
        PrescriptionData memory p = prescriptions[prescriptionId];
        return !p.isRevoked && 
               block.timestamp <= p.expiresAt && 
               keccak256(bytes(p.status)) != keccak256(bytes("dispensed"));
    }

    function getPrescriptionsByPatient(uint patientUserId) 
        public 
        view 
        returns (uint[] memory) 
    {
        require(patientUserId > 0, "Invalid patient ID");
        
        // Count matching prescriptions
        uint count = 0;
        for (uint i = 1; i <= prescriptionCounter; i++) {
            if (prescriptions[i].patientUserId == patientUserId) {
                count++;
            }
        }
        
        // Return array of prescription IDs
        uint[] memory patientPrescriptions = new uint[](count);
        uint index = 0;
        for (uint i = 1; i <= prescriptionCounter; i++) {
            if (prescriptions[i].patientUserId == patientUserId) {
                patientPrescriptions[index] = i;
                index++;
            }
        }
        
        return patientPrescriptions;
    }

    function getPrescriptionsByDoctor(uint doctorUserId) 
        public 
        view 
        returns (uint[] memory) 
    {
        require(doctorUserId > 0, "Invalid doctor ID");
        
        // Count matching prescriptions
        uint count = 0;
        for (uint i = 1; i <= prescriptionCounter; i++) {
            if (prescriptions[i].doctorUserId == doctorUserId) {
                count++;
            }
        }
        
        // Return array of prescription IDs
        uint[] memory doctorPrescriptions = new uint[](count);
        uint index = 0;
        for (uint i = 1; i <= prescriptionCounter; i++) {
            if (prescriptions[i].doctorUserId == doctorUserId) {
                doctorPrescriptions[index] = i;
                index++;
            }
        }
        
        return doctorPrescriptions;
    }
}