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
import Header from './Header'
// import Ionicon from 'react-ionicons'
import * as FontAwesome from 'react-icons/lib/fa'
import Loading from './Loading'
import * as myContractAPI from '../utils/myContractAPI'
import WalletCard from './WalletCard'

class LoancoinConverter extends Component {

  // variables
  local_strage_key = null

  state = {
    loancoinBalance: 0,
    buyPrice: 0,
    sellPrice: 0,
    ether_in_input: 0,
    loancoin_in_input: 0,
    convert_to: 'loancoin',
  }

  componentDidMount() {
    this.checkLoancoinBalance();
  }

  // check loancoin balance
  checkLoancoinBalance = () => {

    const { web3, current_address } = this.props
    if (!web3) {
      this.props.history.push("/")
      return;
    }

    // for the time beging, lets keep this in state
    let loancoinBalance = 0
    let buyPrice = 0;
    let sellPrice = 0;

    let params = {
      web3: web3,
      address: current_address,
    }
    myContractAPI.checkLoancoinBalance(params)
    .then((resuls) => {

      // set loancoin balance
      loancoinBalance = parseInt(resuls, 10)

      let params = {
        web3: web3,
        address: current_address,
      }
      return myContractAPI.checkTokenPrices(params)
    })
    .then((results) => {
      // set sell and buy price

      buyPrice = results.buy_price;
      sellPrice = results.sell_price;

      this.setState({
        loancoinBalance: loancoinBalance,
        buyPrice: buyPrice,
        sellPrice: sellPrice,
      })
    })
    .catch((err) => {
      console.log("err: ", err)
    })
  }

  // buy loancoin
  _buyLoancoin = () => {

    const { web3, current_address, account_password, eth_balance, wallet } = this.props
    if (!web3) {
      this.props.history.push("/")
      return;
    }

    const { ether_in_input } = this.state

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
      // 2. buy token
      const params = {
        web3: web3,
        address: current_address,
        ether_in_input: ether_in_input,
        eth_balance: eth_balance[current_address],
      }
      return myContractAPI.buy(params)
    })
    .then(() => {
      this.checkLoancoinBalance();
    })
    .then((results) => {
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

  _sellLoancoin = () => {

    const { web3, current_address, account_password, eth_balance, wallet } = this.props
    if (!web3) {
      this.props.history.push("/")
      return;
    }

    const { loancoin_in_input } = this.state

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
      const params = {
        web3: web3,
        address: current_address,
        loancoin_in_input: loancoin_in_input,
        eth_balance: eth_balance[current_address],
      }
      return myContractAPI.sell(params)
    })
    .then(() => {
      this.checkLoancoinBalance();
    })
    .then((results) => {
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


  toggleConvertTo = () => {

    const { convert_to } = this.state

    this.setState({
      convert_to: convert_to === 'loancoin' ? 'ether' : 'loancoin'
    })
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value })
  }

  render(){

    const {
      current_address,
      web3,
      loading,
     } = this.props
    const {
      loancoinBalance,
      buyPrice,
      sellPrice,
      ether_in_input,
      loancoin_in_input,
      convert_to,
    } = this.state

    // show loading screen when processing...
    if ( loading === true ){
      return(<Loading />)
    }

    // calculate loancoin _value
    let loancoin_value = 0
    if ( isNaN(parseFloat(ether_in_input)) !== true && buyPrice !== 0) {
      loancoin_value = web3.utils.toWei(parseFloat(ether_in_input)) / buyPrice
    }

    return(
      <Container style={{marginTop: 60,}}>

        <Header />

        <WalletCard loancoinBalance={loancoinBalance} />

        <div style={{
            marginTop: 40,
            marginBottom: 40,
          }}/>

        {current_address && convert_to === 'loancoin' && (

          <Form>
            <Row style={{
                marginTop:10,
                marginBottom:10,
              }}>
              <Col xs="2" md="2"/>
              <Col xs="4" md="4" style={{textAlign:'left'}}>
                <span>Sell ether to buy loancoin</span>
              </Col>
              <Col xs="4" md="4" style={{textAlign:'right'}}>
                <span onClick={this.toggleConvertTo} style={{ cursor: 'pointer', }}>
                  <FontAwesome.FaArrowsH size={35} color="#000000" />
                </span>
              </Col>

              <Col xs="2" md="2"/>
            </Row>
            <Row style={{
                marginTop:20,
                marginBottom:20,
                textAlign: 'center',
              }}>
              <Col xs="2" md="2"/>
              <Col xs="3" md="3">
                <InputGroup>
                  <Input
                    onChange={this.handleChange}
                    value={ether_in_input}
                    type="text"
                    name="ether_in_input"
                    placeholder="Ether" />
                  <InputGroupAddon>ETH</InputGroupAddon>
                </InputGroup>
              </Col>
              <Col xs="2" md="2">
                <FontAwesome.FaArrowRight size={35} color="#000000" />
              </Col>
              <Col xs="3" md="3">
                <InputGroup>
                  <Input
                    disabled
                    value={loancoin_value}
                    type="text"
                    placeholder="Loancoin" />
                  <InputGroupAddon>LCN</InputGroupAddon>
                </InputGroup>
              </Col>
              <Col xs="2" md="2"/>
            </Row>
            <Row style={{
                marginTop:20,
                marginBottom:20,
              }}>
              <Col xs="2" md="2"/>
              <Col xs="8" md="8">
                <Button color="primary" onClick={this._buyLoancoin} style={{ width: '100%' }}>buy loancoin</Button>
              </Col>
              <Col xs="2" md="2"/>
            </Row>
          </Form>
        )}

        {current_address && convert_to === 'ether' && (

          <Form>
            <Row style={{
                marginTop:10,
                marginBottom:10,
              }}>
              <Col xs="2" md="2"/>
              <Col xs="4" md="4" style={{textAlign:'left'}}>
                <span>Sell loancoin to buy ether</span>
              </Col>
              <Col xs="4" md="4" style={{textAlign:'right'}}>
                <span onClick={this.toggleConvertTo} style={{ cursor: 'pointer', }}>
                  <FontAwesome.FaArrowsH size={35} color="#000000" />
                </span>
              </Col>

              <Col xs="2" md="2"/>
            </Row>
            <Row style={{
                marginTop:20,
                marginBottom:20,
                textAlign: 'center',
              }}>
              <Col xs="2" md="2"/>
              <Col xs="3" md="3">
                <InputGroup>
                  <Input
                    onChange={this.handleChange}
                    value={loancoin_in_input}
                    type="text"
                    name="loancoin_in_input"
                    placeholder="Loancoin" />
                  <InputGroupAddon>LCN</InputGroupAddon>
                </InputGroup>
              </Col>
              <Col xs="2" md="2">
                <FontAwesome.FaArrowRight size={35} color="#000000" />
              </Col>
              <Col xs="3" md="3">

                <InputGroup>
                  <Input
                    disabled
                    value={loancoin_in_input > 0 && web3.utils.fromWei(loancoin_in_input * sellPrice) }
                    type="text"
                    placeholder="Loancoin" />
                  <InputGroupAddon>ETH</InputGroupAddon>
                </InputGroup>
              </Col>
              <Col xs="2" md="2"/>
            </Row>
            <Row style={{
                marginTop:20,
                marginBottom:20,
              }}>
              <Col xs="2" md="2"/>
              <Col xs="8" md="8">
                <Button color="primary" onClick={this._sellLoancoin} style={{ width: '100%' }}>sell loancoin</Button>
              </Col>
              <Col xs="2" md="2"/>
            </Row>
          </Form>

        )}

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
    current_address:current_address,
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

export default withRouter(connect( mapStateToProps, mapDispatchToProps )(LoancoinConverter))
