// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "./UserManagement.sol";

contract DummyActive {
    UserManagement um;
    constructor(address _um) { um = UserManagement(_um); }
    function callActiveFunction() external view {
        require(um.isUserActive(msg.sender), "User is not active");
    }
}
