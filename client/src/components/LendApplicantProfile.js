import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import {
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

class LendApplicantProfile extends Component {

  render(){

    const { profile, borrowerAddress } = this.props

    return(
      <div>
        <Row style={{marginTop: 14, }}>
          <Col>
            {borrowerAddress}
          </Col>
        </Row>
        <Row style={{marginTop: 14, }}>
          <Col>
            <img
              alt='profile'
              src={profile.avatar ? profile.avatar.uri : ''}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                borderColor: '#cccccc',
                borderWidth: 2,
                marginRight: 8,
            }}/>
            {profile.name} ({profile.country}, {profile.phone})
          </Col>
        </Row>
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

export default withRouter(connect( mapStateToProps, mapDispatchToProps )(LendApplicantProfile))
