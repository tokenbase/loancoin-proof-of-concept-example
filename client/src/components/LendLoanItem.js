import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import {
  Button,
  Row,
  Col,
 } from 'reactstrap';
import {
  userLoginAction,
  setKeystoreAction,
  setWeb3Action,
  updateEthBalanceAction,
  updateLoadingStatus,
  setPassword,
} from '../actions/LoancoinActions'
import Alert from 'react-s-alert';
import * as MyAPI from '../utils/MyAPI'
import * as myContractAPI from '../utils/myContractAPI'
import LendLoanApplicationItem from './LendLoanApplicationItem'
import shortid from 'shortid'
import { getKeyFromWallet } from '../utils/walletHelpers'
import * as FontAwesome from 'react-icons/lib/fa'
// import { ClipLoader } from 'react-spinners';

class LendLoanItem extends Component {

  state = {
    collateral_balance: 0,
    borrower: null,
    borrower_sig: null,
    deadline: null,
    lender: null,
    lender_sig: null,
    status_on_contract: 0,
    loan_balance:0,
    showMySignature: false,
    showBorrowerSignature: false,
  }

  componentDidMount() {

    const { web3, item, current_address } = this.props

    let params = {
      web3: web3,
      address: current_address,
      loan_hash: item.loanHash,
    }

    let collateral_balance = 0

    myContractAPI.collateralOf(params)
    .then((results) => {

      collateral_balance = parseInt(results, 10)

      if (item.status === 'open') {
        return Promise.resolve()
      }

      // check contract
      let params = {
        web3: web3,
        address: current_address,
        ipfs_hash_of_this_contract: item.ipfs_hash_of_this_contract,
      }
      return myContractAPI.loancontractOf(params)
    })
    .then((results) => {

      if (results){
        this.setState({
          collateral_balance: collateral_balance,
          borrower: results.borrower,
          borrower_sig: results.borrower_sig,
          deadline: results.deadline,
          lender: results.lender,
          lender_sig: results.lender_sig,
          status_on_contract: parseInt(results.status, 10),
          loan_balance: parseInt(results.balance, 10),
        })
      } else {
        this.setState({
          collateral_balance: collateral_balance,
        })
      }

    })
    .catch((err) => {
      console.log("err: ", err)
    })
  }

  // get the money back to wallet
  _getMoneyBackFromContract = () => {
    const { web3, current_address, item, eth_balance, account_password, wallet } = this.props

    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');
    } else {
      password = account_password
    }

    // update loading status
    this.props.updateLoadingStatus({ loading: true, })

    // 1. check password
    const params = {
      wallet: wallet,
      password: password,
    }
    getKeyFromWallet(params)
    .then(() => {
      // password looks to be okay
      this.props.setPassword({ account_password: password, })
      wallet.passwordProvider = (callback) => {
        callback(null, password);
      };
    })
    .then(() => {

      let params = {
        web3: web3,
        address: current_address,
        loan_hash: item.loanHash,
        value: parseInt(item.amount, 10),
        eth_balance: eth_balance[current_address],
      }
      return myContractAPI.getMoneyBackFromContract(params)
    })
    .then((results) => {

      this.setState({
        collateral_balance: 0,
      })
      this.props.updateLoadingStatus({ loading: false, })

      // re check loancoin and ether balance
      this.props.checkLCN()

    })
    .catch((err) => {
      console.log("err: ", err)

      this.props.updateLoadingStatus({ loading: false, })

      // make it back to default
      if (err.message === 'Incorrect derived key!' || err.message === 'no password') {
        wallet.passwordProvider = (callback) => {
          var pw = prompt("Please enter password", "Password");
          callback(null, pw);
        };
      }

      Alert.error(err.message, {
        position: 'top-right',
        effect: 'slide',
        timeout: 5000
      });
    })
  }

  // move loancoin to contract
  _putMoneyOnContract = () => {

    const { web3, current_address, item, eth_balance, account_password, wallet } = this.props
    if (!web3) {
      this.props.history.push("/")
      return;
    }

    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');
    } else {
      password = account_password
    }

    this.props.updateLoadingStatus({ loading: true, })

    // 1. check password
    const params = {
      wallet: wallet,
      password: password,
    }
    getKeyFromWallet(params)
    .then(() => {
      // password looks to be okay
      this.props.setPassword({ account_password: password, })
      wallet.passwordProvider = (callback) => {
        callback(null, password);
      };
    })
    .then(() => {
      let params = {
        _loanhash: item.loanHash,
        _value: parseInt(item.amount, 10),
        web3: web3,
        address: current_address,
        eth_balance: eth_balance[current_address],
      }
      return myContractAPI.moveTokenAsCollateral(params)
    })
    .then((results) => {

      this.setState({
        collateral_balance: parseInt(item.amount, 10),
      })
      this.props.updateLoadingStatus({ loading: false, })

      // re check loancoin and ether balance
      this.props.checkLCN()

    })
    .catch((err) => {
      console.log("err: ", err)

      this.props.updateLoadingStatus({ loading: false, })

      // make it back to default
      if (err.message === 'Incorrect derived key!' || err.message === 'no password') {
        wallet.passwordProvider = (callback) => {
          var pw = prompt("Please enter password", "Password");
          callback(null, pw);
        };
      }
    })
  }

  _deleteContract = () => {

    const { web3, wallet, item, current_address, account_password } = this.props;

    const loanHash = item.loanHash;

    // set passworl if needed
    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');
    } else {
      password = account_password
    }

    // update loading status
    this.props.updateLoadingStatus({ loading: true, })

    // 1. check password
    const params = {
      wallet: wallet,
      password: password,
    }
    getKeyFromWallet(params)
    .then(() => {
      // password looks to be okay
      this.props.setPassword({ account_password: password, })
      wallet.passwordProvider = (callback) => {
        callback(null, password);
      };
    })
    .then(() => {
      const params = {
        web3: web3,
        account: current_address,
        wallet: wallet,
        password: password,
      }
      return myContractAPI.getSignedhash(params)
    })
    .then((results) => {
      // set signed hash
      const signedHash = results

      let params = {
        signedhash: signedHash,
        loanHash: loanHash,
      }
      return MyAPI.deleteLoanContract(params)
    })
    .then((results) => {
      this.props.updateLoadingStatus({ loading: false, })

      this.props.checkLIST()
    })
    .catch((err) => {
      console.log("err: ", err)

      // make it back to default
      if (err.message === 'Incorrect derived key!' || err.message === 'no password') {
        wallet.passwordProvider = (callback) => {
          var pw = prompt("Please enter password", "Password");
          callback(null, pw);
        };
      }

      this.props.setPassword({ account_password: null, })
      this.props.updateLoadingStatus({ loading: false, })
    })
  }

  _makeSignature = () => {

    const { web3, wallet, item, current_address, account_password } = this.props;

    // set passworl if needed
    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');
    } else {
      password = account_password
    }

    // update loading status
    this.props.updateLoadingStatus({ loading: true, })

    // 1. check password
    const params = {
      wallet: wallet,
      password: password,
    }
    getKeyFromWallet(params)
    .then(() => {
      // password looks to be okay
      this.props.setPassword({ account_password: password, })
      wallet.passwordProvider = (callback) => {
        callback(null, password);
      };
    })
    .then(() => {
      // in current implementation, we send signature to oracle server
      // then, oracle send signature to blockchain
      const params = {
        web3: web3,
        account: current_address,
        wallet: wallet,
        password: password,
        messageHash: item.messageHash_of_contract,
      }
      return myContractAPI.createSignWithMessage(params)
    })
    .then((results) => {
      let signature = results.trim()

      const param = {
        user_type: 'lender',
        ipfs_hash_of_this_contract: item.ipfs_hash_of_this_contract,
        signature: signature,
        loanHash: item.loanHash,
      }
      return MyAPI.sendSignature(param)
    })
    .then((results) => {
      this.props.updateLoadingStatus({ loading: false, })
    })
    .catch((err) => {
      console.log("err: ", err)

      this.props.updateLoadingStatus({ loading: false, })
    })
  }

  _showMySignature = () => {
    this.setState({
      showMySignature: this.state.showMySignature ? false : true,
    })
  }

  _showBorrowerSignature = () => {
    this.setState({
      showBorrowerSignature: this.state.showBorrowerSignature ? false : true,
    })
  }

  render(){

    const { item } = this.props
    const {
      collateral_balance,
      borrower_sig,
      lender_sig,
      loan_balance,
      showMySignature,
      showBorrowerSignature,
    } = this.state

    let dispDate = null;
    if ( item.updatedAt ) {
      let updatedAt = new Date(item.updatedAt)
      let year =  updatedAt.getFullYear()
      let date =  updatedAt.getDate()
      let month =  updatedAt.getMonth()

      dispDate = month+"/"+date+"/"+year
    }

    return(
      <div style={{marginTop: 30, marginBottom: 30,}}>

        <Row style={{
          borderBottomColor: '#cccccc',
          borderBottomStyle: 'dashed',
          borderBottomWidth: 1,
          }}>
          <Col md="8" xs="12" style={{
              textAlign: 'left',
            }}>
            <span>{item.ipfs_hash_of_this_contract ? 'ipfs hash: '+item.ipfs_hash_of_this_contract : 'Open'}</span>
          </Col>

          <Col md="4" xs="12" style={{
              textAlign: 'right',
            }}>
            <span>{item.ipfs_hash_of_this_contract && 'balcne:'+loan_balance+' LCN'}</span>
          </Col>
        </Row>
        <Row>
          <Col md="2" xs="12">
            <span style={{fontSize: 14, color:'#cccccc',}}>Amount</span><br/>
            <span style={{fontSize: 18,}}>{item.amount}</span>
            <span style={{fontSize: 14,}}> LNC</span>
          </Col>
          <Col md="2" xs="12">
            <span style={{fontSize: 14, color:'#cccccc',}}>duration</span><br/>
            <span style={{fontSize: 18,}}>{item.duration}</span>
            <span style={{fontSize: 14,}}> months</span>
          </Col>
          <Col md="2" xs="12">
            <span style={{fontSize: 14, color:'#cccccc',}}>interest</span><br/>
            <span style={{fontSize: 18,}}>{item.interest}</span>
            <span style={{fontSize: 14,}}> % per year</span>
          </Col>
          <Col md="2" xs="12">
            <span style={{fontSize: 14, color:'#cccccc',}}>status</span><br/>
            <span style={{fontSize: 18,}}>{item.status}</span>
          </Col>
          <Col md="2" xs="12">
            <span style={{fontSize: 14, color:'#cccccc',}}>UpdatedAt</span><br/>
            <span style={{fontSize: 18,}}>{dispDate}</span>
          </Col>
          <Col md="2" xs="12">
            <span style={{fontSize: 14, color:'#cccccc',}}>escrow balance</span><br/>
            <span style={{fontSize: 18,}}>{collateral_balance}</span>
            <span style={{fontSize: 14,}}> LCN</span>
          </Col>
        </Row>
        <Row style={{
            marginTop: 10,
            marginBottom: 10,
          }}>
          <Col md="12" xs="12" style={{ textAlign: 'right' }}>
            {item.status === 'open' && collateral_balance > 0 && (
              <Button
                color="warning"
                onClick={this._getMoneyBackFromContract}
                style={{
                  marginLeft: 10,
                }}>Get Loancoin Back</Button>
            )}
            {item.status === 'open' && collateral_balance === 0 && (
              <Button
                color="primary"
                onClick={this._putMoneyOnContract}
                style={{
                  marginLeft: 10,
                }}>Put Loancoin on Contract</Button>
            )}
            {item.status === 'open' && collateral_balance === 0 && (
              <Button
                color="danger"
                onClick={this._deleteContract}
                style={{
                  marginLeft: 10,
                }}>Delete</Button>
            )}
          </Col>
        </Row>

        {item.applications && item.applications.length > 0 && (
          <Row style={{ marginTop: 15, marginBottom: 15, }}>
            <Col md="2" xs="12" />
            <Col md="10" xs="12" style={{
                borderColor: '#cccccc',
                borderStyle: 'solid',
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
              }}>
              <Row>
                <Col style={{ textAlign: 'left' }}>
                  -- Applications --
                </Col>
              </Row>

              {item.applications.map((application) => (
                <LendLoanApplicationItem
                  key={shortid.generate()}
                  loanItem={item}
                  reload={this.props.reload}
                  applicationItem={application} />
              ))}

            </Col>
          </Row>
        )}



        {item.status === 'closed' && (
          <div style={{ marginTop:10, marginBottom:10 }}>
            {lender_sig ? (
              <Row style={{ marginTop: 10, marginBottom:10, }}>
                <Col md="2" xs="12" />
                <Col md="8" xs="12" style={{ textAlign: 'left', wordWrap: 'break-word' }}>
                  <span style={{color: 'green'}}>Your signature </span>
                  <FontAwesome.FaCheck size={60} color="green"
                    onClick={this._showMySignature} style={{
                      cursor: 'pointer',
                    }} />
                </Col>
                <Col md="2" xs="12" />
              </Row>

            ) : (
              <Row style={{ marginTop: 10, marginBottom:10, }}>
                <Col md="2" xs="12" />
                <Col md="8" xs="12" style={{ textAlign: 'left' }}>
                  <span style={{ color: 'orange' }}>Your Signature </span>
                </Col>
                <Col md="2" xs="12">
                  <Button
                    color="primary"
                    onClick={this._makeSignature}
                    style={{
                      width: '100%',
                    }}>Sign on it</Button>
                </Col>
              </Row>
            )}

            {lender_sig && showMySignature === true && (
              <Row>
                <Col md="2" xs="12" />
                <Col md="10" xs="12" style={{
                    wordWrap: 'break-word',
                    fontSize: 14,
                    borderColor: '#cccccc',
                    borderStyle: 'dashed',
                    borderWidth: 1,
                    padding: 4,
                    textAlign: 'left',
                  }}>
                  <span>{lender_sig}</span>
                </Col>
              </Row>
            )}

            {borrower_sig ? (
              <Row style={{ marginTop: 10, marginBottom:10, }}>
                <Col md="2" xs="12" />
                <Col md="8" xs="12" style={{ textAlign: 'left', wordWrap: 'break-word' }}>
                  <span style={{color: 'green'}}>Borrower Signature</span>
                  <FontAwesome.FaCheck size={60} color="green"
                    onClick={this._showBorrowerSignature} style={{
                      cursor: 'pointer',
                    }} />
                </Col>
                <Col md="2" xs="12" />
              </Row>

            ) : (

              <Row style={{ marginTop: 10, marginBottom:10, }}>
                <Col md="2" xs="12" />
                <Col md="8" xs="12" style={{ textAlign: 'left' }}>
                  <span style={{ color: 'orange' }}>Borrower Signature</span>
                </Col>
                <Col md="2" xs="12" />
              </Row>

            )}

            {borrower_sig && showBorrowerSignature === true && (
              <Row>
                <Col md="2" xs="12" />
                <Col md="10" xs="12" style={{
                    wordWrap: 'break-word',
                    fontSize: 14,
                    borderColor: '#cccccc',
                    borderStyle: 'dashed',
                    borderWidth: 1,
                    padding: 4,
                    textAlign: 'left',
                  }}>
                  <span>{borrower_sig}</span>
                </Col>
              </Row>
            )}

          </div>
        )}

      </div>
    )
  }
}

function mapStateToProps ({ user }) {

  // // debug/test
  // if (!user.profile){
  //   user.profile = {
  //     '@context:': "http://schema.org",
  //     '@type': "Person",
  //     publicKey: "0x0443c99874c3001c76baf75ae491e585d234f37baa034b69…68cf44f85801f6fd595c71cc435d649bb77e06a179c065624",
  //     publicEncKey: "rfJn/ILQIKCoysXHcd8Me8Q2Qa9xNjlNWpSXlTjC+Do=",
  //     name: "Ko",
  //     address: "2os5UQaTty7D7EWFiVkb6AyiHL6G1ySuAzM",
  //     avatar: {
  //       uri: "https://ipfs.infura.io/ipfs/QmV2kSxo1d5W3x4mT3npFV9CBckMiCHWWiN3puALg8yUoR"
  //     },
  //     country: "US",
  //   }
  // }

  let avatarUrl = require('../HQwHI.jpg')
  if ( user.profile && user.profile.avatar && user.profile.avatar.uri ) {
    avatarUrl = user.profile.avatar.uri;
  }

  let wallet = null
  if (user && user.wallet){
    wallet = user.wallet
  }

  let web3 = null
  if (user && user.web3){
    web3 = user.web3
  }

  let accounts = null
  // let account = null
  let eth_balance = null
  if (user && user.eth_balance){
    eth_balance = user.eth_balance
    if (user && user.wallet){
      accounts = user.wallet.getAddresses()
    }
  }

  let current_address = null;
  if (user && user.current_address) {
    current_address = user.current_address;
  }

  let account_password = null;
  if (user && user.account_password) {
    account_password = user.account_password;
  }

  return {
    // user: user,
    userProfile: user.profile,
    avatarUrl: avatarUrl,
    web3: web3,
    wallet: wallet,
    accounts: accounts,
    eth_balance: eth_balance,
    current_address: current_address,
    account_password: account_password,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    updateUser: (data) => dispatch(userLoginAction({ params: data})),
    setWallet: (data) => dispatch(setKeystoreAction({ params: data})),
    setWeb3: (data) => dispatch(setWeb3Action({ params: data})),
    updateEthBalance: (data) => dispatch(updateEthBalanceAction({ params: data})),
    updateLoadingStatus: (data) => dispatch(updateLoadingStatus({ params: data})),
    setPassword: (data) => dispatch(setPassword({ params: data})),
  }
}

export default withRouter(connect( mapStateToProps, mapDispatchToProps )(LendLoanItem))
