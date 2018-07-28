function TestConstants(){

}
const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

const TRAVELTOKENCONTRACT = artifacts.require('TRVLToken');

TestConstants.tokenContract;

TestConstants.setTokenContract = function (contract) {
    TestConstants.tokenContract = contract;
};

/// @dev Takes in a list of addresses and a list of values, and transfers the corresponding amounts to them from the owners account
TestConstants.transferTokens = async function (accounts, balances, owner) {
    for (let i = 0; i < accounts.length; ++i) {
        await TestConstants.tokenContract.transfer(accounts[i], balances[i], {from: owner})
    }
};

/// @dev Checks if the ERC20 test token holds the right balances.
/// Consumes an array of addresses, and an array of values.
/// Returns true if the values are equal.
TestConstants.checkTokenBalances = async function (accounts, balances) {
    for (let i = 0; i < accounts.length; ++i) {
        let actual = await TestConstants.tokenContract.balanceOf.call(accounts[i]);
        let expected = balances[i];

        if (!actual.should.be.bignumber.equal(expected)){
            return false;
        }
    }
    return true;
};

/// @dev Checks if the contract is storing the correct reward token balances.
/// Consumes an array of addresses, and an array of values.
/// Returns true if the values are equal.
TestConstants.checkRewardTokenBalances = async function (accounts, balances) {
    for (let i = 0; i < accounts.length; ++i) {
        let actual = await TestConstants.tokenContract.rewardBalances(accounts[i]);
        let expected = balances[i];

        if (actual != expected){
            return false;
        }
    }
    return true;
};

module.exports = TestConstants;
