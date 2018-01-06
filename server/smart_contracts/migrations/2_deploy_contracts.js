var CreditHydraToken = artifacts.require("./CreditHydraToken.sol");
var LoancoinToken = artifacts.require("./LoancoinToken.sol");
var LoancoinContract = artifacts.require("./LoancoinContract.sol");

module.exports = function(deployer) {
  deployer.deploy(CreditHydraToken, { gas: 4700000 });
  deployer.deploy(LoancoinToken, 1000000,{ gas: 4700000 });
  deployer.deploy(LoancoinContract, 1000000,{ gas: 4700000 });
};
