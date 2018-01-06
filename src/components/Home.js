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
  updateLoancoinBalance,
} from '../actions/LoancoinActions'
import Alert from 'react-s-alert';
import * as myContractAPI from '../utils/myContractAPI'
// import Web3 from 'web3'
// import lightwallet from 'eth-lightwallet'
// import HookedWeb3Provider from 'hooked-web3-provider'
import shortid from 'shortid'
import Header from './Header'
import * as MyAPI from '../utils/MyAPI'
// import { RPC_SERVER } from '../utils/Settings'
import HomeAddressItem from './HomeAddressItem'
import Loading from './Loading'
import SweetAlert from 'sweetalert-react';
import {
  getKeyFromWallet,
  setWeb3Provider,
  newAddresses,
  createNewWallet,
  showSeed,
  deserializeWallet,
} from '../utils/walletHelpers'

// example seed text: orange series slender home autumn option work goat happy burst swamp offer
class Home extends Component {

  // variables
  local_strage_key = null

  // states
  state = {
    sweet_alert_show: false,
    sweet_alert_title: '',
    sweet_alert_text: '',
  }

  componentDidMount() {

    const { userProfile } = this.props

    this.local_strage_key = userProfile.address

    const serialized_keystore = localStorage.getItem(this.local_strage_key)
    if (!serialized_keystore) {
      return;
    }

    // if eth-lightwallet vesion is not matched we get an errro
    let wallet
    try {
      wallet = deserializeWallet({serialized_keystore: serialized_keystore})
    } catch (err) {
      console.log("err: ", err)
      // should upgrade with upgradeOldSerialized ?
      // localStorage.removeItem(this.local_strage_key)
    }

    const params = {
      wallet: wallet,
    }
    this.props.setWallet(params)

    if ( this.props && this.props.wallet ){
      this.pageReady(this.props)
    }
  }

  // detect props changed
  componentWillReceiveProps(nextProps) {
    if ( !this.props.wallet && nextProps.wallet){
      this.pageReady(nextProps)
    }
  }

  // called when wallet is ready
  pageReady = (props) => {

    const { wallet } = props
    if (!wallet) {
      return;
    }

    Promise.resolve()
    .then(() => {
      // set web3 provider
      return setWeb3Provider({ wallet: wallet })
    })
    .then(({ web3 }) => {
      // update props
      const params = {
        web3: web3
      }
      this.props.setWeb3(params)
      return Promise.resolve({web3:web3})
    })
    .then(({ web3 }) => {
      // get balance
      return this._getBalances(web3, wallet)
    })
    .then(({ web3, wallet }) => {
      return this._getLoancoinBalances({ _web3: web3, _wallet: wallet })
    })
    .catch((err) => {
      console.log("err: ", err)
    })
  }

  // get loancoin balance
  _getLoancoinBalances = ({ _web3, _wallet }) => {

    let web3
    if (_web3) {
      web3 = _web3
    } else if (this.props.web3) {
      web3 = this.props.web3
    } else {
      return;
    }

    let wallet
    if (_wallet) {
      wallet = _wallet
    } else if (this.props.wallet) {
      wallet = this.props.wallet
    } else {
      return;
    }

    const accounts = wallet.getAddresses()

    let lnc_balances = {}
    return Promise.resolve()
    .then(() => {
      return new Promise((resolve, reject) => {

        let sequence = Promise.resolve()

        accounts.forEach((account, idx) => {

          sequence = sequence.then(() => {

            const params = {
              web3: web3,
              address: account,
            }
            return myContractAPI.checkLoancoinBalance(params)

          })
          .then((results) => {
            lnc_balances[account] = parseInt(results, 10)
            return Promise.resolve()
          })
          .then((results) => {
            if ( idx === (accounts.length - 1) ){
              resolve()
            } else {
              return "OK"
            }
          })
          .catch((err) =>{

            if ( idx === (accounts.length - 1) ){
              resolve()
            } else {
              return "NG"
            }
          })
        })
      })
    })
    .then(() => {
      this.props.updateLoancoinBalance({lnc_balances: lnc_balances})
    })
  }




  // get eth balance
  _getBalances = (_web3, _wallet) => {

    let web3
    if (_web3){
      web3 = _web3
    } else {
      web3 = this.props.web3
    }

    let wallet
    if (_wallet){
      wallet = _wallet
    } else {
      wallet = this.props.wallet
    }

    let addresses = wallet.getAddresses();

    let eth_balance = {}

    return Promise.resolve()
    .then(() => {
      return Promise.all( addresses.map((address) => {
        return new Promise((resolve, reject) => {

          web3.eth.getBalance(address, (err, data) => {
            if (err) {
              reject(err)
            } else {
              let balance = web3.utils.fromWei( data, 'ether');
              eth_balance[address] = balance
            }
            resolve()
          })
        })
      }))
    })
    .then(() => {

      const params = {
        eth_balance: eth_balance
      }
      this.props.updateEthBalance(params)
    })
    .then(() => {
      return Promise.resolve({ web3: web3, wallet: wallet})
    })
  }

  // create new wallet
  _createNewWallet = ({ seed_text }) => {

    const { account_password } = this.props

    // let randomSeed

    // if (seed_text){
    //   randomSeed = seed_text
    // } else {
    //   let extraEntropy = shortid.generate()
    //   randomSeed = lightwallet.keystore.generateRandomSeed(extraEntropy);
    // }

    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');

      // only here
      this.props.setPassword({ account_password: password, })

    } else {
      password = account_password
    }

    let newWallet
    let newWeb3

    // we don't check password here because this is the place we set password
    Promise.resolve()
    .then(() => {

      const params = {
        seed_text: seed_text,
        password: password,
      }
      return createNewWallet(params)
    })
    .then(({ web3, wallet, seed_text }) => {
      // get balance

      newWallet = wallet
      newWeb3 = web3

      newWallet.passwordProvider = (callback) => {
        callback(null, password);
      };

      return this._getBalances(newWeb3, newWallet)
    })
    .then(() => {
      // save keystore
      const serialized_keystore = newWallet.serialize()
      localStorage.setItem(this.local_strage_key, serialized_keystore )
    })
    .then(() => {
      // update props

      const params = {
        web3: newWeb3
      }
      this.props.setWeb3(params)
    })
    .then(() => {

      const params = {
        wallet: newWallet,
      }
      this.props.setWallet(params)
    })
    .catch((err) => {
      console.log("err: ", err)

      this.props.setPassword({ account_password: null, })

      Alert.error(err.message, {
        position: 'top-right',
        effect: 'slide',
        timeout: 5000
      });
    })
  }

  // show seed text
  // so far we store keystore on the device
  // but ideally we should be able to resore wallet at any device.
  _showSeed = () => {

    const { wallet, account_password } = this.props

    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');
    } else {
      password = account_password
    }

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
        wallet: wallet,
        password: password,
      }
      return showSeed(params)
    })
    .then((results) => {
      this.setState({
        sweet_alert_show: true,
        sweet_alert_title: 'Your seed',
        sweet_alert_text: 'Your seed is: "' + results + '". Please write it down.',
      })
    })
  }

  // recover wallet from seed text
  _recoverWalletFromSeed = () => {
    let seed_text = prompt('Enter your seed text', '');
    this._createNewWallet({seed_text: seed_text})
  }

  // logout
  _logout = () => {
    window.location.reload();
  }

  // destroy wallet
  _destroyWallet = () => {
    localStorage.removeItem(this.local_strage_key)
    this.props.setWallet({ wallet: null })
    this.props.setWeb3({ web3: null })
    this.props.updateEthBalance({ eth_balance: null })
  }

  // test purpose only
  // request ether for testing
  _giveMeEther = () => {

    const { web3, wallet, current_address, account_password } = this.props;
    // const account = current_address

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
      }
      return MyAPI.giveMeEther(param)
    })
    .then((results) => {
      if (!results){
        return Promise.reject(Error("server error"))
      }
      if (results.status !== 'success'){
        return Promise.reject(Error(results.message))
      }
      return Promise.resolve()
    })
    .then(() => {
      return this._getBalances(web3, wallet)
    })
    .then((results) => {
      Alert.success("You got ether", {
        position: 'top-right',
        effect: 'slide',
        timeout: 5000
      });

      this.props.updateLoadingStatus({ loading: false, })
    })
    .catch((err) => {
      console.log("err: ", err)

      this.props.updateLoadingStatus({ loading: false, })

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
    })
  }

  // add 1 more eth address
  _addOneMoreAddress = () => {

    const { wallet, account_password } = this.props

    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');
    } else {
      password = account_password
    }

    // 1. check password
    const params = {
      wallet: wallet,
      password: password,
    }
    getKeyFromWallet(params)
    .then(() => {
      // password is okay
      this.props.setPassword({ account_password: password, })
      wallet.passwordProvider = (callback) => {
        callback(null, password);
      };
    })
    .then(() => {
      // add new address

      const params = {
        wallet: wallet,
        password: password,
      }
      return newAddresses(params)

      // return new Promise((resolve, reject) => {
      //   this.newAddresses(wallet, (err) => {
      //     if (err){
      //       reject(err)
      //     }
      //     resolve()
      //   });
      // })
    })
    .then(() => {
      // save keystore
      const serialized_keystore = wallet.serialize()
      localStorage.setItem(this.local_strage_key, serialized_keystore )
    })
    .then(() => {
      const params = {
        wallet: wallet,
      }
      this.props.setWallet(params)
    })
    .catch((err) => {
      console.log("err: ", err)

      Alert.error(err.message, {
        position: 'top-right',
        effect: 'slide',
        timeout: 5000
      });
    })
  }

  render(){

    const {
      userProfile,
      avatarUrl,
      wallet,
      accounts,
      // eth_balance,
      current_address,
      loading,
    } = this.props

    const { sweet_alert_show, sweet_alert_title, sweet_alert_text }  = this.state

    // show loading screen when processing...
    if ( loading === true ){
      return(<Loading />)
    }

    // <HomeAddressItem key={shortid.generate()} account={"0x"+account} />

    return(
      <Container style={{marginTop: 60,}}>

        <SweetAlert
          show={sweet_alert_show}
          title={sweet_alert_title}
          text={sweet_alert_text}
          onConfirm={() => this.setState({ sweet_alert_show: false })}
        />

        <Header />

        <Row>
          <Col md="12" xs="12" style={{textAlign: 'right', color:'#cccccc'}}>
            <span onClick={this._logout} style={{cursor: 'pointer'}}>logout</span>
          </Col>
        </Row>

        <Row>
          <Col>
            <img
              alt='profile'
              src={avatarUrl}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                borderColor: '#cccccc',
                borderWidth: 2,
            }}/>
          </Col>
        </Row>
        <Row>
          <Col>
            <span>{userProfile.name}</span>
          </Col>
        </Row>

        {accounts && (

          <Row style={{
              marginTop:40,
              borderBottomWidth: 1,
              borderBottomColor: '#cccccc',
              borderBottomStyle: 'dashed',
            }}>
            <Col md="2"/>
            <Col md="4" >
              Address
            </Col>
            <Col md="2">
              ETH
            </Col>
            <Col md="2">
              Loancoin
            </Col>
            <Col md="2" />
          </Row>
        )}

        {accounts && accounts.map((account) => (
          <HomeAddressItem key={shortid.generate()} account={account} />
        ))}


        {wallet ? (
          <div>
            <Row style={{marginTop:60}}>

              <Col md="6" />
              <Col md="2" xs="12" style={{
                  textAlign: 'center',
                  marginTop:10,
                  marginBottom:10,
                }}>
                <Button onClick={this._addOneMoreAddress} style={{
                    width: '100%',
                  }}>Add an address</Button>
              </Col>

              <Col md="2" xs="12" style={{
                  textAlign: 'center',
                  marginTop:10,
                  marginBottom:10,
                }}>
                <Button onClick={this._showSeed} style={{
                    width: '100%',
                  }}>show seed text</Button>
              </Col>

              <Col md="2" xs="12" style={{
                  textAlign: 'center',
                  marginTop:10,
                  marginBottom:10,
                }}>
                <Button color="danger" onClick={this._destroyWallet} style={{
                    width: '100%',
                  }}>destroy wallet</Button>
              </Col>

            </Row>
          </div>

        ) : (
          <Row style={{marginTop:60}}>

            <Col md="3" />
            <Col md="3" xs="12" style={{textAlign: 'center', margin:10,}}>
              <Button
                onClick={this._createNewWallet}
                color="primary">Create new wallet</Button>
            </Col>

            <Col md="3" xs="12" style={{textAlign: 'center', margin:10,}}>
              <Button
                onClick={this._recoverWalletFromSeed}
                color="secondary">Recover wallet from seed text</Button>
            </Col>
            <Col md="3" />


          </Row>
        )}

        {/*  Authenticated Faucet */}
        {current_address && (
          <Row style={{marginTop:20, marginBottom: 60}}>
            <Col md="10" xs="12" />
            <Col md="2" xs="12" style={{textAlign: 'center',  marginBottom:10,}}>
              <Button
                color='primary'
                style={{
                  width: '100%',
                }}
                onClick={this._giveMeEther}>
                Ether faucet
              </Button>
            </Col>
          </Row>
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
    updateLoancoinBalance: (data) => dispatch(updateLoancoinBalance({ params: data})),
  }
}

export default withRouter(connect( mapStateToProps, mapDispatchToProps )(Home))
