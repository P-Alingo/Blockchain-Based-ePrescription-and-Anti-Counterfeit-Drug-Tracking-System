// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./UserManagement.sol";

contract RegulatorOversight {
    UserManagement public userManagement;

    string constant REGULATOR = "regulator";

    struct FlaggedBatch {
        uint id;
        uint drugBatchId;
        uint regulatorUserId;
        string reason;
        uint256 timestamp;
        bool resolved;
    }

    mapping(uint => FlaggedBatch) public flaggedBatches;
    uint[] public flaggedBatchIds;
    uint public flaggedBatchCounter;

    event BatchFlagged(uint flaggedId, uint drugBatchId, uint regulatorUserId, string reason);
    event BatchResolved(uint flaggedId, uint drugBatchId, uint regulatorUserId);

    modifier onlyRegulator() {
        uint userId = userManagement.walletToUserId(msg.sender);
        require(userId != 0, "User not registered");
        require(
            keccak256(bytes(userManagement.getRoleName(userManagement.getUser(msg.sender).roleId))) ==
            keccak256(bytes(REGULATOR)),
            "Only regulators can perform this action"
        );
        _;
    }

    constructor(address _userManagementAddress) {
        userManagement = UserManagement(_userManagementAddress);
        flaggedBatchCounter = 0;
    }

    function flagBatch(uint drugBatchId, string memory reason) public onlyRegulator {
        require(drugBatchId > 0, "Invalid batch ID");
        require(bytes(reason).length > 0, "Reason cannot be empty");

        flaggedBatchCounter++;
        uint regulatorUserId = userManagement.walletToUserId(msg.sender);

        flaggedBatches[flaggedBatchCounter] = FlaggedBatch({
            id: flaggedBatchCounter,
            drugBatchId: drugBatchId,
            regulatorUserId: regulatorUserId,
            reason: reason,
            timestamp: block.timestamp,
            resolved: false
        });

        flaggedBatchIds.push(flaggedBatchCounter);

        emit BatchFlagged(flaggedBatchCounter, drugBatchId, regulatorUserId, reason);
    }

    function resolveBatch(uint flaggedId) public onlyRegulator {
        require(flaggedBatches[flaggedId].id != 0, "Batch not flagged");
        require(!flaggedBatches[flaggedId].resolved, "Batch already resolved");

        flaggedBatches[flaggedId].resolved = true;

        emit BatchResolved(flaggedId, flaggedBatches[flaggedId].drugBatchId, flaggedBatches[flaggedId].regulatorUserId);
    }

    function getFlaggedBatch(uint flaggedId) public view returns (
        uint id,
        uint drugBatchId,
        uint regulatorUserId,
        string memory reason,
        uint256 timestamp,
        bool resolved
    ) {
        require(flaggedBatches[flaggedId].id != 0, "Batch not flagged");

        FlaggedBatch memory flagged = flaggedBatches[flaggedId];
        return (
            flagged.id,
            flagged.drugBatchId,
            flagged.regulatorUserId,
            flagged.reason,
            flagged.timestamp,
            flagged.resolved
        );
    }

    function getFlaggedBatchIds() public view returns (uint[] memory) {
        return flaggedBatchIds;
    }

    function getAllFlaggedBatches() public view returns (FlaggedBatch[] memory) {
        FlaggedBatch[] memory allFlagged = new FlaggedBatch[](flaggedBatchIds.length);
        for (uint i = 0; i < flaggedBatchIds.length; i++) {
            allFlagged[i] = flaggedBatches[flaggedBatchIds[i]];
        }
        return allFlagged;
    }

    function isBatchFlagged(uint flaggedId) public view returns (bool) {
        return flaggedBatches[flaggedId].id != 0 && !flaggedBatches[flaggedId].resolved;
    }
}
