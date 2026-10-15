// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IChaosID {
    function recordTransaction(address user, uint256 usdcAmount) external;
}

contract ChaosMarket is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Listing {
        address seller;
        address buyer;
        uint256 price;
        ListingStatus status;
        string title;
        string description;
        string category;
        uint256 disputeDeadline;
    }

    enum ListingStatus {
        Active,
        Sold,
        Delivered,
        Confirmed,
        Cancelled
    }

    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;
    address public chaosIdAddress;
    address public immutable usdcAddress;

    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 price);
    event ListingPurchased(uint256 indexed listingId, address indexed buyer, uint256 price);
    event ListingDelivered(uint256 indexed listingId);
    event ListingConfirmed(uint256 indexed listingId, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    event ChaosIdAddressUpdated(address indexed oldAddress, address indexed newAddress);
    event ChaosIdUpdateFailed(uint256 indexed listingId, address indexed seller);

    constructor(address _usdcAddress, address _chaosIdAddress) Ownable(msg.sender) {
        require(_usdcAddress != address(0), "ChaosMarket: zero usdc");
        require(_chaosIdAddress != address(0), "ChaosMarket: zero chaos id");

        usdcAddress = _usdcAddress;
        chaosIdAddress = _chaosIdAddress;
    }

    modifier validListing(uint256 listingId) {
        require(listingId > 0 && listingId <= listingCount, "ChaosMarket: invalid listing");
        _;
    }

    function createListing(
        string calldata title,
        string calldata description,
        string calldata category,
        uint256 price
    ) external returns (uint256 listingId) {
        require(price > 0, "ChaosMarket: price must be > 0");
        require(bytes(title).length > 0, "ChaosMarket: empty title");

        listingId = ++listingCount;

        listings[listingId] = Listing({
            seller: msg.sender,
            buyer: address(0),
            price: price,
            status: ListingStatus.Active,
            title: title,
            description: description,
            category: category,
            disputeDeadline: 0
        });

        emit ListingCreated(listingId, msg.sender, price);
    }

    function buyListing(uint256 listingId) external nonReentrant validListing(listingId) {
        Listing storage listing = listings[listingId];

        require(listing.status == ListingStatus.Active, "ChaosMarket: listing not active");
        require(msg.sender != listing.seller, "ChaosMarket: seller cannot buy");

        // USDC on Arc is non-deflationary; no balance-delta check needed
        IERC20(usdcAddress).safeTransferFrom(msg.sender, address(this), listing.price);

        listing.buyer = msg.sender;
        listing.status = ListingStatus.Sold;
        listing.disputeDeadline = block.timestamp + 7 days;

        emit ListingPurchased(listingId, msg.sender, listing.price);
    }

    function markDelivered(uint256 listingId) external validListing(listingId) {
        Listing storage listing = listings[listingId];

        require(msg.sender == listing.seller, "ChaosMarket: not seller");
        require(listing.status == ListingStatus.Sold, "ChaosMarket: listing not sold");

        listing.status = ListingStatus.Delivered;

        emit ListingDelivered(listingId);
    }

    function confirmDelivery(uint256 listingId) external nonReentrant validListing(listingId) {
        Listing storage listing = listings[listingId];

        require(msg.sender == listing.buyer, "ChaosMarket: not buyer");
        require(listing.status == ListingStatus.Delivered, "ChaosMarket: not delivered");

        listing.status = ListingStatus.Confirmed;
        IERC20(usdcAddress).safeTransfer(listing.seller, listing.price);

        try IChaosID(chaosIdAddress).recordTransaction(listing.seller, listing.price) {
            // no-op
        } catch {
            emit ChaosIdUpdateFailed(listingId, listing.seller);
        }

        emit ListingConfirmed(listingId, listing.seller, listing.price);
    }

    function reclaimExpiredListing(uint256 listingId) external nonReentrant validListing(listingId) {
        Listing storage listing = listings[listingId];

        require(msg.sender == listing.buyer, "ChaosMarket: not buyer");
        require(listing.status == ListingStatus.Sold, "ChaosMarket: listing not sold");
        require(block.timestamp > listing.disputeDeadline, "ChaosMarket: dispute window active");

        listing.status = ListingStatus.Cancelled;
        IERC20(usdcAddress).safeTransfer(listing.buyer, listing.price);

        emit ListingCancelled(listingId);
    }

    function claimUnconfirmedListing(uint256 listingId) external nonReentrant validListing(listingId) {
        Listing storage listing = listings[listingId];

        require(msg.sender == listing.seller, "ChaosMarket: not seller");
        require(listing.status == ListingStatus.Delivered, "ChaosMarket: not delivered");
        require(block.timestamp > listing.disputeDeadline + 7 days, "ChaosMarket: confirmation window active");

        listing.status = ListingStatus.Confirmed;
        IERC20(usdcAddress).safeTransfer(listing.seller, listing.price);

        try IChaosID(chaosIdAddress).recordTransaction(listing.seller, listing.price) {
            // no-op
        } catch {
            emit ChaosIdUpdateFailed(listingId, listing.seller);
        }

        emit ListingConfirmed(listingId, listing.seller, listing.price);
    }

    function cancelListing(uint256 listingId) external validListing(listingId) {
        Listing storage listing = listings[listingId];

        require(msg.sender == listing.seller, "ChaosMarket: not seller");
        require(listing.status == ListingStatus.Active, "ChaosMarket: cannot cancel");

        listing.status = ListingStatus.Cancelled;

        emit ListingCancelled(listingId);
    }

    function getListing(uint256 listingId) external view validListing(listingId) returns (Listing memory) {
        return listings[listingId];
    }

    function setChaosIdAddress(address newAddress) external onlyOwner {
        require(newAddress != address(0), "ChaosMarket: zero chaos id");
        address oldAddress = chaosIdAddress;
        chaosIdAddress = newAddress;
        emit ChaosIdAddressUpdated(oldAddress, newAddress);
    }
}
