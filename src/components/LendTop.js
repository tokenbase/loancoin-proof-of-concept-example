import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import {
  Button,
  Container,
  Row,
  Col,
  Form,
  Input,
  InputGroupAddon,
  InputGroup,
  Label,
 } from 'reactstrap';
import {
  userLoginAction,
  setKeystoreAction,
  setWeb3Action,
  updateEthBalanceAction,
  updateLoadingStatus,
  setPassword,
} from '../actions/LoancoinActions'
import { getKeyFromWallet } from '../utils/walletHelpers'
import Alert from 'react-s-alert';
import shortid from 'shortid'
import Header from './Header'
import * as MyAPI from '../utils/MyAPI'
import * as myContractAPI from '../utils/myContractAPI'
import LendLoanItem from './LendLoanItem'
import Loading from './Loading'
import WalletCard from './WalletCard'
import { getPublicKey,  } from '../utils/cryptHelpers'
import replaceall from 'replaceall'

class LendTop extends Component {

  state = {
    loancoinBalance: 0,
    collateral: 0,
    loancoin_amount: 0,
    interest_rate: 0,
    payback_duration: 0,
    my_loans: []
  }

  componentDidMount() {
    this._checkLoancoinAndEther()
  }
  // check loancoin balance
  _checkLoancoinBalance = () => {

    const { web3, current_address, account_password, wallet } = this.props
    if (!web3) {
      this.props.history.push("/")
      return Promise.reject("no web3 detected");
    }

    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');
    } else {
      password = account_password
    }

    // for the time beging, lets keep this in state
    let loancoinBalance = 0

    // 1. check password
    const params = {
      wallet: wallet,
      password: password,
    }
    return getKeyFromWallet(params)
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
      }
      return myContractAPI.checkLoancoinBalance(params)
    })
    .then((results) => {
      // update state
      loancoinBalance = parseInt(results, 10)

      this.setState({
        loancoinBalance: loancoinBalance,
      })
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
    })
  }

  toggleConvertTo = () => {

    const { convert_to } = this.state
    this.setState({
      convert_to: convert_to === 'loancoin' ? 'ether' : 'loancoin'
    })
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value })
  }

  // create new loan
  _submit_loan_initiatin = (e) => {
    e.preventDefault();

    const {
      web3,
      current_address,
      account_password,
      wallet,
      eth_balance,
      userProfile,
    } = this.props

    const {
      // from_address,
      payback_duration,
      interest_rate,
      loancoin_amount,
      loancoinBalance,
    } = this.state

    if ( isNaN(parseInt(payback_duration, 10)) ) {
      console.log("payback_duration: ", payback_duration)
      return;
    } else if ( parseInt(payback_duration, 10) < 1 ) {
      console.log("payback_duration: ", payback_duration)
      return;
    } else if ( isNaN(parseInt(interest_rate, 10)) ) {
      console.log("interest_rate: ", interest_rate)
      return;
    } else if ( parseInt(interest_rate, 10) < 1 ) {
      console.log("interest_rate: ", interest_rate)
      return;
    } else if ( isNaN(parseInt(loancoin_amount, 10)) ) {
      console.log("loancoin_amount: ", loancoin_amount)
      return;
    } else if ( parseInt(loancoin_amount, 10) < 1 ) {
      console.log("loancoin_amount: ", loancoin_amount)
      return;
    }

    // let loancoinInstance = null;
    let _address = current_address

    // loan hash
    const loan_string = _address+"_"+payback_duration+"_"+interest_rate+"_"+loancoin_amount+"_1";
    const loan_hash = web3.utils.sha3(loan_string)

    let signedhash = null;

    // set passworl if needed
    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');
    } else {
      password = account_password
    }

    let publicKey;

    // update loading status
    this.props.updateLoadingStatus({ loading: true, })

    // 1. check password
    const params = {
      wallet: wallet,
      password: password,
    }
    getKeyFromWallet(params)
    .then(() => {
      // set password on props
      this.props.setPassword({ account_password: password, })
      wallet.passwordProvider = (callback) => {
        callback(null, password);
      };
    })
    .then(() => {
      // get public key
      const params = {
        userId: userProfile.address
      }
      return getPublicKey(params)
    })
    .then((results) => {
      publicKey = results.publicKey
    })
    .then(() => {
      const params = {
        web3: web3,
        account: current_address,
        wallet: wallet,
        password: password,
        eth_balance: eth_balance[current_address],
      }
      return myContractAPI.getSignedhash(params)
    })
    .then((results) => {
      // get signed hash
      // but first
      signedhash = results

      if ( parseInt(loancoinBalance, 10)  < parseInt(loancoin_amount, 10) ) {
        return Promise.reject(Error("do not enough loancoin"))
      }
      return Promise.resolve()
    })
    .then(() => {
      // move token to contract

      const params = {
        _loanhash: loan_hash,
        _value: parseInt(loancoin_amount, 10),
        web3: web3,
        address: current_address,
        eth_balance: eth_balance[current_address],
      }
      myContractAPI.moveTokenAsCollateral(params)
      .then((results) => {

        this.setState({
          collateral_balance: parseInt(loancoin_amount, 10),
        })
      })
    })
    .then(() => {
      // create ipfs

      // mofidy publicKey because we can not handle \n well
      publicKey = replaceall("\n", "@@@", publicKey);

      const param = {
        signedhash: signedhash,
        payback_duration: payback_duration,
        interest_rate: interest_rate,
        loancoin_amount: loancoin_amount,
        publicKey: publicKey,
      }
      return MyAPI.addLoanInitiation(param)
    })
    .then((data) => {

      if (!data){
        return Promise.reject(Error("server error"))
      }
      if (data.status !== 'success'){
        return Promise.reject(Error(data.message))
      } else {
        // success
        return Promise.resolve()
      }
    })
    .then(() => {
      return this._checkLoancoinAndEther()
    })
    .then(() => {

      Alert.success("Success", {
        position: 'top-right',
        effect: 'slide',
        timeout: 5000
      });

      this.props.updateLoadingStatus({ loading: false, })
    })
    .catch((err) => {
      console.log("err:", err)

      this.props.setPassword({ account_password: null, })
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


  _checkInitiatedLoans = () => {

    const { web3, current_address, wallet, account_password } = this.props

    // set passworl if needed
    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');
    } else {
      password = account_password
    }

    // start loading
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
      // get signed hash
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

      const signedhash = results

      let param = {
        signedhash: signedhash,
        search_type: 'my_initiation'
      }
      return MyAPI.getLoanList(param)
    })
    .then((results) => {

      if (!results){
        return Promise.reject(Error("server error"))
      }
      if (results.status !== 'success'){
        return Promise.reject(Error(results.message))
      }

      let my_loans = []
      if (results.loan_list && results.loan_list.length > 0) {
        my_loans = results.loan_list;
      }

      // success
      return Promise.resolve(my_loans)
    })
    .then((results) => {

      let my_loans = results

      this.setState({
        my_loans: my_loans
      })

      this.props.updateLoadingStatus({ loading: false, })

    })
    .catch((err) => {
      console.log("err: ", err)

      this.props.setPassword({ account_password: null, })
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

  _checkLoancoinAndEther = () => {
    this._checkLoancoinBalance()
    .then(() => {
      this._checkInitiatedLoans()
    })
  }

  render(){

    const {
      loading,
    } = this.props

    const {
      loancoinBalance,
      collateral,
      loancoin_amount,
      interest_rate,
      payback_duration,
      my_loans,
    } = this.state

    // show loading screen when processing...
    if ( loading === true ){
      return(<Loading />)
    }

    return(
      <Container style={{marginTop: 60,}}>

        <Header />

        <WalletCard loancoinBalance={loancoinBalance} />

        { parseInt(collateral, 10) === 0 && (
          <Row style={{marginTop: 60,}}>
            <Col>
              <span>
                Before creating lending offer, you need to move loancoin to contract which works as escrow account.
              </span>
            </Col>
          </Row>
        )}

        { parseInt(collateral, 10) !== 0 && (
          <Row>
            <Col>
              <span>
                What: {collateral}
              </span>
            </Col>
          </Row>
        )}

        {/* show form to create loan initiation */}

        {/*<Form inline onSubmit={this._submit_loan_initiatin}>*/}
        <Form onSubmit={this._submit_loan_initiatin}>

        <Row style={{ marginTop: 60, }}>
          <Col md="3" xs="12" style={{ textAlign: 'left' }}>
            <Label for="loancoin_amount" className="mr-sm-2">Amount</Label><br/>
            <InputGroup>
              <Input
                onChange={this.handleChange}
                value={loancoin_amount}
                type="text"
                name="loancoin_amount"
                id="loancoin_amount"
                placeholder="amount of loancoin" />
              <InputGroupAddon>LCN</InputGroupAddon>
            </InputGroup>
          </Col>
          <Col md="3" xs="12" style={{ textAlign: 'left' }}>
            <Label for="interest_rate" className="mr-sm-2">Interest</Label><br/>
            <InputGroup>
              <Input
                onChange={this.handleChange}
                value={interest_rate}
                type="text"
                name="interest_rate"
                id="interest_rate"
                placeholder="interest rate for a month" />
              <InputGroupAddon>%</InputGroupAddon>
            </InputGroup>
          </Col>
          <Col md="3" xs="12" style={{ textAlign: 'left' }}>
            <Label for="payback_duration" className="mr-sm-2">Duration</Label><br/>
            <InputGroup>
              <Input
                onChange={this.handleChange}
                value={payback_duration}
                type="text"
                name="payback_duration"
                id="payback_duration"
                placeholder="duration" />
              <InputGroupAddon>months</InputGroupAddon>
            </InputGroup>
          </Col>
          <Col md="3" xs="12" style={{ textAlign: 'left' }}>
            <Button style={{marginTop: 33}}>Initiate a loan</Button>
          </Col>
        </Row>


        </Form>

        {/* your loans */}
        <Row style={{marginTop: 60,}}>
          <Col style={{ textAlign: 'right', }}>
            <Button color="secondary" onClick={this._checkInitiatedLoans}>Check loans</Button>
          </Col>
        </Row>

        {my_loans && my_loans.length > 0 && my_loans.map((item) => (
          <LendLoanItem
            checkLCN={this._checkLoancoinAndEther}
            checkLIST={this._checkInitiatedLoans}
            key={shortid.generate()} item={item} />
        )) }

      </Container>
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
    loading: user.loading === true ? true : false,
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

export default withRouter(connect( mapStateToProps, mapDispatchToProps )(LendTop))
