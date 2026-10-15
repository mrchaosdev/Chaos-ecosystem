// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IChaosID {
    function recordTransaction(address user, uint256 usdcAmount) external;
}

contract ChaosBoard is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum BountyStatus {
        Open,
        Claimed,
        Submitted,
        Completed,
        Cancelled
    }

    struct Bounty {
        address poster;
        address claimer;
        uint256 reward;
        uint256 deadline;
        BountyStatus status;
        string title;
        string description;
    }

    uint256 public bountyCount;
    mapping(uint256 => Bounty) public bounties;
    address public chaosIdAddress;
    address public immutable usdcAddress;

    event BountyPosted(uint256 indexed bountyId, address indexed poster, uint256 reward);
    event BountyClaimed(uint256 indexed bountyId, address indexed claimer);
    event WorkSubmitted(uint256 indexed bountyId, address indexed claimer);
    event BountyCompleted(uint256 indexed bountyId, address indexed claimer, uint256 reward);
    event BountyCancelled(uint256 indexed bountyId);
    event ChaosIdAddressUpdated(address indexed oldAddress, address indexed newAddress);
    event ChaosIdUpdateFailed(uint256 indexed bountyId, address indexed claimer);

    constructor(address _usdcAddress, address _chaosIdAddress) Ownable(msg.sender) {
        require(_usdcAddress != address(0), "ChaosBoard: zero usdc");
        require(_chaosIdAddress != address(0), "ChaosBoard: zero chaos id");

        usdcAddress = _usdcAddress;
        chaosIdAddress = _chaosIdAddress;
    }

    modifier validBounty(uint256 bountyId) {
        require(bountyId > 0 && bountyId <= bountyCount, "ChaosBoard: invalid bounty");
        _;
    }

    function postBounty(
        string calldata title,
        string calldata description,
        uint256 reward,
        uint256 deadline
    ) external nonReentrant returns (uint256 bountyId) {
        require(reward > 0, "ChaosBoard: reward must be > 0");
        require(bytes(title).length > 0, "ChaosBoard: empty title");

        IERC20(usdcAddress).safeTransferFrom(msg.sender, address(this), reward);

        bountyId = ++bountyCount;
        bounties[bountyId] = Bounty({
            poster: msg.sender,
            claimer: address(0),
            reward: reward,
            deadline: deadline,
            status: BountyStatus.Open,
            title: title,
            description: description
        });

        emit BountyPosted(bountyId, msg.sender, reward);
    }

    function claimBounty(uint256 bountyId) external validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        require(bounty.status == BountyStatus.Open, "ChaosBoard: not open");
        require(msg.sender != bounty.poster, "ChaosBoard: poster cannot claim");

        bounty.claimer = msg.sender;
        bounty.status = BountyStatus.Claimed;

        emit BountyClaimed(bountyId, msg.sender);
    }

    function submitWork(uint256 bountyId) external validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        require(bounty.status == BountyStatus.Claimed, "ChaosBoard: not claimed");
        require(msg.sender == bounty.claimer, "ChaosBoard: not claimer");

        bounty.status = BountyStatus.Submitted;

        emit WorkSubmitted(bountyId, msg.sender);
    }

    function approveBounty(uint256 bountyId) external nonReentrant validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        require(msg.sender == bounty.poster, "ChaosBoard: not poster");
        require(bounty.status == BountyStatus.Submitted, "ChaosBoard: not submitted");

        bounty.status = BountyStatus.Completed;
        IERC20(usdcAddress).safeTransfer(bounty.claimer, bounty.reward);

        try IChaosID(chaosIdAddress).recordTransaction(bounty.claimer, bounty.reward) {
            // no-op
        } catch {
            emit ChaosIdUpdateFailed(bountyId, bounty.claimer);
        }

        emit BountyCompleted(bountyId, bounty.claimer, bounty.reward);
    }

    function cancelBounty(uint256 bountyId) external nonReentrant validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        require(msg.sender == bounty.poster, "ChaosBoard: not poster");
        require(bounty.status == BountyStatus.Open, "ChaosBoard: cannot cancel");

        bounty.status = BountyStatus.Cancelled;
        IERC20(usdcAddress).safeTransfer(bounty.poster, bounty.reward);

        emit BountyCancelled(bountyId);
    }

    function reclaimExpiredBounty(uint256 bountyId) external nonReentrant validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        require(msg.sender == bounty.poster, "ChaosBoard: not poster");
        require(
            bounty.status == BountyStatus.Claimed || bounty.status == BountyStatus.Submitted,
            "ChaosBoard: invalid status"
        );
        require(bounty.deadline > 0 && block.timestamp > bounty.deadline, "ChaosBoard: deadline not passed");

        bounty.status = BountyStatus.Cancelled;
        IERC20(usdcAddress).safeTransfer(bounty.poster, bounty.reward);

        emit BountyCancelled(bountyId);
    }

    function getBounty(uint256 bountyId) external view validBounty(bountyId) returns (Bounty memory) {
        return bounties[bountyId];
    }

    function setChaosIdAddress(address newAddress) external onlyOwner {
        require(newAddress != address(0), "ChaosBoard: zero chaos id");
        address oldAddress = chaosIdAddress;
        chaosIdAddress = newAddress;
        emit ChaosIdAddressUpdated(oldAddress, newAddress);
    }
}
