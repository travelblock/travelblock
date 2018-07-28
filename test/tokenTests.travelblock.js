import assertRevert from 'openzeppelin-solidity/test/helpers/assertRevert.js';
import Constants from './TestConstants.travelblock.js';
const BigNumber = web3.BigNumber;

const TRAVELTOKENCONTRACT = artifacts.require('TRVLToken');

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('Create Travel Token Contract - TravelBlock', function (accounts) {
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    const Owner = accounts[0];
    const USER_1 = accounts[1];
    const USER_2 = accounts[2];
    const USER_3 = accounts[3];
    const BadGuy = accounts[4];

    const USERS = [Owner, USER_1, USER_2, USER_3];

    beforeEach(async function() {
        // Sets up a ERC20 Travel Tokens Contract to conduct tests with
        this.travelTokenContract = await TRAVELTOKENCONTRACT.new({from: Owner});
        Constants.setTokenContract(this.travelTokenContract);
        // Adds Owner to list of admins
        await this.travelTokenContract.addAddressesToAdmins([Owner], {from: Owner});
        // Adds USERS list to the whitelist
        await this.travelTokenContract.addAddressesToWhitelist(USERS, {from: Owner});
    });

    describe('Contract contains the correct amount of currently minted tokens', async function() {



        beforeEach(async function () {
            let startingOwnersBalance = await this.travelTokenContract.balanceOf.call(Owner);
            let totalSupply = await this.travelTokenContract.totalSupply.call();

            // Verifies and sets up tokens for following tests
            startingOwnersBalance.should.be.bignumber.equal(totalSupply);
            assert(await Constants.checkTokenBalances(USERS, [startingOwnersBalance, 0, 0, 0]));
            assert(await Constants.checkRewardTokenBalances(USERS, [0, 0, 0, 0]));
            await Constants.transferTokens(USERS, [startingOwnersBalance - 3000, 1000, 1000, 1000], Owner);
        });

        it('Whitelist values are empty', async function () {
            assert.equal(await this.travelTokenContract.whitelist(Owner), true);
        });

        it('Reverts when add addresses to whitelist is called from a BadGuy', async function () {
            assert.equal(await this.travelTokenContract.whitelist(BadGuy), false);
            await assertRevert(this.travelTokenContract.addAddressesToWhitelist([BadGuy], {from: BadGuy}));
            assert.equal(await this.travelTokenContract.whitelist(BadGuy), false);
        });

        it('Reverts when whitelisted values are removed by a BadGuy', async function () {
            await assertRevert(this.travelTokenContract.removeAddressesFromWhitelist(USERS, {from: BadGuy}));
            assert.equal(await this.travelTokenContract.whitelist(Owner), true);
        });

        it('Allows Owner to call an adminOnly function, even if they are not explicitly on the admins list', async function () {
            await this.travelTokenContract.removeAddressesFromWhitelist([Owner], {from: Owner});
            await this.travelTokenContract.addRewardPercentage(10, {from: Owner});
            assert.equal(await this.travelTokenContract.rewardPercentage(0), 10, {from: Owner});
        });

        it('Reverts when address(0) is added to whitelist', async function () {
            await assertRevert(this.travelTokenContract.addAddressesToWhitelist([ZERO_ADDRESS], {from: Owner}));
            assert.equal(await this.travelTokenContract.whitelist(ZERO_ADDRESS), false);
        });

        it('Reverts when address(0) is added to admins', async function () {
            await assertRevert(this.travelTokenContract.addAddressesToAdmins([ZERO_ADDRESS], {from: Owner}));
            assert.equal(await this.travelTokenContract.admins(ZERO_ADDRESS), false);
        });

        it('Reverts when empty list is added to admins', async function () {
            await assertRevert(this.travelTokenContract.addAddressesToAdmins([], {from: Owner}));
        });

        it('Reverts when empty list is removed to admins', async function () {
            await assertRevert(this.travelTokenContract.removeAddressesFromAdmins([], {from: Owner}));
        });

        it('Adding admins who are already on admins, will not emit an event', async function () {
            const { logs } = await this.travelTokenContract.addAddressesToAdmins([Owner], {from: Owner});
            assert.equal(logs.length, 0);
        });

        it('Adding whitelisters who are already on whitelist, will not emit an event', async function () {
            const { logs } = await this.travelTokenContract.addAddressesToWhitelist([USER_1], {from: Owner});
            assert.equal(logs.length, 0);
        });

        it('Removing whitelisters who are not on whitelist, will not emit an event', async function () {
            const { logs } = await this.travelTokenContract.removeAddressesFromWhitelist([BadGuy], {from: Owner});
            assert.equal(logs.length, 0);
        });

        it('Removing admins who are not admins already, will not emit an event', async function () {
            const { logs } = await this.travelTokenContract.removeAddressesFromAdmins([BadGuy], {from: Owner});
            assert.equal(logs.length, 0);
        });

        it('Values are removed by owner from whitelist', async function () {
            await this.travelTokenContract.removeAddressesFromWhitelist(USERS, {from: Owner});
            assert.equal(await this.travelTokenContract.whitelist(Owner), false);
        });

        it('Values are removed by owner from admins', async function () {
            await this.travelTokenContract.removeAddressesFromAdmins(USERS, {from: Owner});
            assert.equal(await this.travelTokenContract.admins(Owner), false);
        });

        it('Tries to update a reward index that doesntexist', async function () {
            await assertRevert(this.travelTokenContract.updateRewardPercentageByIndex(0, 0, {from: Owner}));
            await this.travelTokenContract.addRewardPercentage(10, {from: Owner});
            assert.equal(await this.travelTokenContract.rewardPercentage(0), 10, {from: Owner});
        });

        it('Reverts when a BadGuy tries to update percentage indexes', async function () {
            await this.travelTokenContract.addRewardPercentage(10, {from: Owner});
            await assertRevert(this.travelTokenContract.addRewardPercentage(0, {from: BadGuy}));
            await assertRevert(this.travelTokenContract.updateRewardPercentageByIndex(0, 0, {from: BadGuy}));
            assert.equal(await this.travelTokenContract.rewardPercentage(0), 10, {from: Owner});
        });

        it('Updates an index value that exists when Owner calls it', async function () {
            await this.travelTokenContract.addRewardPercentage(10, {from: Owner});
            await this.travelTokenContract.updateRewardPercentageByIndex(0, 0, {from: Owner});
            assert.equal(await this.travelTokenContract.rewardPercentage(0), 0, {from: Owner});
        });

        it('Reverts when we try to add a 100% + 1 reward value', async function () {
            let maxDivisor = await this.travelTokenContract.rewardPercentageDivisor();
            await assertRevert(this.travelTokenContract.addRewardPercentage(maxDivisor.add(1), {from: Owner}));
        });

        it('Add a 100% reward value', async function () {
            let maxDivisor = await this.travelTokenContract.rewardPercentageDivisor();
            await this.travelTokenContract.addRewardPercentage(maxDivisor, {from: Owner});
            let actual = await this.travelTokenContract.rewardPercentage(0);
            let expected = maxDivisor;
            assert(actual.equals(expected));
        });
    });
});

contract('Create Travel Token Contract with default values -', function(accounts) {
    const Owner = accounts[0];
    const USER_1 = accounts[1];
    const USER_2 = accounts[2];
    const USER_3 = accounts[3];
    const BadGuy = accounts[4];

    const USERS = [Owner, USER_1, USER_2, USER_3];

    beforeEach(async function() {
        // Sets up a ERC20 Travel Tokens Contract to conduct tests with
        this.travelTokenContract = await TRAVELTOKENCONTRACT.new();
        Constants.setTokenContract(this.travelTokenContract);


        // Adds Owner to list of admins
        await this.travelTokenContract.addAddressesToAdmins([Owner], {from: Owner});
        // Adds USERS list to the whitelist
        await this.travelTokenContract.addAddressesToWhitelist(USERS, {from: Owner});

        // Updates reward percentage values
        let maxDivisor = await this.travelTokenContract.rewardPercentageDivisor();
        await this.travelTokenContract.addRewardPercentage(0, {from: Owner});
        // Add 50% bonus rate
        await this.travelTokenContract.addRewardPercentage(50 * (Math.pow(10, 18)), {from: Owner});
        // Add 25% bonus rate
        await this.travelTokenContract.addRewardPercentage(maxDivisor/4, {from: Owner});

        // Distribute tokens
        await Constants.transferTokens(USERS, [1000, 1000, 1000, 1000], Owner);
    });

    describe('Contract is initialized', async function () {

        describe('user is removed from whitelist and cant process payments', async function(){

            it('Reverts when an empty list is passed to removeAddressFromWhitelist function', async function() {
            await assertRevert(this.travelTokenContract.removeAddressesFromWhitelist([], {from: Owner}));
            });

            it('Reverts when an empty list is passed to addAddressToWhitelist function', async function() {
                await assertRevert(this.travelTokenContract.addAddressesToWhitelist([], {from: Owner}));
            });

            it('User is removed from the whitelist', async function() {
                await this.travelTokenContract.removeAddressesFromWhitelist([USER_1], {from: Owner});
            });

            it('Reverts when the users who was removed tries to process a payment', async function() {
                await this.travelTokenContract.removeAddressesFromWhitelist([USER_1], {from: Owner});
                await assertRevert(this.travelTokenContract.paymentRegularTokens(500, 0, {from: USER_1}));
            });
        });

        describe('User calls a paymentRegularTokens method', async function() {

            it('Verifies token balances before we make alterations', async function() {
                let totalSupply = await this.travelTokenContract.totalSupply.call();
                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(3000), 1000, 1000, 1000]));
                assert(await Constants.checkRewardTokenBalances(USERS, [0, 0, 0, 0]));
            });

            it('Reverts with zero amount', async function() {
                await assertRevert(this.travelTokenContract.paymentRegularTokens(0, 0, {from: USER_1}));
            });

            it('Process payments', async function() {
                await this.travelTokenContract.paymentRegularTokens(500, 0, {from: USER_1});
                await this.travelTokenContract.paymentRegularTokens(600, 1, {from: USER_2});
                await this.travelTokenContract.paymentRegularTokens(800, 2, {from: USER_3});
            });

            it('Reverts when the user tries to process payment that is more than they have', async function() {
                await assertRevert(this.travelTokenContract.paymentRegularTokens(1100, 0, {from: USER_1}));
            });

            it('Reverts when non whitelisted users tries to process a payment', async function() {
                await assertRevert(this.travelTokenContract.paymentRegularTokens(500, 0, {from: BadGuy}));
            });

            it('Check balances are updated accordingly', async function() {
                let totalSupply = await this.travelTokenContract.totalSupply.call();
                // Make Payments
                await this.travelTokenContract.paymentRegularTokens(500, 0, {from: USER_1});
                await this.travelTokenContract.paymentRegularTokens(600, 1, {from: USER_2});
                await this.travelTokenContract.paymentRegularTokens(800, 2, {from: USER_3});
                // Check balances
                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(1600), 500, 400, 200]));
                assert(await Constants.checkRewardTokenBalances(USERS, [0, 0, 300, 200]));
            });
        });

        describe('User calls a paymentRewardTokens method', async function() {
            // Process payments
            beforeEach(async function () {
                await this.travelTokenContract.paymentRegularTokens(500, 0, {from: USER_1});
                await this.travelTokenContract.paymentRegularTokens(600, 1, {from: USER_2});
                await this.travelTokenContract.paymentRegularTokens(800, 2, {from: USER_3});
            });

            it('Reverts when non whitelisted user tries to process a payment', async function() {
                await assertRevert(this.travelTokenContract.paymentRewardTokens(1, {from: BadGuy}));
            });

            it('Make rewards payment', async function() {
                await this.travelTokenContract.paymentRewardTokens(50, {from: USER_2});
                await this.travelTokenContract.paymentRewardTokens(50, {from: USER_2});
            });

            it('Reverts when user is out of reward tokens', async function() {
                await this.travelTokenContract.paymentRewardTokens(200, {from: USER_3});
                await assertRevert(this.travelTokenContract.paymentRewardTokens(1, {from: USER_3}));
            });

            it('check values are updated properly', async function() {
                let totalSupply = await this.travelTokenContract.totalSupply.call();
                await this.travelTokenContract.paymentRewardTokens(50, {from: USER_2});
                await this.travelTokenContract.paymentRewardTokens(50, {from: USER_2});
                await this.travelTokenContract.paymentRewardTokens(200, {from: USER_3});

                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(1600), 500, 400, 200]));
                assert(await Constants.checkRewardTokenBalances(USERS, [300, 0, 200, 0]));
            });
        });

        describe('User calls a paymentMixed method', async function() {
            // Process payments
            beforeEach(async function () {
                await this.travelTokenContract.paymentRegularTokens(500, 0, {from: USER_1});
                await this.travelTokenContract.paymentRegularTokens(600, 1, {from: USER_2});
                await this.travelTokenContract.paymentRegularTokens(800, 2, {from: USER_3});
            });

            it('Reverts when non whitelisted user tries to process a payment', async function() {
                await assertRevert(this.travelTokenContract.paymentMixed(1, 1, 1, {from: BadGuy}));
            });

            it('Make rewards payment - check values are updated properly', async function() {
                let totalSupply = await this.travelTokenContract.totalSupply.call();
                await this.travelTokenContract.paymentMixed(10, 100, 1, {from: USER_2});
                await this.travelTokenContract.paymentMixed(20, 10, 2, {from: USER_2});
                await this.travelTokenContract.paymentMixed(50, 50, 1, {from: USER_3});

                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(1555), 500, 370, 150]));
                assert(await Constants.checkRewardTokenBalances(USERS, [160, 0, 200, 175]));
            });
        });

        describe('User calls a paymentRegularTokensPriority method', async function() {
            // Process payments
            beforeEach(async function () {
                await this.travelTokenContract.paymentRegularTokens(500, 0, {from: USER_1});
                await this.travelTokenContract.paymentRegularTokens(600, 1, {from: USER_2});
                await this.travelTokenContract.paymentRegularTokens(800, 2, {from: USER_3});
            });

            it('Check values updated', async function() {
                let totalSupply = await this.travelTokenContract.totalSupply.call();
                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(1600), 500, 400, 200]));
                assert(await Constants.checkRewardTokenBalances(USERS, [0, 0, 300, 200]));
            });

            it('Reverts when non whitelisted user tries to process a payment', async function() {
                await assertRevert(this.travelTokenContract.paymentRegularTokensPriority(1, 1, {from: BadGuy}));
            });

            it('Reverts because user does not have enough tokens', async function() {
                await assertRevert(this.travelTokenContract.paymentRegularTokensPriority(800, 1, {from: USER_2}));
            });

            it('Process Payments - Check Values', async function() {
                let totalSupply = await this.travelTokenContract.totalSupply.call();
                await this.travelTokenContract.paymentRegularTokensPriority(350, 1, {from: USER_2});
                await this.travelTokenContract.paymentRegularTokensPriority(100, 1, {from: USER_3});

                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(1375), 500, 50, 100]));
                assert(await Constants.checkRewardTokenBalances(USERS, [0, 0, 475, 250]));

                await this.travelTokenContract.paymentRegularTokensPriority(100, 1, {from: USER_2});
                await this.travelTokenContract.paymentRegularTokensPriority(150, 1, {from: USER_3});

                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(1300), 500, 0, 0]));
                assert(await Constants.checkRewardTokenBalances(USERS, [100, 0, 450, 250]));
            });
        });

        describe('User calls a paymentRewardTokensPriority method', async function() {
            // Process payments
            beforeEach(async function () {
                await this.travelTokenContract.paymentRegularTokens(500, 0, {from: USER_1});
                await this.travelTokenContract.paymentRegularTokens(600, 1, {from: USER_2});
                await this.travelTokenContract.paymentRegularTokens(800, 2, {from: USER_3});
            });

            it('Check values updated', async function() {
                let totalSupply = await this.travelTokenContract.totalSupply.call();
                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(1600), 500, 400, 200]));
                assert(await Constants.checkRewardTokenBalances(USERS, [0, 0, 300, 200]));
            });

            it('Reverts when non whitelisted user tries to process a payment', async function() {
                await assertRevert(this.travelTokenContract.paymentRewardTokensPriority(1, 1, {from: BadGuy}));
            });

            it('Reverts because user does not have enough tokens', async function() {
                await assertRevert(this.travelTokenContract.paymentRewardTokensPriority(800, 1, {from: USER_2}));
            });

            it('Make rewards payment - check values stored', async function() {
                let totalSupply = await this.travelTokenContract.totalSupply.call();
                await this.travelTokenContract.paymentRewardTokensPriority(250, 1, {from: USER_2});
                await this.travelTokenContract.paymentRewardTokensPriority(100, 1, {from: USER_2});
                await this.travelTokenContract.paymentRewardTokensPriority(50, 1, {from: USER_3});
                await this.travelTokenContract.paymentRewardTokensPriority(50, 1, {from: USER_3});

                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(1575), 500, 350, 200]));
                assert(await Constants.checkRewardTokenBalances(USERS, [400, 0, 25, 100]));

                await this.travelTokenContract.paymentRegularTokens(180, 1, {from: USER_3});
                await assertRevert(this.travelTokenContract.paymentRewardTokensPriority(220, 1, {from: USER_3}));
            });
        });

        describe('Owner converts tokens to user', async function(){
            it('Check values updated', async function() {
                let totalSupply = await this.travelTokenContract.totalSupply.call();
                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(3000), 1000, 1000, 1000]));
                assert(await Constants.checkRewardTokenBalances(USERS, [0, 0, 0, 0]));

                await this.travelTokenContract.convertRegularToRewardTokens(USER_1, 500, {from: Owner});

                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(3500), 1000, 1000, 1000]));
                assert(await Constants.checkRewardTokenBalances(USERS, [0, 500, 0, 0]));
            });

            it('Reverts when trying to convert tokens for a non-whitelisted user', async function() {
                let totalSupply = await this.travelTokenContract.totalSupply.call();
                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(3000), 1000, 1000, 1000]));
                assert(await Constants.checkRewardTokenBalances(USERS, [0, 0, 0, 0]));

                await assertRevert(this.travelTokenContract.convertRegularToRewardTokens(BadGuy, 500, {from: Owner}));

                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(3000), 1000, 1000, 1000]));
                assert(await Constants.checkRewardTokenBalances(USERS, [0, 0, 0, 0]));
            });

            it('Reverts when owner doesnt have enough tokens to convert', async function() {
                let totalSupply = await this.travelTokenContract.totalSupply.call();
                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(3000), 1000, 1000, 1000]));
                assert(await Constants.checkRewardTokenBalances(USERS, [0, 0, 0, 0]));

                await assertRevert(this.travelTokenContract.convertRegularToRewardTokens(USER_1, totalSupply.sub(2999), {from: Owner}));

                assert(await Constants.checkTokenBalances(USERS, [totalSupply.sub(3000), 1000, 1000, 1000]));
                assert(await Constants.checkRewardTokenBalances(USERS, [0, 0, 0, 0]));
            });
        });
    });
});
