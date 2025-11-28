// fundAllAccounts.js
// Usage: npx hardhat run scripts/fundAllAccounts.js --network localhost

const hre = require("hardhat");

async function main() {
  // Get funder (first default Hardhat account)
  // Use a known funded account if possible
  const funderPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const funder = new hre.ethers.Wallet(funderPrivateKey, hre.ethers.provider);

  // List of addresses to fund
  const addresses = [
    "0x80df33359a4300aeb8ea3d80bb663f86aa6f4632", // regulator
    "0x6df42b18a2290ad3731b5cd431a7f49022e39c51", // doctor
    "0xe31248ab93ca5ced4b60c331e06b2fbe7ad40380", // patient
    "0x8F220e34d3EdD96d0f9C0Ed0aB724efc0309C606", // admin
    "0x97a4927c78ed0577ac2008b666b7a8f298edc1fb", // distributor
    "0xdb5e8462f9ef057fd39ca6cf9f739a805c3a633f", // manufacturer
    "0xaa3da828321ef7f280886f40f32b2d5957cd15eb", // pharmacist
  ];

  // Minimum balance threshold (10 ETH)
  const minBalance = hre.ethers.parseEther("10.0");

  for (const addr of addresses) {
    const balanceRaw = await hre.ethers.provider.getBalance(addr);
    const balance = hre.ethers.toBigInt(balanceRaw);
    const minBalanceBN = hre.ethers.toBigInt(minBalance);

    if (balance < minBalanceBN) {
      const topUp = minBalanceBN - balance;
      console.log(
        `Topping up ${addr} with ${hre.ethers.formatEther(
          topUp.toString()
        )} ETH (current: ${hre.ethers.formatEther(balance.toString())} ETH)...`
      );

      const tx = await funder.sendTransaction({
        to: addr,
        value: topUp,
      });
      await tx.wait();

      console.log(`✅ Topped up ${addr}. Tx: ${tx.hash}`);
    } else {
      console.log(
        `Skipping ${addr}, already has ${hre.ethers.formatEther(balance.toString())} ETH.`
      );
    }
  }

  console.log("All accounts have at least 10 ETH.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
