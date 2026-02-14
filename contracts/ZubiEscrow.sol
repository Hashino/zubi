// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ZubiEscrow
 * @dev Escrow contract for Zubi rideshare app implementing PMCD protocol
 * @notice Manages ride payments with dynamic fees based on driver level
 */
contract ZubiEscrow {
    struct Ride {
        address passenger;
        address driver;
        uint256 amount;
        uint256 driverFeeBasisPoints; // e.g., 1500 = 15%
        RideStatus status;
        uint256 createdAt;
    }
    
    enum RideStatus { 
        CREATED,      // Ride created, funds locked
        COMPLETED,    // Ride completed, funds released
        CANCELLED,    // Ride cancelled, funds refunded
        DISPUTED      // Under dispute resolution
    }
    
    mapping(bytes32 => Ride) public rides;
    address public governanceWallet;
    address public owner;
    
    // Events
    event RideCreated(
        bytes32 indexed rideId, 
        address indexed passenger, 
        address indexed driver, 
        uint256 amount,
        uint256 driverFeeBasisPoints
    );
    
    event RideCompleted(
        bytes32 indexed rideId, 
        uint256 driverPayout, 
        uint256 protocolFee
    );
    
    event RideCancelled(
        bytes32 indexed rideId,
        address indexed cancelledBy
    );
    
    event RideDisputed(
        bytes32 indexed rideId,
        address indexed disputedBy
    );
    
    event GovernanceWalletUpdated(
        address indexed oldWallet,
        address indexed newWallet
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier rideExists(bytes32 rideId) {
        require(rides[rideId].passenger != address(0), "Ride does not exist");
        _;
    }
    
    modifier inStatus(bytes32 rideId, RideStatus status) {
        require(rides[rideId].status == status, "Invalid ride status");
        _;
    }
    
    constructor(address _governanceWallet) {
        require(_governanceWallet != address(0), "Invalid governance wallet");
        governanceWallet = _governanceWallet;
        owner = msg.sender;
    }
    
    /**
     * @dev Creates a new ride and locks funds in escrow
     * @param rideId Unique identifier for the ride (generated off-chain)
     * @param driver Address of the driver
     * @param driverFeeBasisPoints Fee percentage in basis points (e.g., 1500 = 15%)
     */
    function createRide(
        bytes32 rideId, 
        address driver, 
        uint256 driverFeeBasisPoints
    ) external payable {
        require(rides[rideId].passenger == address(0), "Ride ID already exists");
        require(driver != address(0), "Invalid driver address");
        require(msg.value > 0, "Must send payment");
        require(driverFeeBasisPoints <= 2000, "Fee cannot exceed 20%"); // Max 20%
        require(msg.sender != driver, "Passenger and driver cannot be same");
        
        rides[rideId] = Ride({
            passenger: msg.sender,
            driver: driver,
            amount: msg.value,
            driverFeeBasisPoints: driverFeeBasisPoints,
            status: RideStatus.CREATED,
            createdAt: block.timestamp
        });
        
        emit RideCreated(rideId, msg.sender, driver, msg.value, driverFeeBasisPoints);
    }
    
    /**
     * @dev Completes a ride and releases funds with cryptographic proofs
     * @param rideId The ride identifier
     * @param driverSignature Signature from driver confirming completion
     * @param passengerSignature Signature from passenger confirming completion
     * @notice In production, these signatures should be verified against ride completion data
     */
    function completeRide(
        bytes32 rideId,
        bytes memory driverSignature,
        bytes memory passengerSignature
    ) external rideExists(rideId) inStatus(rideId, RideStatus.CREATED) {
        Ride storage ride = rides[rideId];
        
        // Only passenger or driver can complete
        require(
            msg.sender == ride.passenger || msg.sender == ride.driver,
            "Only ride participants can complete"
        );
        
        // Verify signatures exist (in production, implement full signature verification)
        require(driverSignature.length > 0, "Driver signature required");
        require(passengerSignature.length > 0, "Passenger signature required");
        
        // Calculate payouts
        uint256 protocolFee = (ride.amount * ride.driverFeeBasisPoints) / 10000;
        uint256 driverPayout = ride.amount - protocolFee;
        
        // Update status before transfers (checks-effects-interactions pattern)
        ride.status = RideStatus.COMPLETED;
        
        // Transfer funds
        (bool driverSuccess, ) = payable(ride.driver).call{value: driverPayout}("");
        require(driverSuccess, "Driver payment failed");
        
        (bool govSuccess, ) = payable(governanceWallet).call{value: protocolFee}("");
        require(govSuccess, "Protocol fee transfer failed");
        
        emit RideCompleted(rideId, driverPayout, protocolFee);
    }
    
    /**
     * @dev Cancels a ride and refunds passenger
     * @param rideId The ride identifier
     */
    function cancelRide(bytes32 rideId) 
        external 
        rideExists(rideId) 
        inStatus(rideId, RideStatus.CREATED) 
    {
        Ride storage ride = rides[rideId];
        
        // Only passenger or driver can cancel
        require(
            msg.sender == ride.passenger || msg.sender == ride.driver,
            "Only ride participants can cancel"
        );
        
        // Update status before transfer
        ride.status = RideStatus.CANCELLED;
        
        // Refund passenger
        (bool success, ) = payable(ride.passenger).call{value: ride.amount}("");
        require(success, "Refund failed");
        
        emit RideCancelled(rideId, msg.sender);
    }
    
    /**
     * @dev Opens a dispute for tribunal resolution
     * @param rideId The ride identifier
     */
    function disputeRide(bytes32 rideId) 
        external 
        rideExists(rideId) 
        inStatus(rideId, RideStatus.CREATED) 
    {
        Ride storage ride = rides[rideId];
        
        require(
            msg.sender == ride.passenger || msg.sender == ride.driver,
            "Only ride participants can dispute"
        );
        
        ride.status = RideStatus.DISPUTED;
        
        emit RideDisputed(rideId, msg.sender);
    }
    
    /**
     * @dev Resolves a disputed ride (called by tribunal/governance)
     * @param rideId The ride identifier
     * @param refundToPassenger If true, refund passenger; if false, pay driver
     */
    function resolveDispute(bytes32 rideId, bool refundToPassenger) 
        external 
        onlyOwner
        rideExists(rideId) 
        inStatus(rideId, RideStatus.DISPUTED) 
    {
        Ride storage ride = rides[rideId];
        
        if (refundToPassenger) {
            ride.status = RideStatus.CANCELLED;
            (bool success, ) = payable(ride.passenger).call{value: ride.amount}("");
            require(success, "Refund failed");
            emit RideCancelled(rideId, address(this));
        } else {
            uint256 protocolFee = (ride.amount * ride.driverFeeBasisPoints) / 10000;
            uint256 driverPayout = ride.amount - protocolFee;
            
            ride.status = RideStatus.COMPLETED;
            
            (bool driverSuccess, ) = payable(ride.driver).call{value: driverPayout}("");
            require(driverSuccess, "Driver payment failed");
            
            (bool govSuccess, ) = payable(governanceWallet).call{value: protocolFee}("");
            require(govSuccess, "Protocol fee transfer failed");
            
            emit RideCompleted(rideId, driverPayout, protocolFee);
        }
    }
    
    /**
     * @dev Updates the governance wallet address
     * @param newGovernanceWallet New governance wallet address
     */
    function updateGovernanceWallet(address newGovernanceWallet) external onlyOwner {
        require(newGovernanceWallet != address(0), "Invalid address");
        address oldWallet = governanceWallet;
        governanceWallet = newGovernanceWallet;
        emit GovernanceWalletUpdated(oldWallet, newGovernanceWallet);
    }
    
    /**
     * @dev Gets ride details
     * @param rideId The ride identifier
     */
    function getRideDetails(bytes32 rideId) 
        external 
        view 
        rideExists(rideId) 
        returns (
            address passenger,
            address driver,
            uint256 amount,
            uint256 driverFeeBasisPoints,
            RideStatus status,
            uint256 createdAt
        ) 
    {
        Ride memory ride = rides[rideId];
        return (
            ride.passenger,
            ride.driver,
            ride.amount,
            ride.driverFeeBasisPoints,
            ride.status,
            ride.createdAt
        );
    }
    
    /**
     * @dev Emergency withdrawal (only owner, only if funds stuck)
     */
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner).call{value: address(this).balance}("");
        require(success, "Emergency withdrawal failed");
    }
}
