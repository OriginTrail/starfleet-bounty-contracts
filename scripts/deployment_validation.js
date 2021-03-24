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
if (!['testnet', 'mainnet', 'development', 'ganache', 'xdai'].includes(network)) {
    throw Error(`Network "${network}" is not supported!`);
}

const constants = require('../constants.js')[network];

console.log(`Loaded constants: ${JSON.stringify(constants, null, 4)}`);

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
    console.log('Getting balance of bounty contract');
    let balance = await tokenContract.methods.balanceOf(bountyContractAddress).call();
    console.log(`Initial balance: ${balance}`);

    balance = await tokenContract.methods.balanceOf(wallet.address).call();
    console.log(`Wallet balance: ${balance}`);

    balance = await tokenContract.methods.balanceOf(bountyContractAddress).call();
    console.log(`Balance after deposit: ${balance}`);

    const receiver = '0xaeAfe9f7842E98e31053C926C848A3291A35bB95';
    const receiverPK = '0x1ae91aa113828d346a9030d08a2f6d0ff8af57de4634d4fb6473fbd380740d25';
    let allowed = await bountyContract.methods.getContributorBounty(receiver).call();
    console.log(`Initial allowed: ${allowed}`);

    let data = bountyContract.methods.stakeTokens([receiver], ["1000000000000000000"], true).encodeABI();
    let createTransaction = await web3.eth.accounts.signTransaction({
        from: wallet.address,
        to: bountyContractAddress,
        data,
        value: "0x00",
        gas: "400000",
        gasPrice: "1000000000",
    }, wallet.privateKey);
    let createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    console.log(JSON.stringify(createReceipt, null, 4));

    allowed = await bountyContract.methods.getContributorBounty(receiver).call();
    console.log(`Allowed after deposit: ${allowed}`);

    balance = await tokenContract.methods.balanceOf(receiver).call();
    console.log(`Initial balance: ${balance}`);

    data = bountyContract.methods.withdrawTokens().encodeABI();
    createTransaction = await web3.eth.accounts.signTransaction({
        from: receiver,
        to: bountyContractAddress,
        data,
        value: "0x00",
        gas: "400000",
        gasPrice: "1000000000",
    }, receiverPK);
    createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    console.log(JSON.stringify(createReceipt, null, 4));

    allowed = await bountyContract.methods.bounty(receiver).call();
    console.log(`Allowed after withdrawal: ${allowed}`);

    balance = await tokenContract.methods.balanceOf(receiver).call();
    console.log(`Balance after withdrawal: ${balance}`);

    return 0;
}

return main();
