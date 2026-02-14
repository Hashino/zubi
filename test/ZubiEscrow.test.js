const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZubiEscrow", function () {
  let escrow;
  let owner;
  let passenger;
  let driver;
  let governance;
  
  const RIDE_AMOUNT = ethers.parseEther("0.1"); // 0.1 MATIC
  const DRIVER_FEE_BP = 1500; // 15%
  
  beforeEach(async function () {
    [owner, passenger, driver, governance] = await ethers.getSigners();
    
    const ZubiEscrow = await ethers.getContractFactory("ZubiEscrow");
    escrow = await ZubiEscrow.deploy(governance.address);
    await escrow.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the correct governance wallet", async function () {
      expect(await escrow.governanceWallet()).to.equal(governance.address);
    });
    
    it("Should set the correct owner", async function () {
      expect(await escrow.owner()).to.equal(owner.address);
    });
  });
  
  describe("Create Ride", function () {
    it("Should create a ride and lock funds", async function () {
      const rideId = ethers.id("ride123");
      
      await expect(
        escrow.connect(passenger).createRide(
          rideId,
          driver.address,
          DRIVER_FEE_BP,
          { value: RIDE_AMOUNT }
        )
      ).to.emit(escrow, "RideCreated")
        .withArgs(rideId, passenger.address, driver.address, RIDE_AMOUNT, DRIVER_FEE_BP);
      
      const ride = await escrow.getRideDetails(rideId);
      expect(ride.passenger).to.equal(passenger.address);
      expect(ride.driver).to.equal(driver.address);
      expect(ride.amount).to.equal(RIDE_AMOUNT);
      expect(ride.status).to.equal(0); // CREATED
    });
    
    it("Should reject ride with no payment", async function () {
      const rideId = ethers.id("ride123");
      
      await expect(
        escrow.connect(passenger).createRide(rideId, driver.address, DRIVER_FEE_BP)
      ).to.be.revertedWith("Must send payment");
    });
    
    it("Should reject duplicate ride ID", async function () {
      const rideId = ethers.id("ride123");
      
      await escrow.connect(passenger).createRide(
        rideId,
        driver.address,
        DRIVER_FEE_BP,
        { value: RIDE_AMOUNT }
      );
      
      await expect(
        escrow.connect(passenger).createRide(
          rideId,
          driver.address,
          DRIVER_FEE_BP,
          { value: RIDE_AMOUNT }
        )
      ).to.be.revertedWith("Ride ID already exists");
    });
    
    it("Should reject excessive fee", async function () {
      const rideId = ethers.id("ride123");
      const excessiveFee = 2001; // 20.01%
      
      await expect(
        escrow.connect(passenger).createRide(
          rideId,
          driver.address,
          excessiveFee,
          { value: RIDE_AMOUNT }
        )
      ).to.be.revertedWith("Fee cannot exceed 20%");
    });
  });
  
  describe("Complete Ride", function () {
    let rideId;
    
    beforeEach(async function () {
      rideId = ethers.id("ride123");
      await escrow.connect(passenger).createRide(
        rideId,
        driver.address,
        DRIVER_FEE_BP,
        { value: RIDE_AMOUNT }
      );
    });
    
    it("Should complete ride and distribute funds correctly", async function () {
      const driverSig = ethers.hexlify(ethers.randomBytes(65));
      const passengerSig = ethers.hexlify(ethers.randomBytes(65));
      
      const driverBalanceBefore = await ethers.provider.getBalance(driver.address);
      const govBalanceBefore = await ethers.provider.getBalance(governance.address);
      
      await escrow.connect(passenger).completeRide(rideId, driverSig, passengerSig);
      
      const driverBalanceAfter = await ethers.provider.getBalance(driver.address);
      const govBalanceAfter = await ethers.provider.getBalance(governance.address);
      
      const protocolFee = (RIDE_AMOUNT * BigInt(DRIVER_FEE_BP)) / BigInt(10000);
      const driverPayout = RIDE_AMOUNT - protocolFee;
      
      expect(driverBalanceAfter - driverBalanceBefore).to.equal(driverPayout);
      expect(govBalanceAfter - govBalanceBefore).to.equal(protocolFee);
      
      const ride = await escrow.getRideDetails(rideId);
      expect(ride.status).to.equal(1); // COMPLETED
    });
    
    it("Should reject completion without signatures", async function () {
      await expect(
        escrow.connect(passenger).completeRide(rideId, "0x", "0x")
      ).to.be.revertedWith("Driver signature required");
    });
    
    it("Should reject completion by non-participant", async function () {
      const [, , , , other] = await ethers.getSigners();
      const driverSig = ethers.hexlify(ethers.randomBytes(65));
      const passengerSig = ethers.hexlify(ethers.randomBytes(65));
      
      await expect(
        escrow.connect(other).completeRide(rideId, driverSig, passengerSig)
      ).to.be.revertedWith("Only ride participants can complete");
    });
  });
  
  describe("Cancel Ride", function () {
    let rideId;
    
    beforeEach(async function () {
      rideId = ethers.id("ride123");
      await escrow.connect(passenger).createRide(
        rideId,
        driver.address,
        DRIVER_FEE_BP,
        { value: RIDE_AMOUNT }
      );
    });
    
    it("Should cancel ride and refund passenger", async function () {
      const passengerBalanceBefore = await ethers.provider.getBalance(passenger.address);
      
      const tx = await escrow.connect(passenger).cancelRide(rideId);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      
      const passengerBalanceAfter = await ethers.provider.getBalance(passenger.address);
      
      expect(passengerBalanceAfter - passengerBalanceBefore + gasCost).to.equal(RIDE_AMOUNT);
      
      const ride = await escrow.getRideDetails(rideId);
      expect(ride.status).to.equal(2); // CANCELLED
    });
    
    it("Should allow driver to cancel", async function () {
      await expect(
        escrow.connect(driver).cancelRide(rideId)
      ).to.emit(escrow, "RideCancelled")
        .withArgs(rideId, driver.address);
    });
  });
  
  describe("Dispute Resolution", function () {
    let rideId;
    
    beforeEach(async function () {
      rideId = ethers.id("ride123");
      await escrow.connect(passenger).createRide(
        rideId,
        driver.address,
        DRIVER_FEE_BP,
        { value: RIDE_AMOUNT }
      );
    });
    
    it("Should open dispute", async function () {
      await expect(
        escrow.connect(passenger).disputeRide(rideId)
      ).to.emit(escrow, "RideDisputed")
        .withArgs(rideId, passenger.address);
      
      const ride = await escrow.getRideDetails(rideId);
      expect(ride.status).to.equal(3); // DISPUTED
    });
    
    it("Should resolve dispute in favor of passenger", async function () {
      await escrow.connect(passenger).disputeRide(rideId);
      
      const passengerBalanceBefore = await ethers.provider.getBalance(passenger.address);
      
      await escrow.connect(owner).resolveDispute(rideId, true);
      
      const passengerBalanceAfter = await ethers.provider.getBalance(passenger.address);
      expect(passengerBalanceAfter - passengerBalanceBefore).to.equal(RIDE_AMOUNT);
    });
    
    it("Should resolve dispute in favor of driver", async function () {
      await escrow.connect(passenger).disputeRide(rideId);
      
      const driverBalanceBefore = await ethers.provider.getBalance(driver.address);
      const govBalanceBefore = await ethers.provider.getBalance(governance.address);
      
      await escrow.connect(owner).resolveDispute(rideId, false);
      
      const driverBalanceAfter = await ethers.provider.getBalance(driver.address);
      const govBalanceAfter = await ethers.provider.getBalance(governance.address);
      
      const protocolFee = (RIDE_AMOUNT * BigInt(DRIVER_FEE_BP)) / BigInt(10000);
      const driverPayout = RIDE_AMOUNT - protocolFee;
      
      expect(driverBalanceAfter - driverBalanceBefore).to.equal(driverPayout);
      expect(govBalanceAfter - govBalanceBefore).to.equal(protocolFee);
    });
    
    it("Should reject dispute resolution by non-owner", async function () {
      await escrow.connect(passenger).disputeRide(rideId);
      
      await expect(
        escrow.connect(passenger).resolveDispute(rideId, true)
      ).to.be.revertedWith("Only owner can call this");
    });
  });
  
  describe("Governance", function () {
    it("Should update governance wallet", async function () {
      const [, , , , newGov] = await ethers.getSigners();
      
      await expect(
        escrow.connect(owner).updateGovernanceWallet(newGov.address)
      ).to.emit(escrow, "GovernanceWalletUpdated")
        .withArgs(governance.address, newGov.address);
      
      expect(await escrow.governanceWallet()).to.equal(newGov.address);
    });
    
    it("Should reject governance update by non-owner", async function () {
      const [, , , , newGov] = await ethers.getSigners();
      
      await expect(
        escrow.connect(passenger).updateGovernanceWallet(newGov.address)
      ).to.be.revertedWith("Only owner can call this");
    });
  });
});
