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
  switchAddress,
  setPassword,
  updateLoancoinBalance,
} from '../actions/LoancoinActions'
import * as FontAwesome from 'react-icons/lib/fa'
// import * as myContractAPI from '../utils/myContractAPI'

class HomeAddressItem extends Component {

  // select address
  _selectAddress = () => {
    const { account } = this.props
    this.props.switchAddress({ current_address: account })
  }

  render(){

    const { eth_balance, current_address, account, lnc_balances } = this.props

    let loancoin_balance = 0
    if (lnc_balances[account]) {
      loancoin_balance = lnc_balances[account]
    }

    return(
      <Row style={{
          marginTop:20
        }}>
        <Col md="2" xs="12">
          {current_address !== account ? (
            <Button color="primary" onClick={this._selectAddress} style={{
                marginTop: 8,
              }}>Select</Button>
          ) : (

            <FontAwesome.FaCheck color="green" size={48}/>
          )}

        </Col>
        <Col md="4" xs="12" style={{marginTop:23}}>
          {account}
        </Col>
        <Col md="2" xs="12">
          <span style={{fontSize:36}}>{eth_balance[account] ? parseFloat(eth_balance[account]).toFixed(2) : parseFloat(0).toFixed(2) }</span> ETH
        </Col>
        <Col md="2" xs="12">
          <span style={{fontSize:36}}>{loancoin_balance}</span> LCN
        </Col>
        <Col md="2" />
      </Row>
    )
  }
}

function mapStateToProps ({ user }) {

  let wallet = null
  if (user && user.wallet){
    wallet = user.wallet
  }

  let web3 = null
  if (user && user.web3){
    web3 = user.web3
  }

  let lnc_balances = {}
  if (user && user.lnc_balances){
    lnc_balances = user.lnc_balances
  }

  let eth_balance = null
  if (user && user.eth_balance){
    eth_balance = user.eth_balance
  }

  let current_address = null;
  if (user && user.current_address) {
    current_address = user.current_address;
  }

  return {
    web3: web3,
    wallet: wallet,
    eth_balance: eth_balance,
    current_address: current_address,
    lnc_balances: lnc_balances,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    updateUser: (data) => dispatch(userLoginAction({ params: data})),
    setWallet: (data) => dispatch(setKeystoreAction({ params: data})),
    setWeb3: (data) => dispatch(setWeb3Action({ params: data})),
    updateEthBalance: (data) => dispatch(updateEthBalanceAction({ params: data})),
    updateLoadingStatus: (data) => dispatch(updateLoadingStatus({ params: data})),
    switchAddress: (data) => dispatch(switchAddress({ params: data})),
    setPassword: (data) => dispatch(setPassword({ params: data})),
    updateLoancoinBalance: (data) => dispatch(updateLoancoinBalance({ params: data})),
  }
}

export default withRouter(connect( mapStateToProps, mapDispatchToProps )(HomeAddressItem))
