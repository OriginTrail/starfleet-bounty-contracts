const assert = require('assert');
const chai = require('chai');
chai.use(require('chai-bignumber')());
const ganache = require('ganache-cli');
const timeMachine = require('ganache-time-traveler');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const BigNumber = web3.BigNumber;
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');
const TestTraceToken = artifacts.require("TestTraceToken");
const StarfleetBounty = artifacts.require("StarfleetBounty");
const Suicidal = artifacts.require("Suicidal");
const e18 = new web3.utils.toBN('1000000000000000000');
const million = new web3.utils.toBN('1000000').mul(e18);
const ETHER = e18;

const MIN_THRESHOLD = web3.utils.toBN('20').mul(million); //
const MAX_THRESHOLD = web3.utils.toBN('100').mul(million); //

let owner;
let bountyContract;
let token;
let dayInSeconds = 86400;
let BOUNTY_PERIOD_LENGTH = 90 * dayInSeconds;

beforeEach(async () => {

	token = await TestTraceToken.deployed();
	bountyContract = await StarfleetBounty.deployed();


});


contract('StarfleetBounty', async function(accounts) {

	describe('Token holder bounty functionality checks', function() {

		it('Sanity check', async function() {
			assert(true, 'This is true');
		});

		it("Account 0 (Contract manager) should be owner", async () => {
			let owner = await bountyContract.owner.call();
			assert.equal(owner, accounts[0]);
		});

		it("Account 1 should not be owner", async () => {
			let owner = await bountyContract.owner.call();
			assert.notEqual(owner, accounts[1]);
		});

		it("Token address correct", async () => {
			let token_address = await bountyContract.getTokenAddress.call();
			assert.equal(token_address, token.address);
		});

		it("Contract manager cannot renounce ownership", async () => {
			await truffleAssert.reverts(
				bountyContract.renounceOwnership(),
				"Cannot renounce ownership of contract",
			);
		});

		it("Contract manager can change ownership", async () => {
			let changeOfOwnership = await bountyContract.transferOwnership(accounts[1]);
			let newOwner = await bountyContract.owner.call();
			assert.equal(newOwner, accounts[1]);
		});


		it("Non-managers cannot change ownership", async () => {
			await truffleAssert.reverts(
				bountyContract.transferOwnership(accounts[1], {from: accounts[3]}),
				"Ownable: caller is not the owner",
			);
		});

		it('Cannot mistake TRAC address', async function() {
			let new_bounty_contract = await StarfleetBounty.new("0x0000000000000000000000000000000000000000");
			let result = await truffleAssert.createTransactionResult(new_bounty_contract, new_bounty_contract.transactionHash);

			truffleAssert.eventEmitted(result, 'TokenAddressSet', {
				token_address: "0xEddd81E0792E764501AaE206EB432399a0268DB5"
			});
		});

		it("Staking contract should have 0 tokens at deployment", async () => {
			assert.equal(await token.balanceOf( bountyContract.address), 0);
		});

		it("Account 0 has totaly supply (for testing purposes)", async () => {
			let balance = await token.balanceOf(accounts[0]);
			let totalSupply = web3.utils.toBN('500000000000000000000000000');
			assert.equal(balance.eq(totalSupply), true );
		});

		it("Staking contract should not accept ETH", async () => {
			await truffleAssert.reverts(bountyContract.sendTransaction({value: ETHER}));
		});

	});

});

contract('StarfleetBounty', async function(accounts) {

	before(async () => {

		token = await TestTraceToken.deployed();
		bountyContract = await StarfleetBounty.deployed();
	});

	describe('Bounty assignment checks', () => {

		it('Cannot assign bounty when arrays are not the same length', async function () {
			let contributors = [accounts[6], accounts[7]];
			let amounts = ['123'];
			await truffleAssert.reverts(bountyContract.assignBounty(contributors, amounts, true, {from: accounts[0]}));

		});

		it('Cannot assign bounty from a non manager account', async function () {
			let contributors = [accounts[6]];
			let amounts = ['123'];
			await truffleAssert.reverts(bountyContract.assignBounty(contributors, amounts, true, {from: accounts[1]}));
		});

		it('Contract manager can assign bounty (overwrite false)', async function () {
			let contributors = [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]];
			let amounts = [1000, 2000, 3000, 4000, 5000];
			await bountyContract.assignBounty(contributors, amounts, false, {from: accounts[0]});

			const bounty = await bountyContract.getContributorBounty(accounts[3]);
			const expected = 3000;
			assert(bounty.eqn(expected), `Received incorrect bounty! Got ${bounty.toString()} but expected ${expected}`);
		});

		it('Contract manager can overwrite mistaken value (overwrite true)', async function () {
			const new_amount = 4000;

			let contributors = [accounts[3]];
			let amounts = [new_amount];

			const initialBounty = await bountyContract.getContributorBounty(accounts[3]);
			assert(initialBounty.eq(new BN('3000')));

			await bountyContract.assignBounty(contributors, amounts, true, {from: accounts[0]});

			const finalBounty = await bountyContract.getContributorBounty(accounts[3]);
			assert(finalBounty.eq(new BN(new_amount)), `Received incorrect bounty after overwrite! Got ${finalBounty.toString()} but expected ${new_amount}`);
		});


		it('Contract manager cannot overwrite by accident (overwrite false)', async function () {
			let contributors = [accounts[3]];
			let amounts = [2999];

			let bounty = await bountyContract.getContributorBounty(accounts[3]);
			assert(bounty.eqn(4000));

			await bountyContract.assignBounty(contributors, amounts, false, {from: accounts[0]});

			bounty = await bountyContract.getContributorBounty(accounts[3]);
			assert(bounty.eqn(4000));
		});

	});

	describe('Bounty withdrawal checks', () => {

		it('Token holder cannot claim bounty when withdrawals are not enabled', async function() {
			let bounty = await bountyContract.getContributorBounty( accounts[1]);
			assert( !bounty.eqn(0));

			await truffleAssert.reverts(
				bountyContract.withdrawTokens({ from: accounts[1] }),
				"Withdrawals are disabled at this time!",
			);

			let balance = await token.balanceOf( accounts[1]);
			assert(balance.eqn(0));
			let bounty2 = await bountyContract.getContributorBounty( accounts[1]);
			assert(bounty.eq(bounty2));
		});

		it('Token holder cannot claim bounty when bounty is not available', async function() {
			await bountyContract.enableWithdrawals({ from: accounts[0]});

			const withdrawalsEnabled = await bountyContract.withdrawals_enabled();
			assert(withdrawalsEnabled, 'Cannot execute withdrawal because withdrawals are not enabled');

			let bounty = await bountyContract.getContributorBounty( accounts[6]);
			assert(bounty.eqn(0));

			await truffleAssert.reverts(
				bountyContract.withdrawTokens({ from: accounts[6] }),
				"Cannot withdraw if there are no tokens staked with this address",
			);

			let balance = await token.balanceOf( accounts[6]);
			assert(balance.eqn(0));
			let bounty2 = await bountyContract.getContributorBounty( accounts[6]);
			assert(bounty.eq(bounty2));
		});

		it('Token holder cannot claim bounty when tokens are not available', async function() {
			const withdrawalsEnabled = await bountyContract.withdrawals_enabled();
			assert(withdrawalsEnabled, 'Cannot execute withdrawal because withdrawals are not enabled');

			let bounty = await bountyContract.getContributorBounty( accounts[1]);
			assert( !bounty.eqn(0));

			await truffleAssert.reverts(
				bountyContract.withdrawTokens({ from: accounts[1] }),
				"Contract does not have enough tokens to execute withdrawal!",
			);

			let balance = await token.balanceOf( accounts[1]);
			assert(balance.eqn(0));
			let bounty2 = await bountyContract.getContributorBounty( accounts[1]);
			assert(bounty.eq(bounty2));
		});

		it('Token holder can claim bounty when bounty is available',async function() {
			token.transfer(bountyContract.address, MAX_THRESHOLD, { from: accounts[0]});

			const withdrawalsEnabled = await bountyContract.withdrawals_enabled();
			assert(withdrawalsEnabled, 'Cannot execute withdrawal because withdrawals are not enabled');

			let bounty = await bountyContract.getContributorBounty( accounts[1]);
			assert( !bounty.eqn(0));
			let balance = await token.balanceOf( accounts[1]);
			let bountyClaimed = await bountyContract.wasBountyClaimed( accounts[1]);
			assert(!bountyClaimed, 'Received incorrect bounty claimed status after withdrawal! ' +
				`Got ${bountyClaimed} but expected false`);

			const tx = await bountyContract.withdrawTokens({ from: accounts[1] });

			let bounty2 = await bountyContract.getContributorBounty( accounts[1]);
			assert(bounty2.eqn(0));
			let balance2 = await token.balanceOf( accounts[1]);
			assert(balance2.eq(balance.add(bounty)));

			bountyClaimed = await bountyContract.wasBountyClaimed( accounts[1]);
			assert(bountyClaimed, 'Received incorrect bounty claimed status after withdrawal! ' +
				`Got ${bountyClaimed} but expected true`);

			truffleAssert.eventEmitted(tx, 'BountyWithdrawn');
		});

		it('Token holder cannot claim bounty twice',async function() {
			let bountyClaimed = await bountyContract.wasBountyClaimed( accounts[1]);
			assert(bountyClaimed, 'Received incorrect bounty claimed status before starting! ' +
				`Got ${bountyClaimed} but expected true`);

			await truffleAssert.reverts(
				bountyContract.withdrawTokens({ from: accounts[1] }),
				"User has already claimed their bounty!",
			);
		});
	});

	describe('Misplaced funds checks' , () => {

		it('Cannot withdraw remaining tokens from a non manager account',async function() {
			await truffleAssert.reverts(
				bountyContract.withdrawRemainingTokens(token.address, {from: accounts[1] }),
				"Ownable: caller is not the owner",
			);
		});

		it('Cannot withdraw remaining tokens before the bounty period ends',async function() {
			await truffleAssert.reverts(
				bountyContract.withdrawRemainingTokens(token.address, {from: accounts[0] }),
				"Cannot withdraw before the bounty period ends",
			);
		});



		it('Cannot withdraw misplaced ether from a non manager account',async function() {
			await truffleAssert.reverts(
				bountyContract.withdrawMisplacedEther({from: accounts[1] }),
				"Ownable: caller is not the owner",
			);
		});

		it('In case of accidental Ether through selfDestruct, the withdrawMisplacedEther should be able to send to owner',async function() {

			const suicidal_contract = await Suicidal.new([], { from: accounts[0] });
			let result = await suicidal_contract.sendTransaction({value: ETHER, from: accounts[0] });
			truffleAssert.eventEmitted(result, 'EthReceived');

			await suicidal_contract.dieAndSendETH(bountyContract.address, { value: ETHER, from: accounts[0]});

			let initialBountyBalance = await web3.eth.getBalance(bountyContract.address);
			initialBountyBalance = new BN(initialBountyBalance);
			let initialOwnerBalance = await web3.eth.getBalance(accounts[0]);
			initialOwnerBalance = new BN(initialOwnerBalance);

			let tx = await bountyContract.withdrawMisplacedEther();

			let finalBountyBalance = await web3.eth.getBalance(bountyContract.address);
			finalBountyBalance = new BN(finalBountyBalance);
			let finalOwnerBalance = await web3.eth.getBalance(accounts[0]);
			finalOwnerBalance = new BN(finalOwnerBalance);

			assert(finalBountyBalance.eqn(0), `Bounty contract stil has ${finalBountyBalance.toString()} balance instead of 0`);
			assert(finalOwnerBalance.eq(initialOwnerBalance.add(initialBountyBalance)), 'Incorrect amount withdrawn');

			truffleAssert.eventEmitted(tx, 'MisplacedEtherWithdrawn');

		});
	});

	describe('Post bounty period checks' , () => {
		it('Cannot withdraw remaining tokens before the bounty period ends',async function() {
			await truffleAssert.reverts(
				bountyContract.withdrawRemainingTokens(token.address, {from: accounts[0] }),
				"Cannot withdraw before the bounty period ends",
			);
		});


		it('Token holder cannot claim bounty after the bounty period ends',async function() {
			const withdrawalsEnabled = await bountyContract.withdrawals_enabled();
			assert(withdrawalsEnabled, 'Cannot execute withdrawal because withdrawals are not enabled');

			await timeMachine.advanceTime(BOUNTY_PERIOD_LENGTH);

			let bounty = await bountyContract.getContributorBounty( accounts[2]);
			assert(!bounty.eqn(0));

			await truffleAssert.reverts(
				bountyContract.withdrawTokens({ from: accounts[2] }),
				"Bounty period has closed, cannot withdraw tokens anymore!",
			);

			let balance = await token.balanceOf( accounts[2]);
			assert(balance.eqn(0));
			let bounty2 = await bountyContract.getContributorBounty( accounts[2]);
			assert(bounty.eq(bounty2));
		});


		it('Can withdraw remaining tokens with withdrawMisplacedTokens after bounty period ended',async function() {

			let balance = await token.balanceOf( accounts[0]);
			let contractBalance = await token.balanceOf(bountyContract.address);

			await bountyContract.withdrawRemainingTokens(token.address, { from: accounts[0] });

			let balance2 = await token.balanceOf( accounts[0]);
			assert(balance2.eq(balance.add(contractBalance)));
			let contractBalance2 = await token.balanceOf(bountyContract.address);
			assert(contractBalance2.eqn(0));
		});
	});

	describe('Cancel withdrawals check', () => {

		it('Cannot cancel withdrawals from a non management wallet',async function() {
			await truffleAssert.reverts(
				bountyContract.cancelWithdrawals({from: accounts[1] }),
				"Ownable: caller is not the owner",
			);
		});

		it('Cancelling the withdrawals does what it should',async function() {
			token.transfer(bountyContract.address, MAX_THRESHOLD, { from: accounts[0]});

			let balance = await token.balanceOf( accounts[0]);
			let contractBalance = await token.balanceOf(bountyContract.address);
			assert(!contractBalance.eqn(0), "Contract does not have any tokens");

			let withdrawalsEnabled = await bountyContract.withdrawals_enabled();
			assert(withdrawalsEnabled, 'Withdrawals are not enabled');

			const tx = await bountyContract.cancelWithdrawals({ from: accounts[0] });
			truffleAssert.eventEmitted(tx, 'ContractCancelled');

			let balance2 = await token.balanceOf( accounts[0]);
			assert(balance2.eq(balance.add(contractBalance)));
			let contractBalance2 = await token.balanceOf(bountyContract.address);
			assert(contractBalance2.eqn(0));

			withdrawalsEnabled = await bountyContract.withdrawals_enabled();
			assert(!withdrawalsEnabled, 'Withdrawals are not disabled');
		});

		it('Enabling withdrawals after cancelling the withdrawals should fail',async function() {
			await truffleAssert.reverts(
				bountyContract.enableWithdrawals({from: accounts[0] }),
				"Cannot reenable withdrawals",
			);
		});

		it('Withdrawing tokens after cancelling the withdrawals should fail',async function() {
			let bounty = await bountyContract.getContributorBounty( accounts[2]);
			assert(!bounty.eqn(0));

			await truffleAssert.reverts(
				bountyContract.withdrawTokens({ from: accounts[2] }),
				"Withdrawals are disabled at this time!",
			);

			let balance = await token.balanceOf( accounts[2]);
			assert(balance.eqn(0));
			let bounty2 = await bountyContract.getContributorBounty( accounts[2]);
			assert(bounty.eq(bounty2));
		});
	});

});
