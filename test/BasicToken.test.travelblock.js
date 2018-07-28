import assertRevert from 'openzeppelin-solidity/test/helpers/assertRevert.js';
const BasicToken = artifacts.require('TRVLToken');

const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('StandardToken', function ([owner, recipient, anotherAccount]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    this.token = await BasicToken.new();
  });

  describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        const balance = await this.token.balanceOf.call(anotherAccount);

        assert.equal(balance, 0);
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total amount of tokens', async function () {
        const totalSupply = await this.token.totalSupply.call();
        const balance = await this.token.balanceOf.call(owner);

        balance.should.be.bignumber.equal(totalSupply)
      });
    });
  });

  describe('transfer', function () {
    describe('when the recipient is not the zero address', function () {
      const to = recipient;

        describe('when the sender does not have enough balance', function () {

        it('reverts', async function () {
            const totalSupply = await this.token.totalSupply.call();
            const amount = totalSupply.add(1);
          await assertRevert(this.token.transfer(to, amount, { from: owner }));
        });
      });

      describe('when the sender has enough balance', function () {

        it('transfers the requested amount', async function () {
          const totalSupply = await this.token.totalSupply.call();
          const amount = totalSupply;

          await this.token.transfer(to, amount, { from: owner });

          const senderBalance = await this.token.balanceOf.call(owner);
          assert.equal(senderBalance, 0);

          const recipientBalance = await this.token.balanceOf.call(to);
          recipientBalance.should.be.bignumber.equal(amount);
        });

        it('emits a transfer event', async function () {
            const totalSupply = await this.token.totalSupply.call();
            const amount = totalSupply;
          const { logs } = await this.token.transfer(to, amount, { from: owner });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Transfer');
          assert.equal(logs[0].args.from, owner);
          assert.equal(logs[0].args.to, to);
          assert(logs[0].args.value.eq(amount));
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const to = ZERO_ADDRESS;

      it('reverts', async function () {
        await assertRevert(this.token.transfer(to, 100, { from: owner }));
      });
    });
  });
});
