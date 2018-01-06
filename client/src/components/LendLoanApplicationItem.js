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
import * as MyAPI from '../utils/MyAPI'
import * as myContractAPI from '../utils/myContractAPI'
import { ClipLoader } from 'react-spinners';
import { getKeyFromWallet } from '../utils/walletHelpers'
import { decryptDataWithPrivateKey } from '../utils/cryptHelpers'
import LendApplicantProfile from './LendApplicantProfile'

class LendLoanApplicationItem extends Component {

  state = {
    collateral_balance: 0,
    networking: false,
    profile_json: null
  }

  componentDidMount() {
    const { applicationItem, userProfile } = this.props

    const params = {
      userId: userProfile.address,
      encrypted: applicationItem.encrypted,
    }
    decryptDataWithPrivateKey(params)
    .then((results) => {

      const profile_json = JSON.parse(results)
      this.setState({
        profile_json: profile_json
      })
    })
    .catch((err) => {
      console.log("err: ", err)
    })
  }

  _approveBorrower = () => {
    // make loan template closed
    // create leagal document
    // put hash on contract

    const { web3, wallet, applicationItem, current_address, loanItem, account_password } = this.props;
    // const loanHash = item.loan_hash;

    // set passworl if needed
    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');
    } else {
      password = account_password
    }

    // update loading status
    // this.props.updateLoadingStatus({ loading: true, })
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
        password: password
      }
      return myContractAPI.getSignedhash(params)
    })
    .then((results) => {
      // set signed hash
      const signedHash = results

      let params = {
        signedhash: signedHash,
        loanHash: loanItem.loanHash,
        borrower: applicationItem.borrower,
      }
      return MyAPI.approveBorrower(params)
    })
    .then((results) => {
      // update loading status
      // this.props.updateLoadingStatus({ loading: false, })
      this.setState({
        networking: false,
      })
    })
    .then(() => {
      this.props.reload()
    })
    .catch((err) => {
      console.log("err: ", err)

      this.props.setPassword({ account_password: null, })
      // this.props.updateLoadingStatus({ loading: false, })

      // make it back to default
      if (err.message === 'Incorrect derived key!' || err.message === 'no password') {
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

  render(){

    const { applicationItem, loanItem } = this.props
    const { networking, profile_json } = this.state

    return(
      <Row style={{marginTop: 14, }}>
        <Col md="8" xs="12" style={{ textAlign: 'left'}}>

          {profile_json ? (
            <LendApplicantProfile profile={profile_json} borrowerAddress={applicationItem.borrower} />
          ) : (
            <span>
              From: {applicationItem.borrower}
            </span>
          )}

        </Col>
        <Col md="4" xs="12" style={{ textAlign: 'right', }}>

          { loanItem.status === 'open' && (
            <Button color="primary" onClick={this._approveBorrower} disabled={networking}>
              {networking && (
                <ClipLoader
                  size={20}
                  color={'#cccccc'}
                  loading={networking} />
              )}
              Approve
            </Button>
          )}

          { loanItem.status === 'closed' && loanItem.accepted_borrower === applicationItem.borrower && (
            <span style={{color: 'green'}}>
              Accepted
            </span>
          )}

        </Col>
      </Row>
    )
  }
}

function mapStateToProps ({ user }) {
  
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

export default withRouter(connect( mapStateToProps, mapDispatchToProps )(LendLoanApplicationItem))
