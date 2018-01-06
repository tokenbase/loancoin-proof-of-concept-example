import LoancoinTokenABI from '../LoancoinToken.json'
import LoancoinContractABI from '../LoancoinContract.json'
import CreditHydraTokenABI from '../CreditHydraToken.json'
import {
  SIGNATURE_MESSAGE,
  TOKEN_ADDRESS,
  LOAN_ADDRESS,
  HYDRA_ADDRESS
} from './Settings'
// import lightwallet from 'eth-lightwallet'
import EthUtil from 'ethereumjs-util'

let tokenInstance = null
let loanInstance = null
let hydraInstance = null

// prepare token contarct instance
const prepareTokenContract =  ({ web3 }) => {

  return Promise.resolve()
  .then(() => {
    // get instance if needed
    if (tokenInstance !== null){
      return Promise.resolve()
    }
    return new web3.eth.Contract(LoancoinTokenABI.abi, TOKEN_ADDRESS)
  })
  .then((results) => {
    // set instance if needed
    if (tokenInstance !== null){
      return Promise.resolve()
    }
    tokenInstance = results
    return Promise.resolve()
  })
}

// prepare loan contarct instance
const prepareLoanContract =  ({ web3 }) => {
  return Promise.resolve()
  .then(() => {
    // get instance if needed
    if (loanInstance !== null){
      return Promise.resolve()
    }
    return new web3.eth.Contract(LoancoinContractABI.abi, LOAN_ADDRESS)
  })
  .then((results) => {
    // set instance if needed
    if (loanInstance !== null){
      return Promise.resolve()
    }
    loanInstance = results
    return Promise.resolve()
  })
}

// prepare hydra contarct instance
const prepareHydraContract =  ({ web3 }) => {
  return Promise.resolve()
  .then(() => {
    // get instance if needed
    if (hydraInstance !== null){
      return Promise.resolve()
    }
    return new web3.eth.Contract(CreditHydraTokenABI.abi, HYDRA_ADDRESS)
  })
  .then((results) => {
    // set instance if needed
    if (hydraInstance !== null){
      return Promise.resolve()
    }
    hydraInstance = results
    return Promise.resolve()
  })
}

export const collateralOf = ({ web3, address, loan_hash }) => {

  return Promise.resolve()
  .then(() => {
    return prepareLoanContract({web3: web3})
  })
  .then(() => {
    // and get collateral
    return loanInstance.methods.collateralOf(address, loan_hash).call({from : address})
  })
}

// not user anymore ?
export const cancelCollateral = ({ web3, address, loan_hash, value, eth_balance }) => {

  return Promise.resolve()
  .then(() => {
    return prepareTokenContract({web3: web3})
  })
  .then(() => {
    // and get collateral estimate
    return tokenInstance.methods.cancelCollateral(loan_hash, LOAN_ADDRESS).estimateGas({
      from : address
    })
  })
  .then((results) => {
    // and get collateral send transaction
    console.log("estimateGas, cancelCollateral:", results)
    const estimateGas = parseInt(results, 10) + 100

    // return error if user don't have enough ether
    if (web3.utils.toWei(eth_balance) <= estimateGas ) {
      return Promise.reject(Error("Not enough ether"))
    }

    return tokenInstance.methods.cancelCollateral(loan_hash, LOAN_ADDRESS).send({
      from : address,
      gasPrice: 100000000000,
      gas: estimateGas,
    })
  })
}

// transer token from loan contract
export const transferFrom = ({ web3, address, loan_hash, value, eth_balance }) => {

  return Promise.resolve()
  .then(() => {
    return prepareTokenContract({web3: web3})
  })
  .then(() => {
    // and get collateral estimate
    return tokenInstance.methods.transferFrom(LOAN_ADDRESS, address, value).estimateGas({
      from : address
    })
  })
  .then((results) => {
    // and get collateral send transaction

    const estimateGas = parseInt(results, 10) + 100

    // return error if user don't have enough ether
    if (web3.utils.toWei(eth_balance) <= estimateGas ) {
      return Promise.reject(Error("Not enough ether"))
    }


    return tokenInstance.methods.transferFrom(LOAN_ADDRESS, address, value).send({
      from : address,
      gasPrice: 100000000000,
      gas: estimateGas,
    })
  })
}

// get the money back from escrow contract
export const getMoneyBackFromContract = ({ web3, address, loan_hash, value, eth_balance }) => {

  return Promise.resolve()
  .then(() => {
    return prepareTokenContract({web3: web3})
  })
  .then(() => {
    // approve collateral to move
    return cancelCollateral({ web3, address, loan_hash, value, eth_balance })
  })
  .then((results) => {
    // transfer loancoin
    return transferFrom({ web3, address, loan_hash, value, eth_balance })
  })
}



// return signed hash
export const getSignedhash = ({ web3, account, wallet, password }) => {

  return new Promise((resolve, reject) => {

    if (!password) {
      reject(Error("no password"))
    }

    wallet.keyFromPassword( password, (err, pwDerivedKey) => {
      if (err) {
        reject(Error(err))
        return;
      }

      // client-side
      const pKey = wallet.exportPrivateKey( account, pwDerivedKey )
      const pKeyx = new Buffer(pKey, 'hex');
      const messageHash = web3.utils.sha3(SIGNATURE_MESSAGE)
      const messageHashx = new Buffer(messageHash.substr(2), 'hex');
      const signedMessage = EthUtil.ecsign(messageHashx, pKeyx)
      const signedhash = EthUtil.toRpcSig(signedMessage.v, signedMessage.r, signedMessage.s).toString('hex')
      resolve(signedhash)
    })
  })
}


// sign on arbitrary message
export const createSignWithMessage = ({ web3, account, wallet, password, messageHash }) => {

  return new Promise((resolve, reject) => {

    if (!password) {
      reject(Error("no password"))
    }

    // lightwallet.keystore.deriveKeyFromPassword( password, (err, pwDerivedKey) => {
    wallet.keyFromPassword( password, (err, pwDerivedKey) => {
      if (err) {
        reject(Error(err))
        return;
      }

      // client-side
      const pKey = wallet.exportPrivateKey( account, pwDerivedKey)
      const pKeyx = new Buffer(pKey, 'hex');
      // const messageHash = web3.utils.sha3(SIGNATURE_MESSAGE)
      const messageHashx = new Buffer(messageHash.substr(2), 'hex');
      const signedMessage = EthUtil.ecsign(messageHashx, pKeyx)
      const signedhash = EthUtil.toRpcSig(signedMessage.v, signedMessage.r, signedMessage.s).toString('hex')
      resolve(signedhash)
    })
  })
}



// get the money back from escrow contract
export const moveTokenAsCollateral = ({ _value, _loanhash, web3, address, eth_balance }) => {

  const _byte = web3.utils.asciiToHex("moveTokenAsCollateral")

  return Promise.resolve()
  .then(() => {
    return prepareTokenContract({web3: web3})
  })
  .then(() => {
    // moveTokenAsCollateral estimate

    return tokenInstance.methods.moveTokenAsCollateral(_value, _loanhash, _byte, LOAN_ADDRESS).estimateGas({
      from : address
    })
  })
  .then((results) => {
    // moveTokenAsCollateral send transaction

    const estimateGas = parseInt(results, 10) + 100

    // return error if user don't have enough ether
    if (web3.utils.toWei(eth_balance) <= estimateGas ) {
      return Promise.reject(Error("Not enough ether"))
    }


    return tokenInstance.methods.moveTokenAsCollateral(_value, _loanhash, _byte, LOAN_ADDRESS).send({
      from : address,
      gasPrice: 100000000000,
      gas: estimateGas,
    })
  })
}

// check loancoin balance
export const checkLoancoinBalance = ({ web3, address }) => {

  return Promise.resolve()
  .then(() => {
    return prepareTokenContract({web3: web3})
  })
  .then((results) => {
    // check balance
    return tokenInstance.methods.balanceOf(address).call({from : address})
  })
}


// sell token to get ether back
export const sell = ({ web3, address, loancoin_in_input, eth_balance }) => {

  return Promise.resolve()
  .then(() => {
    return prepareTokenContract({web3: web3})
  })
  .then(() => {
    // and get collateral estimate
    return tokenInstance.methods.sell(loancoin_in_input).estimateGas({
      from : address
    })
  })
  .then((results) => {
    // and get collateral send transaction

    console.log("estimateGas, sell:", results)
    const estimateGas = parseInt(results, 10) + 100

    // return error if user don't have enough ether
    if (web3.utils.toWei(eth_balance) <= estimateGas ) {
      return Promise.reject(Error("Not enough ether"))
    }

    return tokenInstance.methods.sell(loancoin_in_input).send({
      from : address,
      gasPrice: 100000000000,
      gas: estimateGas,
    })
  })
}

// buy tokens
export const buy = ({ web3, address, ether_in_input, eth_balance }) => {

  const wei_value = web3.utils.toWei(ether_in_input)

  return Promise.resolve()
  .then(() => {
    return prepareTokenContract({web3: web3})
  })
  .then(() => {
    // and get collateral estimate
    return tokenInstance.methods.buy().estimateGas({
      from : address,
      value : wei_value,
    })
  })
  .then((results) => {
    // and get collateral send transaction

    console.log("estimateGas, buy:", results)
    const estimateGas = parseInt(results, 10) + 100

    // return error if user don't have enough ether
    if (web3.utils.toWei(eth_balance) <= estimateGas ) {
      return Promise.reject(Error("Not enough ether"))
    }

    // this dont return sining error
    return tokenInstance.methods.buy().send({
      from : address,
      value : wei_value,
      gasPrice: 100000000000,
      gas: estimateGas,
    })
  })
}

// check loancoin sell price
export const checkTokenPrices = ({ web3, address }) => {

  let buy_price = 0;
  let sell_price = 0;

  return Promise.resolve()
  .then(() => {
    return prepareTokenContract({web3: web3})
  })
  .then(() => {
    // buy price
    return tokenInstance.methods.buyPrice().call({from : address})
  })
  .then((results) => {
    // set buy price
    buy_price = parseInt(results, 10)

    // check sell price
    return tokenInstance.methods.sellPrice().call({from : address})
  })
  .then((results) => {
    // set sell price
    sell_price = parseInt(results, 10)

    return Promise.resolve({buy_price: buy_price, sell_price: sell_price})
  })
}

// get contract data
export const loancontractOf = ({ web3, address, ipfs_hash_of_this_contract }) => {

  return Promise.resolve()
  .then(() => {
    return prepareLoanContract({web3: web3})
  })
  .then(() => {
    // and get collateral
    return loanInstance.methods.loancontractOf(ipfs_hash_of_this_contract).call({from : address})
  })
}

// _checkIfWithDrawable
export const checkAllowance = ({ web3, address }) => {

  return Promise.resolve()
  .then(() => {
    return prepareTokenContract({web3: web3})
  })
  .then(() => {
    return tokenInstance.methods.allowances(LOAN_ADDRESS, address).call({
      from : address
    })
  })
}

// withdraw loancoin token from contract
export const withdrawTokenFromContract = ({ web3, address, value, ipfsHash, lcn_balance, eth_balance }) => {

  return Promise.resolve()
  .then(() => {
    return prepareTokenContract({web3: web3})
  })
  .then(() => {
    // and get collateral estimate
    return tokenInstance.methods.withdrawTokenFromContract(
      LOAN_ADDRESS,
      address,
      value,
      ipfsHash,
      lcn_balance
    ).estimateGas({
      from : address
    })
  })
  .then((results) => {
    // and get collateral send transaction
    console.log("estimateGas, withdrawTokenFromContract:", results)
    const estimateGas = parseInt(results, 10) + 100

    // return error if user don't have enough ether
    if (web3.utils.toWei(eth_balance) <= estimateGas ) {
      return Promise.reject(Error("Not enough ether"))
    }

    // and get collateral estimate
    return tokenInstance.methods.withdrawTokenFromContract(
      LOAN_ADDRESS,
      address,
      value,
      ipfsHash,
      lcn_balance
    ).send({
      from : address,
      gasPrice: 100000000000,
      gas: estimateGas,
    })

  })
}


// payback
export const payback = ({ web3, address, lender, value, ipfsHash, eth_balance }) => {

  return Promise.resolve()
  .then(() => {
    return prepareTokenContract({web3: web3})
  })
  .then(() => {
    // and get collateral estimate

    // this contract has bugs and not show error even when borrower don't have enough loancoin.
    return tokenInstance.methods.payback(
      lender,
      LOAN_ADDRESS,
      value,
      ipfsHash
    ).estimateGas({
      from : address
    })
  })
  .then((results) => {
    // and get collateral send transaction
    console.log("estimateGas, payback:", results)
    const estimateGas = parseInt(results, 10) + 100

    // return error if user don't have enough ether
    if (web3.utils.toWei(eth_balance) <= estimateGas ) {
      return Promise.reject(Error("Not enough ether"))
    }

    // and get collateral estimate
    return tokenInstance.methods.payback(
      lender,
      LOAN_ADDRESS,
      value,
      ipfsHash
    ).send({
      from : address,
      gasPrice: 100000000000,
      gas: estimateGas,
    })
  })
}

//
// credit hydra
// check ipfs file for uport profile
export const hydraIPFSofUportProfile = ({ web3, address }) => {

  return Promise.resolve()
  .then(() => {
    return prepareHydraContract({web3: web3})
  })
  .then(() => {
    return hydraInstance.methods.retrieveUportInfo().call({from : address})
  })
}
