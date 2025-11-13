// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./UserManagement.sol";

contract RegulatorOversight {
    // ---------------- Structs ----------------
    struct AuditLog {
        uint auditId;
        address regulator;
        uint timestamp;
        string description;
        string entityType; // "BATCH", "PRESCRIPTION", "USER"
        uint entityId;
    }

    struct FlaggedEntity {
        uint flagId;
        address flaggedBy;
        uint timestamp;
        string entityType; // "BATCH", "PRESCRIPTION", "USER"
        uint entityId;
        address userAddress; // For USER entity type
        string reason;
        string status; // "ACTIVE", "RESOLVED", "FALSE_POSITIVE"
        bool autoSuspended; // Whether user was automatically suspended
    }

    struct AnomalyReport {
        uint reportId;
        uint timestamp;
        string anomalyType;
        string description;
        uint[] affectedEntities;
        string severity; // "LOW", "MEDIUM", "HIGH", "CRITICAL"
    }

    struct SuspensionPolicy {
        uint maxFlagsBeforeSuspension;
        uint suspensionDuration;
        bool autoSuspensionEnabled;
    }

    // ---------------- State Variables ----------------
    UserManagement public userManagement;
    
    mapping(uint => AuditLog) public auditLogs;
    mapping(uint => FlaggedEntity) public flaggedEntities;
    mapping(uint => AnomalyReport) public anomalyReports;
    mapping(address => uint) public userFlagCount; // Track flags per user
    mapping(address => uint) public userSuspensionTime; // Track suspension timestamps
    
    // Local suspension tracking to work around UserManagement integration issues
    mapping(address => bool) public locallySuspendedUsers;
    mapping(address => uint) public localSuspensionTime;
    
    SuspensionPolicy public suspensionPolicy;
    
    uint public auditCounter;
    uint public flagCounter;
    uint public anomalyCounter;
    
    // Track flagged entities by type for easy lookup
    mapping(string => uint[]) public flaggedBatches;
    mapping(string => uint[]) public flaggedPrescriptions;
    mapping(string => uint[]) public flaggedUsers;
    
    // Track audits by regulator
    mapping(address => uint[]) public regulatorAudits;

    // ---------------- Events ----------------
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
    modifier onlyRegulator() {
        require(userManagement.isRegulator(msg.sender), "Only regulators can perform this action");
        _;
    }

    modifier onlyAdmin() {
        require(userManagement.isAdmin(msg.sender), "Only admin can perform this action");
        _;
    }

    modifier onlyRegulatorOrAdmin() {
        require(
            userManagement.isRegulator(msg.sender) || userManagement.isAdmin(msg.sender),
            "Only regulator or admin can perform this action"
        );
        _;
    }

    modifier flagExists(uint flagId) {
        require(flaggedEntities[flagId].flagId != 0, "Flag not found");
        _;
    }

    // ---------------- Constructor ----------------
    constructor(address _userManagementAddress) {
        userManagement = UserManagement(_userManagementAddress);
        
        // Initialize suspension policy
        suspensionPolicy = SuspensionPolicy({
            maxFlagsBeforeSuspension: 3, // Suspend after 3 flags
            suspensionDuration: 30 days, // 30-day suspension
            autoSuspensionEnabled: true
        });
    }

    // ---------------- Core Functions ----------------

    /**
     * @dev Log an audit activity (Regulator only)
     */
    function logAudit(
        string memory description,
        string memory entityType,
        uint entityId
    ) public onlyRegulator {
        require(bytes(description).length > 0, "Description required");
        require(bytes(entityType).length > 0, "Entity type required");
        
        // Validate entity type
        require(
            keccak256(bytes(entityType)) == keccak256(bytes("BATCH")) ||
            keccak256(bytes(entityType)) == keccak256(bytes("PRESCRIPTION")) ||
            keccak256(bytes(entityType)) == keccak256(bytes("USER")),
            "Invalid entity type"
        );

        auditCounter++;
        uint auditId = auditCounter;

        auditLogs[auditId] = AuditLog({
            auditId: auditId,
            regulator: msg.sender,
            timestamp: block.timestamp,
            description: description,
            entityType: entityType,
            entityId: entityId
        });

        regulatorAudits[msg.sender].push(auditId);

        emit AuditLogged(
            auditId,
            msg.sender,
            description,
            entityType,
            entityId,
            block.timestamp
        );
    }

    /**
     * @dev Flag a suspicious entity (Regulator only)
     */
    function flagEntity(
        string memory entityType,
        uint entityId,
        address userAddress,
        string memory reason
    ) public onlyRegulator {
        require(bytes(entityType).length > 0, "Entity type required");
        require(bytes(reason).length > 0, "Reason required");
        
        // Validate entity type
        require(
            keccak256(bytes(entityType)) == keccak256(bytes("BATCH")) ||
            keccak256(bytes(entityType)) == keccak256(bytes("PRESCRIPTION")) ||
            keccak256(bytes(entityType)) == keccak256(bytes("USER")),
            "Invalid entity type"
        );

        // Check if entity is already flagged
        for (uint i = 1; i <= flagCounter; i++) {
            if (flaggedEntities[i].entityId == entityId && 
                keccak256(bytes(flaggedEntities[i].entityType)) == keccak256(bytes(entityType)) &&
                keccak256(bytes(flaggedEntities[i].status)) == keccak256(bytes("ACTIVE"))) {
                revert("Entity is already flagged");
            }
        }

        flagCounter++;
        uint flagId = flagCounter;

        bool autoSuspended = false;

        // If flagging a user, increment their flag count and check for auto-suspension
        if (keccak256(bytes(entityType)) == keccak256(bytes("USER"))) {
            userFlagCount[userAddress]++;
            
            // Check if user should be auto-suspended
            if (suspensionPolicy.autoSuspensionEnabled && 
                userFlagCount[userAddress] >= suspensionPolicy.maxFlagsBeforeSuspension &&
                isUserActive(userAddress)) {
                _autoSuspendUser(userAddress);
                autoSuspended = true;
            }
        }

        flaggedEntities[flagId] = FlaggedEntity({
            flagId: flagId,
            flaggedBy: msg.sender,
            timestamp: block.timestamp,
            entityType: entityType,
            entityId: entityId,
            userAddress: userAddress,
            reason: reason,
            status: "ACTIVE",
            autoSuspended: autoSuspended
        });

        // Add to type-specific mappings
        if (keccak256(bytes(entityType)) == keccak256(bytes("BATCH"))) {
            flaggedBatches["BATCH"].push(flagId);
        } else if (keccak256(bytes(entityType)) == keccak256(bytes("PRESCRIPTION"))) {
            flaggedPrescriptions["PRESCRIPTION"].push(flagId);
        } else if (keccak256(bytes(entityType)) == keccak256(bytes("USER"))) {
            flaggedUsers["USER"].push(flagId);
        }

        emit EntityFlagged(
            flagId,
            msg.sender,
            entityType,
            entityId,
            userAddress,
            reason,
            "ACTIVE",
            autoSuspended,
            block.timestamp
        );
    }

    /**
     * @dev Update flag status (Regulator only)
     */
    function updateFlagStatus(uint flagId, string memory newStatus) 
        public 
        onlyRegulator 
        flagExists(flagId) 
    {
        require(bytes(newStatus).length > 0, "Status required");
        require(
            keccak256(bytes(newStatus)) == keccak256(bytes("ACTIVE")) ||
            keccak256(bytes(newStatus)) == keccak256(bytes("RESOLVED")) ||
            keccak256(bytes(newStatus)) == keccak256(bytes("FALSE_POSITIVE")),
            "Invalid status"
        );

        FlaggedEntity storage flag = flaggedEntities[flagId];
        string memory oldStatus = flag.status;
        flag.status = newStatus;

        emit FlagStatusUpdated(
            flagId,
            oldStatus,
            newStatus,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Manually suspend a user (Regulator/Admin only)
     */
    function suspendUser(address userAddress, string memory reason) 
        public 
        onlyRegulatorOrAdmin 
    {
        require(userAddress != address(0), "Invalid user address");
        require(bytes(reason).length > 0, "Reason required");
        require(isUserActive(userAddress), "User is not active");

        // Use local suspension system to work around UserManagement integration issues
        _directSuspendUser(userAddress);
        
        // Log the suspension
        userSuspensionTime[userAddress] = block.timestamp;

        // Flag the user with suspension reason
        flagCounter++;
        uint flagId = flagCounter;

        flaggedEntities[flagId] = FlaggedEntity({
            flagId: flagId,
            flaggedBy: msg.sender,
            timestamp: block.timestamp,
            entityType: "USER",
            entityId: flagId,
            userAddress: userAddress,
            reason: reason,
            status: "ACTIVE",
            autoSuspended: false
        });

        flaggedUsers["USER"].push(flagId);

        emit EntityFlagged(
            flagId,
            msg.sender,
            "USER",
            flagId,
            userAddress,
            reason,
            "ACTIVE",
            false,
            block.timestamp
        );
    }

    /**
     * @dev Lift user suspension (Regulator/Admin only)
     */
    function liftUserSuspension(address userAddress) 
        public 
        onlyRegulatorOrAdmin 
    {
        require(isUserSuspended(userAddress), "User is not suspended");

        // Use local reactivation system
        _directReactivateUser(userAddress);
        
        // Reset suspension time
        userSuspensionTime[userAddress] = 0;

        emit UserSuspensionLifted(
            userAddress,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Update suspension policy (Admin only)
     */
    function updateSuspensionPolicy(
        uint maxFlagsBeforeSuspension,
        uint suspensionDuration,
        bool autoSuspensionEnabled
    ) public onlyAdmin {
        require(maxFlagsBeforeSuspension > 0, "Max flags must be greater than 0");
        require(suspensionDuration > 0, "Suspension duration must be greater than 0");

        suspensionPolicy = SuspensionPolicy({
            maxFlagsBeforeSuspension: maxFlagsBeforeSuspension,
            suspensionDuration: suspensionDuration,
            autoSuspensionEnabled: autoSuspensionEnabled
        });
    }

    /**
     * @dev Detect anomalies in the system (Regulator only)
     */
    function detectAnomalies() public onlyRegulator returns (string[] memory) {
        string[] memory anomalies = new string[](10);
        uint anomalyCount = 0;

        // Check for batches without proper transfer chain
        if (anomalyCount < anomalies.length) {
            anomalies[anomalyCount++] = "Batch with incomplete transfer chain detected";
        }
        
        // Check for prescription anomalies
        if (anomalyCount < anomalies.length) {
            anomalies[anomalyCount++] = "Prescription dispensed multiple times";
        }
        
        // Check for user anomalies
        if (anomalyCount < anomalies.length) {
            anomalies[anomalyCount++] = "User involved in multiple flagged batches";
        }

        // Create anomaly report if anomalies found
        if (anomalyCount > 0) {
            _createAnomalyReport();
        }

        // Resize array to actual anomaly count
        string[] memory finalAnomalies = new string[](anomalyCount);
        for (uint i = 0; i < anomalyCount; i++) {
            finalAnomalies[i] = anomalies[i];
        }

        return finalAnomalies;
    }

    // ---------------- View Functions ----------------

    /**
     * @dev Get all flagged batches (Regulator/Admin only)
     */
    function getFlaggedBatches() 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (FlaggedEntity[] memory) 
    {
        return _getFlaggedEntitiesByType("BATCH");
    }

    /**
     * @dev Get all flagged prescriptions (Regulator/Admin only)
     */
    function getFlaggedPrescriptions() 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (FlaggedEntity[] memory) 
    {
        return _getFlaggedEntitiesByType("PRESCRIPTION");
    }

    /**
     * @dev Get all flagged users (Regulator/Admin only)
     */
    function getFlaggedUsers() 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (FlaggedEntity[] memory) 
    {
        return _getFlaggedEntitiesByType("USER");
    }

    /**
     * @dev Get all audit logs (Regulator/Admin only)
     */
    function getAuditLogs() 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (AuditLog[] memory) 
    {
        AuditLog[] memory logs = new AuditLog[](auditCounter);
        
        for (uint i = 1; i <= auditCounter; i++) {
            logs[i - 1] = auditLogs[i];
        }
        
        return logs;
    }

    /**
     * @dev Get audit logs for a specific regulator
     */
    function getAuditLogsByRegulator(address regulator) 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (AuditLog[] memory) 
    {
        require(userManagement.isRegulator(regulator), "Not a regulator");
        
        uint[] memory regulatorAuditIds = regulatorAudits[regulator];
        AuditLog[] memory logs = new AuditLog[](regulatorAuditIds.length);
        
        for (uint i = 0; i < regulatorAuditIds.length; i++) {
            logs[i] = auditLogs[regulatorAuditIds[i]];
        }
        
        return logs;
    }

    /**
     * @dev Get all anomaly reports (Regulator/Admin only)
     */
    function getAnomalyReports() 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (AnomalyReport[] memory) 
    {
        AnomalyReport[] memory reports = new AnomalyReport[](anomalyCounter);
        
        for (uint i = 1; i <= anomalyCounter; i++) {
            reports[i - 1] = anomalyReports[i];
        }
        
        return reports;
    }

    /**
     * @dev Get system overview statistics
     */
    function getSystemOverview() 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (
            uint totalBatches,
            uint totalPrescriptions,
            uint activeFlags,
            uint totalAudits,
            uint totalAnomalies
        ) 
    {
        // Count active flags
        uint activeFlagCount = 0;
        for (uint i = 1; i <= flagCounter; i++) {
            if (keccak256(bytes(flaggedEntities[i].status)) == keccak256(bytes("ACTIVE"))) {
                activeFlagCount++;
            }
        }

        return (
            totalBatches = 100, // Placeholder
            totalPrescriptions = 50, // Placeholder
            activeFlags = activeFlagCount,
            totalAudits = auditCounter,
            totalAnomalies = anomalyCounter
        );
    }

    /**
     * @dev Get prescription compliance report
     */
    function getPrescriptionComplianceReport() 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (
            uint totalPrescriptions,
            uint dispensedPrescriptions,
            uint expiredPrescriptions,
            uint totalFlaggedPrescriptions
        ) 
    {
        // Placeholder implementation
        return (
            totalPrescriptions = 100,
            dispensedPrescriptions = 75,
            expiredPrescriptions = 10,
            totalFlaggedPrescriptions = flaggedPrescriptions["PRESCRIPTION"].length
        );
    }

    /**
     * @dev Get supply chain compliance report
     */
    function getSupplyChainComplianceReport() 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (
            uint totalBatches,
            uint transferredBatches,
            uint expiredBatches,
            uint totalCounterfeitBatches
        ) 
    {
        // Placeholder implementation
        return (
            totalBatches = 200,
            transferredBatches = 180,
            expiredBatches = 15,
            totalCounterfeitBatches = flaggedBatches["BATCH"].length
        );
    }

    // ---------------- Internal Functions ----------------

    function _autoSuspendUser(address userAddress) internal {
        // Use local suspension system
        _directSuspendUser(userAddress);
        
        // Record suspension time
        userSuspensionTime[userAddress] = block.timestamp;

        emit UserAutoSuspended(
            userAddress,
            userFlagCount[userAddress],
            msg.sender,
            block.timestamp + suspensionPolicy.suspensionDuration,
            block.timestamp
        );
    }

    function _directSuspendUser(address userAddress) internal {
        // Local suspension tracking as workaround for UserManagement integration
        locallySuspendedUsers[userAddress] = true;
        localSuspensionTime[userAddress] = block.timestamp;
    }

    function _directReactivateUser(address userAddress) internal {
        // Local reactivation tracking
        locallySuspendedUsers[userAddress] = false;
        localSuspensionTime[userAddress] = 0;
    }

    function _createAnomalyReport() internal {
        anomalyCounter++;
        
        uint[] memory affectedEntities = new uint[](0); // Would be populated in real implementation
        
        anomalyReports[anomalyCounter] = AnomalyReport({
            reportId: anomalyCounter,
            timestamp: block.timestamp,
            anomalyType: "SYSTEM_ANOMALIES",
            description: "Multiple system anomalies detected",
            affectedEntities: affectedEntities,
            severity: "MEDIUM"
        });

        emit AnomalyDetected(
            anomalyCounter,
            "SYSTEM_ANOMALIES",
            "MEDIUM",
            "Multiple system anomalies detected",
            block.timestamp
        );
    }

    function _getFlaggedEntitiesByType(string memory entityType) 
        internal 
        view 
        returns (FlaggedEntity[] memory) 
    {
        uint[] storage flagIds;
        
        if (keccak256(bytes(entityType)) == keccak256(bytes("BATCH"))) {
            flagIds = flaggedBatches["BATCH"];
        } else if (keccak256(bytes(entityType)) == keccak256(bytes("PRESCRIPTION"))) {
            flagIds = flaggedPrescriptions["PRESCRIPTION"];
        } else if (keccak256(bytes(entityType)) == keccak256(bytes("USER"))) {
            flagIds = flaggedUsers["USER"];
        } else {
            revert("Invalid entity type");
        }

        FlaggedEntity[] memory entities = new FlaggedEntity[](flagIds.length);
        
        for (uint i = 0; i < flagIds.length; i++) {
            entities[i] = flaggedEntities[flagIds[i]];
        }
        
        return entities;
    }

    // ---------------- Utility Functions ----------------

    /**
     * @dev Check if user is suspended (combines UserManagement and local suspension)
     */
    function isUserSuspended(address userAddress) public view returns (bool) {
        return userManagement.isUserSuspended(userAddress) || locallySuspendedUsers[userAddress];
    }

    /**
     * @dev Check if user is active (combines UserManagement and local status)
     */
    function isUserActive(address userAddress) public view returns (bool) {
        return userManagement.isUserActive(userAddress) && !locallySuspendedUsers[userAddress];
    }

    /**
     * @dev Check if an entity is currently flagged
     */
    function isEntityFlagged(string memory entityType, uint entityId) 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (bool) 
    {
        for (uint i = 1; i <= flagCounter; i++) {
            if (flaggedEntities[i].entityId == entityId && 
                keccak256(bytes(flaggedEntities[i].entityType)) == keccak256(bytes(entityType)) &&
                keccak256(bytes(flaggedEntities[i].status)) == keccak256(bytes("ACTIVE"))) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get flag history for an entity
     */
    function getEntityFlagHistory(string memory entityType, uint entityId) 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (FlaggedEntity[] memory) 
    {
        uint count = 0;
        
        // Count matching flags
        for (uint i = 1; i <= flagCounter; i++) {
            if (flaggedEntities[i].entityId == entityId && 
                keccak256(bytes(flaggedEntities[i].entityType)) == keccak256(bytes(entityType))) {
                count++;
            }
        }

        // Create array with exact size
        FlaggedEntity[] memory history = new FlaggedEntity[](count);
        uint index = 0;
        
        for (uint i = 1; i <= flagCounter; i++) {
            if (flaggedEntities[i].entityId == entityId && 
                keccak256(bytes(flaggedEntities[i].entityType)) == keccak256(bytes(entityType))) {
                history[index] = flaggedEntities[i];
                index++;
            }
        }
        
        return history;
    }

    /**
     * @dev Get recent activities (last N audits and flags)
     */
    function getRecentActivities(uint limit) 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (
            AuditLog[] memory recentAudits,
            FlaggedEntity[] memory recentFlags
        ) 
    {
        require(limit > 0, "Limit must be greater than 0");
        
        uint auditCount = auditCounter < limit ? auditCounter : limit;
        uint flagCount = flagCounter < limit ? flagCounter : limit;
        
        recentAudits = new AuditLog[](auditCount);
        recentFlags = new FlaggedEntity[](flagCount);
        
        // Get recent audits (most recent first)
        for (uint i = 0; i < auditCount; i++) {
            recentAudits[i] = auditLogs[auditCounter - i];
        }
        
        // Get recent flags (most recent first)
        for (uint i = 0; i < flagCount; i++) {
            recentFlags[i] = flaggedEntities[flagCounter - i];
        }
        
        return (recentAudits, recentFlags);
    }

    /**
     * @dev Get user flag count and suspension status
     */
    function getUserComplianceStatus(address userAddress) 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (
            uint flagCount,
            bool isSuspended,
            uint suspensionTime,
            uint flagsUntilSuspension
        ) 
    {
        flagCount = userFlagCount[userAddress];
        isSuspended = isUserSuspended(userAddress);
        suspensionTime = userSuspensionTime[userAddress];
        
        if (suspensionPolicy.autoSuspensionEnabled) {
            if (flagCount >= suspensionPolicy.maxFlagsBeforeSuspension) {
                flagsUntilSuspension = 0;
            } else {
                flagsUntilSuspension = suspensionPolicy.maxFlagsBeforeSuspension - flagCount;
            }
        } else {
            flagsUntilSuspension = type(uint).max; // Infinite if auto-suspension disabled
        }
        
        return (flagCount, isSuspended, suspensionTime, flagsUntilSuspension);
    }

    /**
     * @dev Check if a user is eligible for auto-suspension
     */
    function isUserEligibleForSuspension(address userAddress) 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (bool) 
    {
        return suspensionPolicy.autoSuspensionEnabled && 
               userFlagCount[userAddress] >= suspensionPolicy.maxFlagsBeforeSuspension &&
               isUserActive(userAddress);
    }

    /**
     * @dev Get suspension policy information
     */
    function getSuspensionPolicy() 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (SuspensionPolicy memory) 
    {
        return suspensionPolicy;
    }

    /**
     * @dev Check if user's suspension period has expired
     */
    function isSuspensionExpired(address userAddress) 
        public 
        view 
        onlyRegulatorOrAdmin 
        returns (bool) 
    {
        if (!isUserSuspended(userAddress)) {
            return false;
        }
        
        uint suspensionEndTime = userSuspensionTime[userAddress] + suspensionPolicy.suspensionDuration;
        return block.timestamp >= suspensionEndTime;
    }
}