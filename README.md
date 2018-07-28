# TravelBlock
A Solidity Smart-Contract responsible for issuing and processing payments using [TravelBlock](http://travelblock.io/) ERC20 tokens.


##Token Details

name: 'TRVL Token'
symbol: 'TRVL'
decimals: '18'
cap: 600,000,000

TRVL tokens are combination of regular tokens, and reward tokens. 

The regular tokens can be used as a means to purchase travel inventory on the TravelBlock booking website. Through using TRVL tokens, holders are able to convert part of their purchase into reward tokens. These variations of the TRVL token cannot be sold or transfered, and must be used exclusively on purchasing more travel inventory. 


### Processing Payments

There are 5 different methods to process payments on the TravelBlock Network.

paymentRegularTokensPriority(_amount, _rewardPercentageIndex) 
-> Prioritize using all available regular tokens first, <= the _amount specified. The remainder will be processed in reward tokens.

paymentRewardTokensPriority(_amount, _rewardPercentageIndex) 
-> Prioritize using all available reward tokens first, <= the _amount specified. The remainder will be processed in regular tokens.

paymentMixed(_regularTokenAmount, _rewardTokenAmount,  _rewardPercentageIndex) 
-> Process a predetermined amount of both regular and reward tokens. 

paymentRegularTokens(_regularTokenAmount, _rewardPercentageIndex) 
-> Process a payment using strictly regular tokens, with a specified reward percentage applied.

paymentRewardTokens(_rewardTokenAmount) 
-> Process a payment using strictly reward tokens. 


### Whitelist
The TravelBlock team will be in control of the wallet addresses used to interact with the network. As a result, they will be able to ensure the correct reward percentage is applied to the token purchase. 

### Reward Percentages
The TravelBlock team is in control of the percentage storage that is accessed to apply reward token bonuses to purchases. The owner of the contract can either add or update an existing reward percentage. 

Inputs for reward percentages are formated as follows:
	- Percentages must be between 0% and 100%	
	- Accurate up to 18 decimals 
	eg. 5% should be input as 5 x 10^18

### Libraries Used

The following OpenZeppelin Solidity contracts were used in this project:
- PausableToken.sol
- Claimable.sol
- HasNoTokens.sol

#### Owner Responsibility/User Risks

This contract has been thoroughly tested for potential vulnerabilities inside of its functionality. However, the TravelBlock team is responsible for anything external. Including but not limited to: Adding/removing Whitelisted addresses, inputting the correct reward percentage indexes.


#### DAPP details
!!! instructions/details to come...
