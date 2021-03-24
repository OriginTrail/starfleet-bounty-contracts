require('dotenv').config();
const fs = require('fs');

let walletFilepath = `./metadata/ganache_wallet.json`;
let ganache_wallet;
if (fs.existsSync(walletFilepath)) {
    ganache_wallet = JSON.parse(fs.readFileSync(walletFilepath, { encoding: 'utf-8' }));
}
walletFilepath = `./metadata/development_wallet.json`;
let development_wallet;
if (fs.existsSync(walletFilepath)) {
    development_wallet = JSON.parse(fs.readFileSync(walletFilepath, { encoding: 'utf-8' }));
}
walletFilepath = `./metadata/testnet_wallet.json`;
let testnet_wallet;
if (fs.existsSync(walletFilepath)) {
    testnet_wallet = JSON.parse(fs.readFileSync(walletFilepath, { encoding: 'utf-8' }));
}
walletFilepath = `./metadata/mainnet_wallet.json`;
let mainnet_wallet;
if (fs.existsSync(walletFilepath)) {
    mainnet_wallet = JSON.parse(fs.readFileSync(walletFilepath, { encoding: 'utf-8' }));
}
walletFilepath = `./metadata/xdai_wallet.json`;
let xdai_wallet;
if (fs.existsSync(walletFilepath)) {
    xdai_wallet = JSON.parse(fs.readFileSync(walletFilepath, { encoding: 'utf-8' }));
}


let addressFilepath = `./metadata/ganache_address.json`;
let ganache_address;
if (fs.existsSync(addressFilepath)) {
    ganache_address = JSON.parse(fs.readFileSync(addressFilepath, { encoding: 'utf-8' }));
    ganache_address = ganache_address.address;
}
addressFilepath = `./metadata/development_address.json`;
let development_address;
if (fs.existsSync(addressFilepath)) {
    development_address = JSON.parse(fs.readFileSync(addressFilepath, { encoding: 'utf-8' }));
    development_address = development_address.address;
}
addressFilepath = `./metadata/testnet_address.json`;
let testnet_address;
if (fs.existsSync(addressFilepath)) {
    testnet_address = JSON.parse(fs.readFileSync(addressFilepath, { encoding: 'utf-8' }));
    testnet_address = testnet_address.address;
}
addressFilepath = `./metadata/mainnet_address.json`;
let mainnet_address;
if (fs.existsSync(addressFilepath)) {
    mainnet_address = JSON.parse(fs.readFileSync(addressFilepath, { encoding: 'utf-8' }));
    mainnet_address = mainnet_address.address;
}
addressFilepath = `./metadata/xdai_address.json`;
let xdai_address;
if (fs.existsSync(addressFilepath)) {
    xdai_address = JSON.parse(fs.readFileSync(addressFilepath, { encoding: 'utf-8' }));
    xdai_address = xdai_address.address;
}
addressFilepath = `./metadata/staging_address.json`;
let staging_address;
if (fs.existsSync(addressFilepath)) {
    staging_address = JSON.parse(fs.readFileSync(addressFilepath, { encoding: 'utf-8' }));
    staging_address = staging_address.address;
}


module.exports = {
    ganache: {
        rpc_endpoint : 'http://127.0.0.1:7545',
        account: ganache_wallet,
        bounty_address: ganache_address,
        owner_address: '0x238F1746F5b5E31fF71306084324E26d922447d4',
    },
    soliditycoverage: {
        rpc_endpoint : 'http://127.0.0.1:7545',
        account: ganache_wallet,
        bounty_address: ganache_address,
        owner_address: '0x238F1746F5b5E31fF71306084324E26d922447d4',
    },
    development: {
        rpc_endpoint : 'http://127.0.0.1:8545',
        account: development_wallet,
        bounty_address: development_address,
        token_address: '0x26B4902B69d032561d956c0036866f012365e405',
        owner_address: '0x238F1746F5b5E31fF71306084324E26d922447d4',
    },
    testnet: {
        rpc_endpoint : `${process.env.XDAI_RPC_ENDPOINT}`,
        account: testnet_wallet,
        bounty_address: testnet_address,
        owner_address: `${process.env.TESTNET_OWNER_ADDRESS}`,
        token_address: '0x18F75411914f45665f352908F1D3D11f0Eb01f2A',
    },
    mainnet: {
        rpc_endpoint : `${process.env.XDAI_RPC_ENDPOINT}`,
        account: mainnet_wallet,
        bounty_address: mainnet_address,
        owner_address: `${process.env.MAINNET_OWNER_ADDRESS}`,
        token_address: '0xEddd81E0792E764501AaE206EB432399a0268DB5',
    },
    xdai: {
        rpc_endpoint : `${process.env.XDAI_RPC_ENDPOINT}`,
        account: xdai_wallet,
        bounty_address: xdai_address,
        owner_address: `${process.env.XDAI_OWNER_ADDRESS}`,
        token_address: '0x18F75411914f45665f352908F1D3D11f0Eb01f2A',
    },
    staging: {
        rpc_endpoint : `${process.env.XDAI_RPC_ENDPOINT}`,
        account: xdai_wallet,
        bounty_address: staging_address,
        owner_address: `${process.env.XDAI_ADDRESS}`,
        token_address: '0x18F75411914f45665f352908F1D3D11f0Eb01f2A',
    },
};