const fs = require('fs');

const StarfleetBounty = artifacts.require("StarfleetBounty");
const TestTraceToken = artifacts.require("TestTraceToken");

module.exports = function (deployer, network, accounts) {
    const constants = require('../constants.js')[network];
    if (constants.bounty_address) {
        throw Error(`Contract is already deployed on ${network}, remove the file first before deployment`);
    }

    const tokenAddress = constants.token_address;
    const newOwner = constants.owner_address;
    const address_filepath = `./metadata/${network}_address.json`;

    if (network === 'ganache' || network === 'development') {
        deployer.deploy(TestTraceToken).then(function () {
            return deployer.deploy(StarfleetBounty, TestTraceToken.address);
        });
    }

    if (network === 'mainnet' || network === 'testnet' || network === 'xdai') {
        // Bounty deployment
        deployer.deploy(StarfleetBounty, tokenAddress).then(async function (stakingContract) {
            await stakingContract.transferOwnership(newOwner);
            const data = { address: stakingContract.address };
            fs.writeFileSync(address_filepath, JSON.stringify(data, null, 4));
        });
    }
};
