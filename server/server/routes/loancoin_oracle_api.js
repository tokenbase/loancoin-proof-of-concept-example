import Web3 from 'web3'
import EthUtil from 'ethereumjs-util'
const ipfsAPI = require('ipfs-api')
const ipfs = ipfsAPI({host: 'localhost', port: '5001', protocol: 'http'})
const ethWeb3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
import LoancoinTokenABI from './LoancoinToken.json'
import LoancoinContractABI from './LoancoinContract.json'
import CreditHydraToken from './CreditHydraToken.json'
const exec = require('child_process').exec;
import {
  TOKEN_ADDRESS,
  LOAN_ADDRESS,
  HYDRA_ADDRESS,
  API_KEY,
  ORACLE_ADDRESS,
  ORACLE_PASSWORD,
  IPNS_ADDRESS
} from './settings'

// loancoin token instance and loancoin contract instance
let tokenInstance = null
let loanInstance = null
let hydraInstance = null

//
// utility functions
//

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

// generate random string
function makeid (count) {
  if (!count){
    count = 5;
  }

  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i=0; i < count; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

// recover user address
const recoverUserAddress = (signedhash) => {
  // create message hash
  const messageHash = ethWeb3.utils.sha3("ratelnewtork is going to be great")
  const messageHashx = new Buffer(messageHash.substr(2), 'hex');

  // sever-side
  const sigDecoded = EthUtil.fromRpcSig(signedhash)
  const recoveredPub = EthUtil.ecrecover(messageHashx, sigDecoded.v, sigDecoded.r, sigDecoded.s)
  let recoveredAddress = EthUtil.pubToAddress(recoveredPub).toString('hex')
  return "0x"+recoveredAddress;
}

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

// prepare credit hydra contarct instance
const prepareHydraContract =  ({ web3 }) => {
  return Promise.resolve()
  .then(() => {
    // get instance if needed
    if (hydraInstance !== null){
      return Promise.resolve()
    }
    return new web3.eth.Contract(CreditHydraToken.abi, HYDRA_ADDRESS)
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

// retrieve current loan list on ipfs
const retrieve_loan_list = () => {

  let current_json = null;

  return new Promise((resolve, reject) => {
    exec("ipfs cat /ipns/"+IPNS_ADDRESS, (err, results) => {
      if (err){
        console.log("error 1: ", err)
        reject(err)
      }

      console.log("-- ipna cat --")
      console.log(results);

      try {
        current_json = JSON.parse(results)
      } catch (err) {
        // console.log("json parse error: ", err)
        current_json = {}
      }

      resolve(current_json);
    })
  })
}

const retrieve_data_with_ipfsHash = ({ ipfsHash }) => {

  return new Promise((resolve, reject) => {

    exec("ipfs cat /ipfs/"+ipfsHash, (err, results) => {
      if (err){
        console.log("error 1: ", err)
        reject(err)
      }
      resolve(results);
    })
  })
}

// save data on ipfs
const save_json_on_ipfs = ({ loancoin_json }) => {

  let loancoin_serialized = JSON.stringify(loancoin_json)
  let loancoin_str_escaped = loancoin_serialized.replaceAll("\"","\\\"")

  return new Promise((resolve, reject) => {
    exec("echo "+loancoin_str_escaped+" | ipfs add -q", (err, results) => {
      if (err){
        reject(err)
      }
      resolve(results);
    })
  })
}

// save encrypted data on ipfs
const save_enc_on_ipfs = (encrypted) => {

  // let loancoin_serialized = JSON.stringify(loancoin_json)
  // let loancoin_str_escaped = loancoin_serialized.replaceAll("\"","\\\"")

  return new Promise((resolve, reject) => {
    exec("echo "+encrypted+" | ipfs add -q", (err, results) => {
      if (err){
        reject(err)
      }
      resolve(results);
    })
  })
}

// update ipns
const update_ipns = ({ key, ipfs_path }) => {
  return new Promise((resolve, reject) => {
    exec("ipfs name publish --key="+key+" "+ipfs_path, (err, results) => {
      if (err){
        console.log("error 1: ", err)
        reject(err)
      }

      console.log("-- ipns updated --")
      console.log(results);
      resolve(results);
    })
  })
}

// retrieve ipfs file as raw string
const retrieve_ipfs_raw_string = ({ ipfs_hash }) => {

  return new Promise((resolve, reject) => {
    exec("ipfs cat /ipfs/"+ipfs_hash, (err, results) => {
      if (err){
        console.log("error 1: ", err)
        reject(err)
      }
      resolve(results.trim());
    })
  })
}


// index
exports.echo = (req, res) => {
  res.json({
    status: 'OK',
  });
}

//
// loancoin
//

// add_loan_initiation
exports.add_loan_initiation = (req, res) => {

  let signedhash =  req.body.signedhash;
  let payback_duration =  req.body.payback_duration;
  let interest_rate = req.body.interest_rate;
  let publicKey = req.body.publicKey;
  let loancoin_amount = req.body.loancoin_amount;
  loancoin_amount = parseInt(loancoin_amount)
  let api_key =  req.headers.authorization;

  console.log("add_loan_initiation: ", req.body);

  if (api_key !== API_KEY){
    res.json({ status: 'error', message: 'api key is invalid 2' });
    return;
  }

  const recoveredAddress = recoverUserAddress(signedhash)

  // loan hash
  const loan_string = recoveredAddress+"_"+payback_duration+"_"+interest_rate+"_"+loancoin_amount+"_1";
  const loanHash = ethWeb3.utils.sha3(loan_string)

  let loancoin_json = null;
  let ipfs_current_path = null;
  let ipfs_new_path = null;

  // get loancoin json from ipfs/ipns
  retrieve_loan_list()
  .then((results) => {
    loancoin_json = results
  })
  .then(() => {
    // check if the loan template alreay exist

    let loan_list = [];
    if (loancoin_json.loans){
      loan_list = loancoin_json.loans
    }

    // check if ipfs data has exact same record
    let tmp_arr1 = loan_list.filter((item) => {
      if (loanHash === item.loanHash) {
        return true;
      }
    })
    if (tmp_arr1 && tmp_arr1.length > 0){
      reject(Error("record alrady exist"))
    }

    // so this loan is new...
    loan_list.push({
      loanHash: loanHash,
      address: recoveredAddress,
      duration: parseInt(payback_duration),
      interest: parseInt(interest_rate),
      amount: parseInt(loancoin_amount),
      updatedAt: new Date().getTime(),
      nounce: 1,
      status: 'open',
      publicKey: publicKey,
    })

    console.log("loan_list:", loan_list)

    // create new json, save it on ipfs and update ipns
    let json_1 = loancoin_json
    json_1.loans = loan_list
    console.log("json_1:", json_1)

    return save_json_on_ipfs( { loancoin_json: json_1 } )
  })
  .then((results) => {
    // update ipns
    const params = {
      key: "mykey",
      ipfs_path: results.trim(),
    }
    return update_ipns(params)
  })
  .then(() => {
    console.log("-- 3 --")

    res.json({
      status: 'success'
    });
  })
  .catch((err) => {
    res.json({
      status: 'error',
      message: err.message,
    });
  })
}

// check_initiated_loans
exports.get_loan_list = (req, res) => {

  let signedhash = req.body.signedhash;
  let api_key = req.headers.authorization;
  let search_type = req.body.search_type;
  if (!search_type) {
    search_type = "my_initiation"
  }

  if (api_key !== API_KEY){
    res.json({ status: 'error', message: 'api key is invalid 2' });
    return;
  }

  const recoveredAddress = recoverUserAddress(signedhash)

  let current_json = null;
  let ipfs_current_path = null;

  let loancoin_json = null;
  let loan_list = []

  // get loancoin json from ipfs/ipns
  retrieve_loan_list()
  .then((results) => {
    loancoin_json = results
  })
  .then(() => {
    // filter my loans

    if (!loancoin_json.loans || loancoin_json.loans.length === 0){
      return Promise.resolve()
    }

    if (search_type == "to_apply") {
      loan_list = loancoin_json.loans.filter((item) => {
        if (item.address === recoveredAddress){
          return false;
        } else if (item.status === 'closed' && item.accepted_borrower === recoveredAddress ) {
          return true;
        } else if (item.status !== 'open') {
          return false;
        } else {
          return true;
        }
      })
    } else {
      loan_list = loancoin_json.loans.filter((item) => item.address === recoveredAddress )
    }

  })
  .then(() => {
    console.log("-- 3 --")
    res.json({
      status: 'success',
      loan_list: loan_list,
    });
  })
  .catch((err) => {
    res.json({
      status: 'error',
      message: err.message,
    });
  })
}


// give 10 ether to test users
exports.give_me_ether = (req, res) => {

  let signedhash =  req.body.signedhash;
  let api_key =  req.headers.authorization;

  if (api_key !== API_KEY){
    res.json({ status: 'error', message: 'api key is invalid 2' });
    return;
  }

  const recoveredAddress = recoverUserAddress(signedhash)

  Promise.resolve()
  .then(() => {
    // unlock account
    return ethWeb3.eth.personal.unlockAccount(ORACLE_ADDRESS, ORACLE_PASSWORD)
  })
  .then(() => {
    // send ether
    return new ethWeb3.eth.sendTransaction({
      from: ORACLE_ADDRESS,
      to: recoveredAddress,
      value: ethWeb3.utils.toWei('10', 'ether'),
    })
  })
  .then(() => {
    res.json({
      status: 'success',
    });
  })
  .catch((err) => {
    res.json({
      status: 'error',
      message: err.message,
    });
  })
}

// apply_to_loan
exports.apply_to_loan = (req, res) => {

  let signedhash =  req.body.signedhash;
  let loanHash = req.body.loanHash;
  let encrypted_text = req.body.encrypted_text;
  let address = req.body.address;
  let api_key =  req.headers.authorization;

  if (api_key !== API_KEY){
    res.json({ status: 'error', message: 'api key is invalid 2' });
    return;
  }

  console.log(signedhash)

  const recoveredAddress = recoverUserAddress(signedhash)
  if ( recoveredAddress !== address ) {
    res.json({ status: 'error', message: 'invalid signature' });
    return;
  }

  let loancoin_json = {}

  // get loancoin json from ipfs/ipns
  retrieve_loan_list()
  .then((results) => {
    loancoin_json = results
  })
  .then(() => {
    console.log("fdadffa:")

    // get the loan
    let the_loan = loancoin_json.loans.filter((item) => item.loanHash === loanHash )

    if (!the_loan){
      return Promise.reject(Error("no such loan"))
    }

    let applications = []
    if ( the_loan.applications && the_loan.applications.length > 0 ) {

      let my_application = the_loan.applications.filter((item) => item.borrower === recoveredAddress)
      if (my_application && my_application.length > 0){
        // user already applied
        return Promise.reject(Error("already applied"))
      }
      applications = the_loan.applications
    }

    let application = {
      borrower: recoveredAddress,
      encrypted: encrypted_text,
      createdAt: new Date().getTime(),
    }
    applications.push(application)

    // update json file
    let updated_list = loancoin_json.loans.map((item) => {

      console.log(item.loanHash, loanHash)

      if (item.loanHash === loanHash){
        item.applications = applications
      }
      return item;
    })
    let updated_json = loancoin_json
    updated_json.loans = updated_list
    console.log("updated_json: ", updated_json)

    // save it
    return save_json_on_ipfs( { loancoin_json: updated_json } )
  })
  .then((results) => {
    // update ipns
    const params = {
      key: "mykey",
      ipfs_path: results.trim(),
    }
    return update_ipns(params)
  })
  .then(() => {
    console.log("-- 3 --")
    res.json({
      status: 'success',
    });
  })
  .catch((err) => {
    res.json({
      status: 'error',
      message: err.message,
    });
  })
}

// approve_borrower
exports.approve_borrower = (req, res) => {

  let signedhash =  req.body.signedhash;
  let loanHash = req.body.loanHash;
  let borrower = req.body.borrower;
  let api_key =  req.headers.authorization;

  if (api_key !== API_KEY){
    res.json({ status: 'error', message: 'api key is invalid 2' });
    return;
  }

  console.log(signedhash)

  const recoveredAddress = recoverUserAddress(signedhash)

  let ipfs_new_path = null;
  let ipfs_contract_hash = null;
  // let loancoinInstance = null;

  let loancoin_json = {}
  let the_loan = null;
  let ipfs_hash_of_this_contract = "";

  let messageHash_of_contract = "";

  // get loancoin json from ipfs/ipns
  retrieve_loan_list()
  .then((results) => {
    loancoin_json = results
  })
  .then(() => {
    console.log("approve_borrower:")

    console.log("loanHash: ",loanHash)

    // get the loan
    const tmp_arr1 = loancoin_json.loans.filter((item) => item.loanHash === loanHash )

    if (!tmp_arr1 || tmp_arr1.length === 0){
      return Promise.reject(Error("no such loan"))
    }

    the_loan = tmp_arr1[0]
    console.log("the_loan: ", the_loan)

    if (the_loan.status != 'open'){
      return Promise.reject(Error("loan status is not open: "+the_loan.status))
    }

    if ( !the_loan.applications || the_loan.applications.length === 0 ) {
      return Promise.reject(Error("no such application 1"))
    }
    let the_application = the_loan.applications.filter((item) => item.borrower === borrower)
    if (!the_application || the_application.length == 0){
      // no such application
      return Promise.reject(Error("no such application 2"))
    }

    // looks okay ...
  })
  .then(() => {
    // if we can generate a pdf file
    // save it on ipfs network
    // that would be cool

    const loan_contract_detail = {
      'lender': recoveredAddress,
      'borrower': borrower,
      'duration': the_loan.duration,
      'interest': the_loan.interest,
      'amount': the_loan.amount,
      'createdAt': the_loan.createdAt,
    }

    console.log("AAAA loan_contract_detail:",loan_contract_detail)

    messageHash_of_contract = ethWeb3.utils.sha3(JSON.stringify(loan_contract_detail))

    // save it
    return save_json_on_ipfs( { loancoin_json: loan_contract_detail } )
  })
  .then((results) => {

    // need TRIM < THIS WAS IMPORTANAT
    ipfs_hash_of_this_contract = results.trim()

    console.log("AAAA ipfs_hash_of_this_contract:", ipfs_hash_of_this_contract)

    // update json file
    let updated_list = loancoin_json.loans.map((item) => {
      if (item.loanHash === loanHash){
        item.status = 'closed'
        item.accepted_borrower = borrower
        item.acceptedAt = new Date().getTime()
        item.closedAt = new Date().getTime()
        item.ipfs_hash_of_this_contract = ipfs_hash_of_this_contract
        item.messageHash_of_contract = messageHash_of_contract
      }
      return item;
    })
    let updated_json = loancoin_json
    updated_json.loans = updated_list
    console.log("AAAA updated_json: ", updated_json)

    // save it
    return save_json_on_ipfs( { loancoin_json: updated_json } )
  })
  .then((results) => {
    // update ipns

    console.log("AAAA update ipns:", results)

    const params = {
      key: "mykey",
      ipfs_path: results.trim(),
    }
    return update_ipns(params)
  })
  .then(() => {
    // create a loan on blockchain
    return prepareLoanContract({ web3: ethWeb3 })
  })
  .then(() => {
    // store the hash on ethereum
    // unlock account
    return ethWeb3.eth.personal.unlockAccount(ORACLE_ADDRESS, ORACLE_PASSWORD)
  })
  .then(() => {
    // finally create new loan contract

    console.log("loanInstance.methods.cerateLoanContract 1:")
    console.log(ipfs_hash_of_this_contract, recoveredAddress, borrower)

    let deadline = (new Date().getTime() / 1000) + the_loan.duration * 30 * 24 * 60 * 60

    return loanInstance.methods.cerateLoanContract(
      ipfs_hash_of_this_contract,
      recoveredAddress,
      borrower,
      deadline
    ).estimateGas({
      from: ORACLE_ADDRESS
    })
  })
  .then((results) => {

    console.log("fasdfafasfasfas loanInstance:", loanInstance)

    console.log("loanInstance.methods.cerateLoanContract 2:")
    console.log(ipfs_hash_of_this_contract, recoveredAddress, borrower)

    let estimateGas = parseInt(results) + 100
    let deadline = (new Date().getTime() / 1000) + the_loan.duration * 30 * 24 * 60 * 60

    console.log("AAAA estimateGas: ", estimateGas);

    return loanInstance.methods.cerateLoanContract(
      ipfs_hash_of_this_contract,
      recoveredAddress,
      borrower,
      deadline
    ).send({
      from: ORACLE_ADDRESS,
      gasPrice: 100000000000,
      gas: estimateGas,
    })
  })
  .then((results) => {
    console.log("-- 3 --: ", results)
    res.json({
      status: 'success',
    });
  })
  .catch((err) => {
    res.json({
      status: 'error',
      message: err.message,
    });
  })
}

// delete_loan_contract
exports.delete_loan_contract = (req, res) => {

  let signedhash =  req.body.signedhash;
  let loanHash = req.body.loanHash;
  let api_key =  req.headers.authorization;

  if (api_key !== API_KEY){
    res.json({ status: 'error', message: 'api key is invalid 2' });
    return;
  }

  console.log(signedhash)

  const recoveredAddress = recoverUserAddress(signedhash)

  let loancoin_json = {}

  // get loancoin json from ipfs/ipns
  retrieve_loan_list()
  .then((results) => {
    loancoin_json = results
  })
  .then(() => {
    console.log("fdadffa:")

    // get the loan
    let tmp_arr1 = loancoin_json.loans.filter((item) => item.loanHash !== loanHash )
    let updated_json = loancoin_json
    updated_json.loans = tmp_arr1
    console.log("updated_json: ", updated_json)

    // save it
    return save_json_on_ipfs( { loancoin_json: updated_json } )
  })
  .then((results) => {
    // update ipns
    const params = {
      key: "mykey",
      ipfs_path: results.trim(),
    }
    return update_ipns(params)
  })
  .then(() => {
    console.log("-- 3 --")
    res.json({
      status: 'success',
    });
  })
  .catch((err) => {
    res.json({
      status: 'error',
      message: err.message,
    });
  })
}

// send_signature
exports.send_signature = (req, res) => {

  let signature =  req.body.signature;
  let ipfs_hash_of_this_contract = req.body.ipfs_hash_of_this_contract;
  let user_type = req.body.user_type;
  let loanHash = req.body.loanHash;

  let api_key =  req.headers.authorization;
  if (api_key !== API_KEY){
    res.json({ status: 'error', message: 'api key is invalid 2' });
    return;
  }

  let recoveredAddress

  retrieve_ipfs_raw_string({ ipfs_hash: ipfs_hash_of_this_contract })
  .then((results) => {
    console.log("retrieve_ipfs_file: ", results)

    // decode
    const messageHash_of_contract = ethWeb3.utils.sha3(results)
    const messageHashx = new Buffer(messageHash_of_contract.substr(2), 'hex');

    const sigDecoded = EthUtil.fromRpcSig(signature)
    const recoveredPub = EthUtil.ecrecover(messageHashx, sigDecoded.v, sigDecoded.r, sigDecoded.s)
    recoveredAddress = EthUtil.pubToAddress(recoveredPub).toString('hex')
    recoveredAddress = "0x"+recoveredAddress;

    // get contract

    let a_json = JSON.parse(results);

    console.log("signature check")
    console.log(a_json.lender, recoveredAddress)

    if (user_type === 'lender' && a_json.lender === recoveredAddress){
      return Promise.resolve()
    } else if (user_type === 'borrower' && a_json.borrower === recoveredAddress) {
      return Promise.resolve()
    } else {
      return Promise.reject(Error("signiture is not valid"))
    }

  })
  .then(() => {
    return prepareLoanContract({ web3: ethWeb3 })
  })
  .then(() => {
    // store the hash on ethereum
    // unlock account
    return ethWeb3.eth.personal.unlockAccount(ORACLE_ADDRESS, ORACLE_PASSWORD)
  })
  .then(() => {
    // finally create new loan contract

    console.log("signature: 1, user_type: ", user_type)
    console.log(ipfs_hash_of_this_contract, signature, TOKEN_ADDRESS, loanHash)

    if ( user_type === 'lender' ) {
      console.log("-- lender --")

      return loanInstance.methods.setLenderSig(
        ipfs_hash_of_this_contract,
        signature,
        TOKEN_ADDRESS,
        loanHash
      ).estimateGas({
        from: ORACLE_ADDRESS
      })
    } else if ( user_type === 'borrower' ) {
      return loanInstance.methods.setBorrowerSig(
        ipfs_hash_of_this_contract,
        signature,
        TOKEN_ADDRESS,
        loanHash
      ).estimateGas({
        from: ORACLE_ADDRESS
      })
    } else {
      return Promise.reject(Error("worng user type"))
    }

  })
  .then((results) => {

    let estimateGas = parseInt(results) + 100



    console.log("signature: 2")
    console.log("AAAA estimateGas: ", estimateGas, "user_type: ", user_type);

    // estimateGas = 500000

    if ( user_type === 'lender' ) {

      console.log("lender 2")

      return loanInstance.methods.setLenderSig(
        ipfs_hash_of_this_contract.trim(),
        signature.trim(),
        TOKEN_ADDRESS,
        loanHash.trim()
      ).send({
        from: ORACLE_ADDRESS,
        gasPrice: 100000000000,
        gas: estimateGas,
      })

    } else if ( user_type === 'borrower' ) {

      console.log("borrower 2")

      return loanInstance.methods.setBorrowerSig(
        ipfs_hash_of_this_contract,
        signature,
        TOKEN_ADDRESS,
        loanHash
      ).send({
        from: ORACLE_ADDRESS,
        gasPrice: 100000000000,
        gas: estimateGas,
      })

    } else {
      return Promise.reject(Error("worng user type"))
    }
  })
  .then((results) => {
    console.log("-- 3 --: ", results)
    res.json({
      status: 'success',
    });
  })
  .catch((err) => {
    res.json({
      status: 'error',
      message: err.message,
    });
  })
}

// send_uport_profile
exports.send_uport_profile = (req, res) => {

  let signedhash =  req.body.signedhash;
  let profile_string_enc = req.body.profile_string_enc;
  let address = req.body.address;
  let api_key =  req.headers.authorization;
  if (api_key !== API_KEY){
    res.json({ status: 'error', message: 'api key is invalid 2' });
    return;
  }

  // decode
  const messageHash = ethWeb3.utils.sha3(profile_string_enc)
  const messageHashx = new Buffer(messageHash.substr(2), 'hex');
  const sigDecoded = EthUtil.fromRpcSig(signedhash)
  const recoveredPub = EthUtil.ecrecover(messageHashx, sigDecoded.v, sigDecoded.r, sigDecoded.s)
  const recoveredAddress = "0x"+EthUtil.pubToAddress(recoveredPub).toString('hex')
  if (recoveredAddress !== address) {
    res.json({ status: 'error', message: 'invalid signature' });
    return;
  }
  console.log("recoveredAddress: ", recoveredAddress)

  // const profile = JSON.parse(profile_string)
  console.log("profile_string_enc: ", profile_string_enc)

  let ipfs_hash_of_uport_profile;

  // save data on ipfs
  save_enc_on_ipfs(profile_string_enc)
  .then((results) => {
    ipfs_hash_of_uport_profile = results.trim()
  })
  .then(() => {
    return prepareHydraContract({ web3: ethWeb3 })
  })
  .then(() => {
    // store the hash on ethereum
    // unlock account
    return ethWeb3.eth.personal.unlockAccount(ORACLE_ADDRESS, ORACLE_PASSWORD)
  })
  .then(() => {
    // finally store data on ethereum
    //  string _uport_ipfs_hash, address _address
    return hydraInstance.methods.updateUportInfoFromOracle(
      ipfs_hash_of_uport_profile,
      recoveredAddress
    ).estimateGas({
      from: ORACLE_ADDRESS
    })

  })
  .then((results) => {

    let estimateGas = parseInt(results) + 100
    console.log("AAAA estimateGas: ", estimateGas);

    //  string _uport_ipfs_hash, address _address
    return hydraInstance.methods.updateUportInfoFromOracle(
      ipfs_hash_of_uport_profile,
      recoveredAddress
    ).send({
      from: ORACLE_ADDRESS,
      gasPrice: 100000000000,
      gas: estimateGas,
    })

  })
  .then((results) => {
    console.log("-- 3 --: ", results)
    res.json({
      status: 'success',
      ipfs_hash_of_uport_profile: ipfs_hash_of_uport_profile,
    });
  })
  .catch((err) => {
    res.json({
      status: 'error',
      message: err.message,
    });
  })
}


// get_uport_profile
exports.get_uport_profile = (req, res) => {

  let ipfsHash =  req.body.ipfsHash;
  let api_key =  req.headers.authorization;
  if (api_key !== API_KEY){
    res.json({ status: 'error', message: 'api key is invalid 2' });
    return;
  }

  retrieve_data_with_ipfsHash({ ipfsHash: ipfsHash })
  .then((results) => {
    res.json({
      status: 'success',
      results: results,
    });
  })
  .catch((err) => {
    res.json({
      status: 'error',
      message: err.message,
    });
  })
}
