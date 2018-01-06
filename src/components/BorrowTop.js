import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import {
  Button,
  Container,
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
import shortid from 'shortid'
import Header from './Header'
import * as MyAPI from '../utils/MyAPI'
import Loading from './Loading'
import * as myContractAPI from '../utils/myContractAPI'
import BorrowLoanItem from './BorrowLoanItem'
import WalletCard from './WalletCard'
import { getKeyFromWallet } from '../utils/walletHelpers'

class BorrowTop extends Component {

  state = {
    loancoinBalance: 0,
    loan_list: [],
  }

  componentDidMount() {
    this._checkLoancoinBalance()
    .then(() => {
      this._getLoansToApply()
    })
    .catch((err) => {
      console.log("err: ", err)
      this.props.history.push("/")
    })
  }

  // check loancoin balance
  _checkLoancoinBalance = () => {

    const { web3, current_address, account_password, wallet } = this.props
    if (!web3) {
      return Promise.reject(Error("No web3 detected"));
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

  // get loans user can apply
  _getLoansToApply = () => {

    const { web3, wallet, current_address, account_password } = this.props;

    // set passworl if needed
    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');
    } else {
      password = account_password
    }

    this.props.updateLoadingStatus({ loading: true, })

    let loan_list = []

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
      const signedhash = results

      let param = {
        signedhash: signedhash,
        search_type: "to_apply",
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

      loan_list = results.loan_list

      return Promise.resolve()
    })
    .then(() => {

      this.setState({
        loan_list: loan_list,
      })

      // update loading status
      this.props.updateLoadingStatus({ loading: false, })

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

      Alert.error(err.message, {
        position: 'top-right',
        effect: 'slide',
        timeout: 5000
      });

      // update loading status
      this.props.updateLoadingStatus({ loading: false, })
    })
  }

  render(){

    const {
      // userProfile,
      // avatarUrl,
      // wallet,
      // accounts,
      // eth_balance,
      // web3,
      loading,
      // current_address,
    } = this.props

    const {
      loancoinBalance,
      loan_list,
    } = this.state

    if ( loading === true ){
      return(<Loading />)
    }

    return(
      <Container style={{marginTop: 60,}}>

        <Header />

        <WalletCard loancoinBalance={loancoinBalance} />

        <Row style={{
            marginTop:40,
          }}>
          <Col style={{ textAlign: 'right', }}>
            <Button color="secondary" onClick={this._getLoansToApply}>reload loans</Button>
          </Col>
        </Row>

        {loan_list && loan_list.map((item) => (
          <BorrowLoanItem
            loancoinBalance={loancoinBalance}
            item={item}
            key={shortid.generate()}
            checkLoancoinBalance={this._checkLoancoinBalance}
            reload={this._getLoansToApply} />
        ))}


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
    loading: user.loading === true ? true : false,
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

export default withRouter(connect( mapStateToProps, mapDispatchToProps )(BorrowTop))
