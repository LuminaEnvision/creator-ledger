import { ethers } from "hardhat";
import { PASSPORT_CONTRACT_ADDRESS } from "../src/lib/contracts";

async function main() {
  const contract = await ethers.getContractAt("CreatorPassport", PASSPORT_CONTRACT_ADDRESS);
  const owner = await contract.owner();
  console.log("Contract Owner (Deployer):", owner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

