const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("PFF Global Nation — Smart Contract Suite", function () {
  // Fixture for deploying all contracts
  async function deployPFFFixture() {
    const [architect, citizen1, citizen2, bankingPartner, other] = await ethers.getSigners();

    // Deploy SovereignVida
    const SovereignVida = await ethers.getContractFactory("SovereignVida");
    const vidaToken = await SovereignVida.deploy(
      architect.address, // temp national
      architect.address, // temp foundation
      architect.address  // architect
    );

    // Deploy NationalBlockNG
    const NationalBlockNG = await ethers.getContractFactory("NationalBlockNG");
    const nationalBlock = await NationalBlockNG.deploy(
      await vidaToken.getAddress(),
      architect.address
    );

    // Deploy FoundationVault
    const FoundationVault = await ethers.getContractFactory("FoundationVault");
    const foundationVault = await FoundationVault.deploy(
      await vidaToken.getAddress(),
      architect.address
    );

    // Deploy SovrynSentinelGate
    const SovrynSentinelGate = await ethers.getContractFactory("SovrynSentinelGate");
    const sentinelGate = await SovrynSentinelGate.deploy(architect.address);

    // Link contracts
    await sentinelGate.linkContracts(
      await vidaToken.getAddress(),
      await nationalBlock.getAddress(),
      await foundationVault.getAddress()
    );

    // Grant roles
    await vidaToken.grantMinterRole(await sentinelGate.getAddress());
    await nationalBlock.grantSentinelRole(await sentinelGate.getAddress());
    await foundationVault.grantSentinelRole(await sentinelGate.getAddress());

    return {
      vidaToken,
      nationalBlock,
      foundationVault,
      sentinelGate,
      architect,
      citizen1,
      citizen2,
      bankingPartner,
      other,
    };
  }

  describe("SovereignVida Token", function () {
    it("Should deploy with correct pre-mint distribution", async function () {
      const { vidaToken, architect } = await loadFixture(deployPFFFixture);

      const totalSupply = await vidaToken.totalSupply();
      const premintSupply = ethers.parseEther("110000000"); // 110M VIDA

      expect(totalSupply).to.equal(premintSupply);
    });

    it("Should have correct token metadata", async function () {
      const { vidaToken } = await loadFixture(deployPFFFixture);

      expect(await vidaToken.name()).to.equal("Sovereign VIDA");
      expect(await vidaToken.symbol()).to.equal("VIDA");
      expect(await vidaToken.decimals()).to.equal(18);
    });

    it("Should grant MINTER_ROLE to SentinelGate", async function () {
      const { vidaToken, sentinelGate } = await loadFixture(deployPFFFixture);

      const isMinter = await vidaToken.isMinter(await sentinelGate.getAddress());
      expect(isMinter).to.be.true;
    });

    it("Should prevent non-minters from minting", async function () {
      const { vidaToken, other } = await loadFixture(deployPFFFixture);

      await expect(
        vidaToken.connect(other).mint(other.address, ethers.parseEther("1000"))
      ).to.be.reverted;
    });

    it("Should enforce max supply cap", async function () {
      const { vidaToken, sentinelGate } = await loadFixture(deployPFFFixture);

      const maxSupply = await vidaToken.MAX_SUPPLY();
      const currentSupply = await vidaToken.totalSupply();
      const excessAmount = maxSupply - currentSupply + ethers.parseEther("1");

      await expect(
        vidaToken.connect(sentinelGate).mint(sentinelGate.address, excessAmount)
      ).to.be.revertedWith("SovereignVida: max supply exceeded");
    });
  });

  describe("NationalBlockNG Vault", function () {
    it("Should receive VIDA deposits from SentinelGate", async function () {
      const { vidaToken, nationalBlock, sentinelGate, architect } = await loadFixture(deployPFFFixture);

      // Mint VIDA to SentinelGate
      const depositAmount = ethers.parseEther("5");
      await vidaToken.mint(await sentinelGate.getAddress(), depositAmount);

      // Approve and deposit
      await vidaToken.connect(architect).approve(await nationalBlock.getAddress(), depositAmount);
      await sentinelGate.connect(architect).vitalizeCitizen(architect.address);

      const balance = await nationalBlock.viewBalance();
      expect(balance).to.be.gt(0);
    });

    it("Should track treasury metrics correctly", async function () {
      const { nationalBlock, sentinelGate, citizen1 } = await loadFixture(deployPFFFixture);

      await sentinelGate.vitalizeCitizen(citizen1.address);

      const metrics = await nationalBlock.getTreasuryMetrics();
      expect(metrics.citizensVitalized).to.equal(1);
      expect(metrics.deposited).to.equal(ethers.parseEther("5"));
    });

    it("Should allow release requests", async function () {
      const { nationalBlock, citizen1 } = await loadFixture(deployPFFFixture);

      const requestTx = await nationalBlock.connect(citizen1).requestRelease(
        ethers.parseEther("100"),
        "Infrastructure Project",
        "Build roads in Lagos"
      );

      await expect(requestTx)
        .to.emit(nationalBlock, "ReleaseRequested")
        .withArgs(0, citizen1.address, ethers.parseEther("100"), "Infrastructure Project");
    });

    it("Should allow architect to approve and execute releases", async function () {
      const { nationalBlock, sentinelGate, architect, citizen1 } = await loadFixture(deployPFFFixture);

      // Vitalize to add funds
      await sentinelGate.vitalizeCitizen(citizen1.address);

      // Request release
      await nationalBlock.connect(citizen1).requestRelease(
        ethers.parseEther("1"),
        "Test Project",
        "Testing"
      );

      // Approve
      await nationalBlock.connect(architect).approveRelease(0);

      // Execute
      await nationalBlock.connect(architect).executeRelease(0, citizen1.address);

      const request = await nationalBlock.getReleaseRequest(0);
      expect(request.executed).to.be.true;
    });

    it("Should allow adding banking partners", async function () {
      const { nationalBlock, architect, bankingPartner } = await loadFixture(deployPFFFixture);

      await nationalBlock.connect(architect).addBankingPartner(
        bankingPartner.address,
        "United Bank for Africa (UBA)"
      );

      const isPartner = await nationalBlock.isBankingPartner(bankingPartner.address);
      expect(isPartner).to.be.true;
    });
  });

  describe("FoundationVault", function () {
    it("Should receive VIDA deposits from SentinelGate", async function () {
      const { foundationVault, sentinelGate, citizen1 } = await loadFixture(deployPFFFixture);

      await sentinelGate.vitalizeCitizen(citizen1.address);

      const balance = await foundationVault.totalBalance();
      expect(balance).to.equal(ethers.parseEther("1")); // 1 VIDA per vitalization
    });

    it("Should lock VIDA as collateral", async function () {
      const { foundationVault, sentinelGate, architect, bankingPartner, citizen1 } = await loadFixture(deployPFFFixture);

      // Add banking partner
      await foundationVault.connect(architect).addBankingPartner(
        bankingPartner.address,
        "United Bank for Africa (UBA)"
      );

      // Vitalize to add funds
      await sentinelGate.vitalizeCitizen(citizen1.address);

      // Lock collateral
      const lockTx = await foundationVault.connect(architect).lockForCollateral(
        bankingPartner.address,
        ethers.parseEther("1"),
        "LOAN-2024-001",
        "Tech infrastructure loan",
        365 // 1 year
      );

      await expect(lockTx)
        .to.emit(foundationVault, "CollateralLocked")
        .withArgs(0, bankingPartner.address, ethers.parseEther("1"), "LOAN-2024-001");

      const metrics = await foundationVault.getVaultMetrics();
      expect(metrics.locked).to.equal(ethers.parseEther("1"));
      expect(metrics.available).to.equal(0);
    });

    it("Should verify collateral for banking partners", async function () {
      const { foundationVault, sentinelGate, architect, bankingPartner, citizen1 } = await loadFixture(deployPFFFixture);

      await foundationVault.connect(architect).addBankingPartner(bankingPartner.address, "UBA");
      await sentinelGate.vitalizeCitizen(citizen1.address);

      await foundationVault.connect(architect).lockForCollateral(
        bankingPartner.address,
        ethers.parseEther("1"),
        "LOAN-001",
        "Test loan",
        365
      );

      const [lock, isValid] = await foundationVault.verifyCollateral(0);
      expect(isValid).to.be.true;
      expect(lock.amount).to.equal(ethers.parseEther("1"));
      expect(lock.loanReference).to.equal("LOAN-001");
    });

    it("Should release collateral", async function () {
      const { foundationVault, sentinelGate, architect, bankingPartner, citizen1 } = await loadFixture(deployPFFFixture);

      await foundationVault.connect(architect).addBankingPartner(bankingPartner.address, "UBA");
      await sentinelGate.vitalizeCitizen(citizen1.address);

      await foundationVault.connect(architect).lockForCollateral(
        bankingPartner.address,
        ethers.parseEther("1"),
        "LOAN-001",
        "Test loan",
        365
      );

      await foundationVault.connect(architect).releaseCollateral(0);

      const [lock, isValid] = await foundationVault.verifyCollateral(0);
      expect(isValid).to.be.false;
      expect(lock.active).to.be.false;
    });
  });

  describe("SovrynSentinelGate", function () {
    it("Should vitalize citizen with correct 11-way split", async function () {
      const { vidaToken, nationalBlock, foundationVault, sentinelGate, citizen1 } = await loadFixture(deployPFFFixture);

      await sentinelGate.vitalizeCitizen(citizen1.address);

      // Check citizen received 5 VIDA
      const citizenBalance = await vidaToken.balanceOf(citizen1.address);
      expect(citizenBalance).to.equal(ethers.parseEther("5"));

      // Check National Block received 5 VIDA
      const nationalBalance = await nationalBlock.viewBalance();
      expect(nationalBalance).to.equal(ethers.parseEther("5"));

      // Check Foundation received 1 VIDA
      const foundationBalance = await foundationVault.totalBalance();
      expect(foundationBalance).to.equal(ethers.parseEther("1"));
    });

    it("Should prevent double vitalization", async function () {
      const { sentinelGate, citizen1 } = await loadFixture(deployPFFFixture);

      await sentinelGate.vitalizeCitizen(citizen1.address);

      await expect(
        sentinelGate.vitalizeCitizen(citizen1.address)
      ).to.be.revertedWith("SovrynSentinelGate: citizen already vitalized");
    });

    it("Should track vitalization status", async function () {
      const { sentinelGate, citizen1 } = await loadFixture(deployPFFFixture);

      await sentinelGate.vitalizeCitizen(citizen1.address);

      const [vitalized, timestamp] = await sentinelGate.checkVitalizationStatus(citizen1.address);
      expect(vitalized).to.be.true;
      expect(timestamp).to.be.gt(0);
    });

    it("Should batch vitalize multiple citizens", async function () {
      const { vidaToken, sentinelGate, citizen1, citizen2, other } = await loadFixture(deployPFFFixture);

      const citizens = [citizen1.address, citizen2.address, other.address];
      await sentinelGate.vitalizeCitizenBatch(citizens);

      // Check all citizens received 5 VIDA
      for (const citizen of citizens) {
        const balance = await vidaToken.balanceOf(citizen);
        expect(balance).to.equal(ethers.parseEther("5"));
      }

      // Check system metrics
      const metrics = await sentinelGate.getSystemMetrics();
      expect(metrics.citizensVitalized).to.equal(3);
      expect(metrics.vidaMinted).to.equal(ethers.parseEther("33")); // 11 * 3
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete vitalization flow", async function () {
      const { vidaToken, nationalBlock, foundationVault, sentinelGate, citizen1 } = await loadFixture(deployPFFFixture);

      const initialSupply = await vidaToken.totalSupply();

      // Vitalize citizen
      await sentinelGate.vitalizeCitizen(citizen1.address);

      // Verify total supply increased by 11 VIDA
      const newSupply = await vidaToken.totalSupply();
      expect(newSupply - initialSupply).to.equal(ethers.parseEther("11"));

      // Verify distribution
      expect(await vidaToken.balanceOf(citizen1.address)).to.equal(ethers.parseEther("5"));
      expect(await nationalBlock.viewBalance()).to.equal(ethers.parseEther("5"));
      expect(await foundationVault.totalBalance()).to.equal(ethers.parseEther("1"));
    });

    it("Should handle multiple vitalizations", async function () {
      const { sentinelGate, nationalBlock, citizen1, citizen2 } = await loadFixture(deployPFFFixture);

      await sentinelGate.vitalizeCitizen(citizen1.address);
      await sentinelGate.vitalizeCitizen(citizen2.address);

      const metrics = await nationalBlock.getTreasuryMetrics();
      expect(metrics.citizensVitalized).to.equal(2);
      expect(metrics.deposited).to.equal(ethers.parseEther("10")); // 5 * 2
    });
  });
});
