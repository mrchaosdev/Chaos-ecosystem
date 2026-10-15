// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ChaosID is Ownable {
    struct Profile {
        uint256 reputationScore;
        uint256 txCount;
        uint256 volumeUsdc;
        uint256 joinedAt;
        bool exists;
    }

    uint256 private constant BASE_REPUTATION_PER_TX = 10;
    uint256 private constant USDC_DECIMALS = 1e6;
    uint256 private constant USDC_PER_POINT = 10 * USDC_DECIMALS;

    mapping(address => Profile) public profiles;
    mapping(address => bool) public authorizedCallers;

    event Registered(address indexed user);
    event ReputationUpdated(address indexed user, uint256 newScore);
    event CallerAuthorized(address indexed caller, bool authorized);

    constructor() Ownable(msg.sender) {}

    modifier onlyAuthorizedCaller() {
        require(authorizedCallers[msg.sender], "ChaosID: caller not authorized");
        _;
    }

    function register() external {
        require(!profiles[msg.sender].exists, "ChaosID: already registered");
        _register(msg.sender);
    }

    function getProfile(address user) external view returns (Profile memory) {
        require(user != address(0), "ChaosID: zero user");
        return profiles[user];
    }

    function isRegistered(address user) external view returns (bool) {
        require(user != address(0), "ChaosID: zero user");
        return profiles[user].exists;
    }

    function recordTransaction(address user, uint256 usdcAmount) external onlyAuthorizedCaller {
        require(user != address(0), "ChaosID: zero user");
        require(profiles[user].exists, "ChaosID: user not registered");

        Profile storage profile = profiles[user];
        profile.txCount += 1;
        profile.volumeUsdc += usdcAmount;

        uint256 volumePoints = usdcAmount / USDC_PER_POINT;
        profile.reputationScore += BASE_REPUTATION_PER_TX + volumePoints;

        emit ReputationUpdated(user, profile.reputationScore);
    }

    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        require(caller != address(0), "ChaosID: zero caller");
        authorizedCallers[caller] = authorized;
        emit CallerAuthorized(caller, authorized);
    }

    function _register(address user) internal {
        profiles[user] = Profile({
            reputationScore: 0,
            txCount: 0,
            volumeUsdc: 0,
            joinedAt: block.timestamp,
            exists: true
        });

        emit Registered(user);
    }
}
