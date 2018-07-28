var TravelToken = artifacts.require("../contracts/TRVLToken.sol");
module.exports = function(deployer) {
  deployer.deploy(TravelToken);
};
