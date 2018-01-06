import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import {
  Row,
  Col,
 } from 'reactstrap';

class WalletCard extends Component {

  render(){

    const {
      eth_balance,
      current_address,
      loancoinBalance,
     } = this.props

    return(
      <Row>
        <Col md="6" />
        <Col md="6" xs="12" style={{
            textAlign: 'left',
            borderColor: '#cccccc',
            borderWidth: 1,
            borderStyle: 'solid',
            padding: 8,
          }}>
          <Row>
            <Col>
              <span style={{fontSize: 14}}>{current_address}</span>
            </Col>
          </Row>
          <Row>
            <Col md="6" xs="12" style={{ textAlign: 'left' }}>
              <span style={{color: 'green', fontSize:22,}}>
                {eth_balance ? eth_balance[current_address] : 0}
              </span>
              <span style={{color: '#cccccc', fontSize:14,}}> ETH</span>
            </Col>

            <Col md="6" xs="12" style={{ textAlign: 'right' }}>
              <span style={{color: 'orange', fontSize:22,}}>
                {loancoinBalance}
              </span>
              <span style={{color: '#cccccc', fontSize:14,}}> LCN</span>
            </Col>
          </Row>
        </Col>
      </Row>
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
    current_address:current_address,
    loading: user.loading === true ? true : false,
    account_password: account_password,
  }
}

export default withRouter(connect(mapStateToProps, null)(WalletCard))
