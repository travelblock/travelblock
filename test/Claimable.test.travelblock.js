import assertRevert from 'openzeppelin-solidity/test/helpers/assertRevert.js';

var Claimable = artifacts.require('TRVLToken');

contract('Claimable - TravelBlock', function (accounts) {
    let claimable;
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    beforeEach(async function () {
        claimable = await Claimable.new();
    });

    it('should have an owner', async function () {
        let owner = await claimable.owner();
        assert.isTrue(owner !== 0);
    });

    it('changes pendingOwner after transfer', async function () {
        let newOwner = accounts[1];
        await claimable.transferOwnership(newOwner);
        let pendingOwner = await claimable.pendingOwner();

        assert.isTrue(pendingOwner === newOwner);
    });

    it('should prevent to claimOwnership from no pendingOwner', async function () {
        await assertRevert(claimable.claimOwnership({from: accounts[2]}));
    });

    it('should prevent non-owners from transfering', async function () {
        const other = accounts[2];
        const owner = await claimable.owner.call();

        assert.isTrue(owner !== other);
        await assertRevert(claimable.transferOwnership(other, {from: other}));
    });

    it('loses owner after renouncement', async function () {
        await claimable.renounceOwnership();
        let owner = await claimable.owner();

        owner.should.eq(ZERO_ADDRESS);
    });

    describe('after initiating a transfer', function () {
        let newOwner;

        beforeEach(async function () {
            newOwner = accounts[1];
            await claimable.transferOwnership(newOwner);
        });

        it('changes allow pending owner to claim ownership', async function () {
            await claimable.claimOwnership({from: newOwner});
            let owner = await claimable.owner();

            assert.isTrue(owner === newOwner);
        });
    });
});
