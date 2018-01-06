import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import {
  Button,
  Row,
  Col,
  Input,
  InputGroupAddon,
  InputGroup,
 } from 'reactstrap';
import {
  userLoginAction,
  setKeystoreAction,
  setWeb3Action,
  updateEthBalanceAction,
  updateLoadingStatus,
  setPassword,
} from '../actions/LoancoinActions'
import * as MyAPI from '../utils/MyAPI'
import * as myContractAPI from '../utils/myContractAPI'
import { getKeyFromWallet } from '../utils/walletHelpers'
import { encryptDataWithPublicKey } from '../utils/cryptHelpers'
import replaceall from 'replaceall'
import * as FontAwesome from 'react-icons/lib/fa'
import Alert from 'react-s-alert';

class BorrowLoanItem extends Component {

  state = {
    collateral_balance: 0,
    my_status: 'none',
    borrower: null,
    borrower_sig: null,
    deadline: null,
    lender: null,
    lender_sig: null,
    status_on_contract: 0,
    loan_balance:0,
    withdrawable: 0,
    payback_amount: 0,
    networking: false,
    showMySignature: false,
    showLenderSignature: false,
  }

  componentDidMount() {

    const { item, current_address } = this.props

    if ( item.accepted_borrower === current_address ) {
      // applied
      this.setState({
        my_status: 'accepted'
      })

      this._checkDataOnBlockchain()
      .then(() => {
        this._checkIfWithDrawable()
      })

      return;
    }

    let applications = item.applications;
    if (applications && applications.length > 0){
      let my_application = applications.filter((application) => application.borrower === current_address)

      if (my_application && my_application.length > 0) {

        // applied
        this.setState({
          my_status: 'applied'
        })
      }
    }
  }

  _checkDataOnBlockchain = () => {

    const { web3, item, current_address } = this.props

    // check contract
    let params = {
      web3: web3,
      address: current_address,
      ipfs_hash_of_this_contract: item.ipfs_hash_of_this_contract,
    }
    return myContractAPI.loancontractOf(params)
    .then((results) => {

      if (results) {
        this.setState({
          loan_balance: parseInt(results.balance, 10),
          borrower: results.borrower,
          borrower_sig: results.borrower_sig,
          deadline: results.deadline,
          lender: results.lender,
          lender_sig: results.lender_sig,
          status_on_contract: parseInt(results.status, 10),
        })
      }
    })
  }

  _checkIfWithDrawable = () => {

    const { web3, current_address } = this.props

    let params = {
      web3: web3,
      address: current_address,
    }
    myContractAPI.checkAllowance(params)
    .then((results) => {
      this.setState({
        withdrawable: parseInt(results, 10)
      })
    })
    .catch((err) => {
      console.log("err:", err)
    })
  }

  // apply to the loan
  _applyToLoan = () => {

    const {
      web3,
      wallet,
      item,
      current_address,
      account_password,
      userProfile,
     } = this.props;

    const loanHash = item.loanHash;

    // set passworl if needed
    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');
    } else {
      password = account_password
    }

    // profile data
    const profile = {
      avatar: userProfile.avatar,
      country: userProfile.country,
      name: userProfile.name,
      phone: userProfile.phone ? 'verified on uport' : '',
    }
    let encrypted_text;

    // update loading status
    this.setState({
      networking: true,
    })

    // 1. check password
    const params = {
      wallet: wallet,
      password: password,
    }
    getKeyFromWallet(params)
    .then(() => {
      // set passwordProvider and update props
      this.props.setPassword({ account_password: password, })
      wallet.passwordProvider = (callback) => {
        callback(null, password);
      };
    })
    .then(() => {
      // encrypt profile with lenders public key

      let publicKey = replaceall("@@@", "\n", item.publicKey);
      const params = {
        userId: userProfile.address,
        rawData: JSON.stringify(profile),
        publicKey: publicKey,
      }
      return encryptDataWithPublicKey(params)
    })
    .then((results) => {
      // encrypt successful
      encrypted_text = results
      return Promise.resolve()
    })
    .then(() => {
      // generate signature
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
        encrypted_text: encrypted_text,
        address: current_address,
      }
      return MyAPI.applyToLoan(params)
    })
    .then((results) => {
      if (!results) {
        return Promise.reject(Error("server error"))
      }
      if (results.status !== 'success') {
        return Promise.reject(Error(results.message))
      }
    })
    .then(() => {
      // reload
      this.props.reload()
    })
    .catch((err) => {
      console.log("err: ", err)

      // make it back to default
      if (err.message === 'Incorrect derived key!' || err.message === 'no password') {
        this.props.setPassword({ account_password: null, })
        wallet.passwordProvider = (callback) => {
          var pw = prompt("Please enter password", "Password");
          callback(null, pw);
        };
      }

      this.setState({
        networking: false,
      })
    })
  }

  // make signature on this contract as borrower
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
      // messageHash should be sha3 of stringified json???
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
        user_type: 'borrower',
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
      console.log("err:", err)

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

  // withdraw token
  _withdrawToken = () => {

    const {
      web3,
      item,
      current_address,
      account_password,
      eth_balance,
      wallet,
    } = this.props;

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
      // messageHash should be sha3 of stringified json???
      let lcn_balance = parseInt(item.amount, 10) + parseInt(item.amount, 10) * item.interest * 0.01

      const params = {
        web3: web3,
        address: current_address,
        value: parseInt(item.amount, 10),
        ipfsHash: item.ipfs_hash_of_this_contract.trim(),
        lcn_balance: lcn_balance,
        eth_balance: eth_balance[current_address],
      }

      return myContractAPI.withdrawTokenFromContract(params)
    })
    .then(() => {
      this.props.updateLoadingStatus({ loading: false, })
    })
    .then(() => {
      this.props.checkLoancoinBalance()
    })
    .catch((err) => {
      console.log("err:", err)

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

  _payback = () => {

    const {
      web3,
      item,
      current_address,
      account_password,
      eth_balance,
      wallet,
      loancoinBalance,
    } = this.props;
    const { payback_amount, lender } = this.state;

    if ( payback_amount > loancoinBalance) {
      Alert.error("Not enough laoncoin", {
        position: 'top-right',
        effect: 'slide',
        timeout: 5000
      });
      return;
    }

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
        address: current_address,
        lender: lender,
        value: payback_amount,
        ipfsHash: item.ipfs_hash_of_this_contract.trim(),
        eth_balance: eth_balance[current_address],
      }

      return myContractAPI.payback(params)
    })
    .then(() => {
      this.props.updateLoadingStatus({ loading: false, })
    })
    .then(() => {
      this.props.checkLoancoinBalance()
    })
    .catch((err) => {
      console.log("err:", err)

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

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value })
  }

  _showMySignature = () => {
    this.setState({
      showMySignature: this.state.showMySignature ? false : true,
    })
  }

  _showLenderSignature = () => {
    this.setState({
      showLenderSignature: this.state.showLenderSignature ? false : true,
    })
  }

  render(){

    const { item } = this.props
    const {
      // collateral_balance,
      my_status,
      // borrower,
      borrower_sig,
      // deadline,
      // lender,
      lender_sig,
      status_on_contract,
      withdrawable,
      payback_amount,
      loan_balance,
      networking,
      showLenderSignature,
      showMySignature,
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

        <Row>
          <Col style={{
              textAlign: 'left',
              borderBottomColor: '#cccccc',
              borderBottomStyle: 'dashed',
              borderBottomWidth: 1,
            }}>
            <span>{item.ipfs_hash_of_this_contract ? 'ipfs hash: '+item.ipfs_hash_of_this_contract : 'Open'}</span>
          </Col>
        </Row>
        <Row>
          <Col style={{textAlign: 'left'}}>
            <span>Lender: </span>
            <span>{item.address}</span>
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
          <Col md="2" xs="12" style={{paddingTop: 14}}>

            {my_status === 'none' ? (
              <Button
                color="primary"
                disabled={networking}
                onClick={this._applyToLoan}
                style={{
                  marginLeft: 10,
                }}>Apply</Button>
            ) : (
              <span style={{
                  fontSize: 26,
                  color: 'green'
                }}>{my_status}</span>
            )}


          </Col>
        </Row>

        {my_status === 'accepted' && (
          <Row style={{ marginTop:10, marginBottom:10 }}>
            <Col md="2" xs="12" />
            <Col md="10" xs="12" style={{
                borderColor: '#cccccc',
                // borderRadius: 8,
                borderStyle: 'solid',
                borderWidth: 1,
                padding: 14,
              }}>

            {lender_sig ? (
              <Row style={{ marginTop: 10, marginBottom:10, }}>
                <Col md="8" xs="12" style={{ textAlign: 'left', wordWrap: 'break-word' }}>
                  <span style={{color: 'green'}}>Lender Signature </span>
                  <FontAwesome.FaCheck size={60} color="green"
                    onClick={this._showLenderSignature} style={{
                      cursor: 'pointer',
                    }} />
                </Col>
                <Col md="4" xs="12" />
              </Row>

            ) : (
              <Row style={{ marginTop: 10, marginBottom:10, }}>
                <Col md="8" xs="12" style={{ textAlign: 'left' }}>
                  <span style={{ color: 'orange' }}>Lender Signature </span>
                </Col>
                <Col md="4" xs="12" />
              </Row>
            )}


            {lender_sig && showLenderSignature === true && (
              <Row>
                <Col md="12" xs="12" style={{
                    textAlign: 'left',
                    padding: 10,
                  }}>

                  <div style={{
                      wordWrap: 'break-word',
                      fontSize: 14,
                      borderColor: '#cccccc',
                      borderStyle: 'dashed',
                      borderWidth: 1,
                      padding: 4,
                    }}>
                    {lender_sig}
                  </div>
                </Col>
              </Row>
            )}


            {borrower_sig ? (
              <Row>
                <Col md="8" xs="12" style={{ textAlign: 'left', wordWrap: 'break-word' }}>
                  <span style={{color: 'green'}}>Your signature </span>
                  <FontAwesome.FaCheck size={60} color="green"
                    onClick={this._showMySignature} style={{
                      cursor: 'pointer',
                    }} />
                </Col>
                <Col md="4" xs="12" />
              </Row>

            ) : (

              <Row>
                <Col md="8" xs="12" style={{ textAlign: 'left' }}>
                  <span style={{ color: 'orange' }}>Your Signature </span>
                </Col>
                <Col md="4" xs="12">
                  <Button
                    color="primary"
                    onClick={this._makeSignature}
                    style={{
                      width: '100%',
                    }}>Sign on it</Button>
                </Col>
              </Row>
            )}

            {borrower_sig && showMySignature === true && (
              <Row>
                <Col md="12" xs="12" style={{
                    textAlign: 'left',
                    padding: 10,
                  }}>
                  <div style={{
                    wordWrap: 'break-word',
                    fontSize: 14,
                    borderColor: '#cccccc',
                    borderStyle: 'dashed',
                    borderWidth: 1,
                    padding: 4,
                    }}>{borrower_sig}</div>
                </Col>
              </Row>
            )}

            </Col>
          </Row>
        )}

        {status_on_contract === 1 && withdrawable > 0 && (
          <Row>

            <Col md="2" xs="12 "/>
            <Col md="10" xs="12">

              <Button
                color="primary"
                onClick={this._withdrawToken}
                style={{
                  width: '100%',
                }}>Withdraw Token</Button>

            </Col>
          </Row>
        )}

        {/* // 0: initialized, 1: signed, 2: withdrawed, 3: active, 4: completed, 5: default not yet done */}
        {loan_balance === 0 && status_on_contract === 4 && (
          <Row>
            <Col md="2" xs="12" />
            <Col md="12" xs="12" style={{ textAlign: 'right' }}>
              <span style={{
                  color: 'green',
                  fontSize: 36,
                }}>Completed</span>
            </Col>
          </Row>
        )}
        {loan_balance >  0  && status_on_contract > 1 && (
          <Row>
            <Col md="6" xs="12" />
            <Col md="2" xs="12" style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 14 }}>loan_balance</span><br/>
              <span style={{ fontSize: 22 }}>{loan_balance}</span>
            </Col>
            <Col md="2" xs="12" style={{ textAlign: 'center' }}>

              <InputGroup style={{marginTop: 18}}>
                <Input
                  onChange={this.handleChange}
                  value={payback_amount}
                  type="text"
                  name="payback_amount"
                  placeholder="Loancoin" />
                <InputGroupAddon>LCN</InputGroupAddon>
              </InputGroup>

            </Col>
            <Col md="2" xs="12" style={{ textAlign: 'center' }}>
              <Button
                color="success"
                onClick={this._payback}
                style={{
                  marginTop: 18,
                  width: '100%',
                }}>Payback</Button>
            </Col>
          </Row>
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

export default withRouter(connect( mapStateToProps, mapDispatchToProps )(BorrowLoanItem))
