import { ethers } from 'hardhat';

async function main() {
  console.log('Deploying CoCreation contract...');

  const CoCreation = await ethers.getContractFactory('CoCreation');
  const coCreation = await CoCreation.deploy();

  await coCreation.waitForDeployment();
  const address = await coCreation.getAddress();

  console.log('CoCreation deployed to:', address);

  // Verify deployment
  const coCreationCounter = await coCreation.coCreationCounter();
  console.log('Initial coCreationCounter:', coCreationCounter.toString());

  return address;
}

main()
  .then((address) => {
    console.log('\nDeployment successful!');
    console.log('Contract address:', address);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
