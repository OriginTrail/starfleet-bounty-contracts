require('dotenv').config();

const Crypto = require('crypto');
const Web3 = require('web3');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

// Load network to be used

let network;
if (argv.hasOwnProperty('network')) {
    network = argv.network;
} else if (Object.keys(argv).length > 1) {
    network = Object.keys(argv).pop();
}
console.log(`Using network ${network}`);

// Verify that the network is okay to be used
if (!['testnet', 'mainnet', 'development', 'staging', 'ganache', 'xdai'].includes(network)) {
    throw Error(`Network "${network}" is not supported!`);
}

const constants = require('../constants.js')[network];

// Load web3
const web3 = new Web3(new Web3.providers.HttpProvider(constants.rpc_endpoint));

// Load wallet
const wallet = constants.account;
if (!wallet) {
    throw Error(`Wallet does not exist for network "${network}"!`);
}

// Load contract data
//      Load contract abi
const bountyContractAbi = require('../build/contracts/StarfleetBounty').abi;
//      Load contract address
const bountyContractAddress = constants.bounty_address;
if (!bountyContractAddress) {
    throw Error(`Staking contract does not exist for network "${network}"!`);
}
//      Initialize smart contact
const bountyContract = new web3.eth.Contract(bountyContractAbi, bountyContractAddress);

// Load contract data
//      Load contract abi
const tokenContractAbi = require('../build/contracts/IERC677').abi;
//      Load contract address
const tokenContractAddress = constants.token_address;
if (!tokenContractAddress) {
    throw Error(`Staking contract does not exist for network "${network}"!`);
}
//      Initialize smart contact
const tokenContract = new web3.eth.Contract(tokenContractAbi, tokenContractAddress);


function reportError(message, expected, actual) {
    console.log("=============== Error ================");
    console.log(`${message}`);
    if (expected && actual) {
        console.log(`\tExpected: ${expected}`);
        console.log(`\tActual: ${actual}`);
    }
    console.log(" ");
}

async function main() {
    console.log('Getting data of bounty contract');
    console.log(`\tContract address:  ${bountyContract.options.address}`);

    let owner = await bountyContract.methods.owner().call();
    console.log(`\tOwner wallet:  ${owner}`);

    let tokenAddress = await bountyContract.methods.getTokenAddress().call();
    console.log(`\tToken address: ${tokenAddress}`);

    let withdrawalsEnabled = await bountyContract.methods.withdrawals_enabled().call();
    console.log(`\tCan withdraw:  ${withdrawalsEnabled}`);

    return 0;
}

return main();
