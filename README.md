## loancoin-proof-of-concept-example-client
This is a proof-of-concept example of loancoin.  
Loancoin is a lending platform on Ethereum blockchain.
If you're interested in our product, please visit our [website](https://credithydra.com)

## Features
1. Login with uPort
2. Create wallet addresses based on eth-lightwallet module.
3. Add ether on private Ethereum network
4. Buy and sell token with the ether
5. [Lender] Initiate a loan on IPFS network
6. [Borrower] Applay a loan on IPFS network with profile data which is encrypted with lender's public key
7. [Lender] Evaluate the borrower's profile which is decrypted with lender's private key and accept a borrower on IPFS network to create a loan contract on smart contract on private Ethereum network
8. [Borrower] sign a contract on private network
9. [Lender] sign a contract on private network
10. [Borrower] Withdraw token
11. [Borrower] Payback token

## How to install
1. clone the repository
2. npm install
3. copy src/utils/Settings_example to src/utils/Settings and edit it.
4. Setup Ethereum private network, deploy smart contracts
5. Setup API server

## Todos and concerns
1. Generate a pdf file of legal document and store it on IPFS network
2. Tracking status and send notifications or email to stake holders
3. Implement more status like default
4. uPort integration may not be correct because this application use our own private network and uPort use test net.
5. Gas cost is very expensive. We need to figure out how to provide the service without gas cost before moving to main net.
6. Feature for lenders to upload more documents.
7. Feature for attestation.
8. We have not deal with credibility scores yet.

## License  
MIT. You can do whatever you want.  
