import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import {
  Button,
  Container,
  Row,
  Col,
 } from 'reactstrap';
import * as MyAPI from '../utils/MyAPI'
import * as myContractAPI from '../utils/myContractAPI'
import Alert from 'react-s-alert';
import Header from './Header'
import SweetAlert from 'sweetalert-react'; // eslint-disable-line import/no-extraneous-dependencies
import 'sweetalert/dist/sweetalert.css';
import {
  userLoginAction,
  setKeystoreAction,
  setWeb3Action,
  updateEthBalanceAction,
  updateLoadingStatus,
  setPassword,
} from '../actions/LoancoinActions'
import Loading from './Loading'
import WalletCard from './WalletCard'
import { getKeyFromWallet } from '../utils/walletHelpers'
import { encryptDataWithPublicKey, decryptDataWithPrivateKey, getPublicKey } from '../utils/cryptHelpers'
// import crypto2 from 'crypto2';

class OracleExample extends Component {

  state = {
    disabled: false,
    sweet_alert_show: false,
    sweet_alert_title: 'title',
    sweet_alert_text: 'text',
    loancoinBalance: 0,
    showProfile: null,
    ipfs_hash_of_uport_profile: null,
    encrypted_profile: null,
    decrypted_profile: null,
  }

  componentDidMount() {
    this._checkLoancoinBalance()
  }

  // check loancoin balance
  _checkLoancoinBalance = () => {

    const { web3, current_address } = this.props
    if (!web3) {
      this.props.history.push("/")
      return;
    }

    // for the time beging, lets keep this in state
    let loancoinBalance = 0
    // let collateral = 0;

    const params = {
      web3: web3,
      address: current_address,
    }
    return myContractAPI.checkLoancoinBalance(params)
    .then((results) => {
      // update state
      loancoinBalance = parseInt(results, 10)

      this.setState({
        loancoinBalance: loancoinBalance,
      })
    })
    .catch((err) => {
      console.log("err: ", err)
    })
  }

  // handleChange = (e, { name, value }) => {
  handleChange = (e, v) => {
    this.setState({ [e.target.name]: e.target.value })
  }

  _uploadUportProfile = () => {

    const {
      web3,
      current_address,
      account_password,
      wallet,
      userProfile,
    } = this.props

    // set passworl if needed
    let password = null;
    if (!account_password) {
      password = prompt('Please enter your password.', 'Password');
    } else {
      password = account_password
    }

    // update loading status
    this.props.updateLoadingStatus({ loading: true, })

    let signedhash = null;
    let profile_string_enc = null

    const profile = {
      avatar: userProfile.avatar,
      country: userProfile.country,
      name: userProfile.name,
      phone: userProfile.phone ? 'verified on uport' : '',
    }
    const profile_string = JSON.stringify(profile)

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
      // get public key
      return getPublicKey({ userId: userProfile.address })
    })
    .then((results) => {

      const publicKey = results.publicKey

      // encrypt
      const params = {
        userId: userProfile.address,
        rawData: profile_string,
        publicKey: publicKey,
      }
      return encryptDataWithPublicKey(params)
    })
    .then((results) => {

      profile_string_enc = results

      const messageHash = web3.utils.sha3(profile_string_enc)

      const params = {
        web3: web3,
        account: current_address,
        wallet: wallet,
        password: password,
        messageHash: messageHash,
      }
      return myContractAPI.createSignWithMessage(params)
    })
    .then((results) => {
      // get signed hash
      // but first
      signedhash = results

      return Promise.resolve()
    })
    .then(() => {
      // create ipfs

      const param = {
        signedhash: signedhash,
        profile_string_enc: profile_string_enc,
        address: current_address,
      }
      return MyAPI.sendUportProfile(param)
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

      Alert.error(err.message, {
        position: 'top-right',
        effect: 'slide',
        timeout: 5000
      });
    })
  }

  _checkProfile = () => {

    const {
      userProfile,
    } = this.props

    const profile = {
      avatar: userProfile.avatar,
      country: userProfile.country,
      name: userProfile.name,
      phone: userProfile.phone ? 'verified on uport' : '',
    }

    this.setState({
      showProfile: this.state.showProfile ? null : JSON.stringify(profile)
    })
  }

  _checkIPFShash = () => {

    const {
      web3,
      current_address,
    } = this.props

    let ipfs_hash = null

    const params = {
      web3: web3,
      address: current_address,
    }
    myContractAPI.hydraIPFSofUportProfile(params)
    .then((results) => {

      ipfs_hash = results.trim()

      this.setState({
        // disabled: false,
        // sweet_alert_show: true,
        // sweet_alert_title: 'ipfs hash',
        // sweet_alert_text: ipfs_hash,
        ipfs_hash_of_uport_profile: ipfs_hash,
      })
    })
    .then(() => {
      // get data
      const params = {
        ipfsHash: ipfs_hash
      }
      return MyAPI.getUportProfile(params)
    })
    .then((results) => {

      if (!results) {
        return Promise.reject(Error("server error"))
      }
      if (results.status === 'error') {
        return Promise.reject(Error(results.message))
      }

      // const encrypted = results.results
      this.setState({
        encrypted_profile: results.results,
      })

    })
    .catch((err) => {
      console.log("err :", err)

      Alert.error(err.message, {
        position: 'top-right',
        effect: 'slide',
        timeout: 5000
      });
    })
  }

  _decryptEncryptedProfile = () => {

    const { userProfile } = this.props
    const { encrypted_profile } = this.state

    const params = {
      userId: userProfile.address,
      encrypted: encrypted_profile
    }
    decryptDataWithPrivateKey(params)
    .then((results) => {

      this.setState({
        decrypted_profile: results
      })
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

    const { loading } = this.props
    const {
      disabled,
      sweet_alert_show,
      sweet_alert_title,
      sweet_alert_text,
      loancoinBalance,
      showProfile,
      ipfs_hash_of_uport_profile,
      encrypted_profile,
      decrypted_profile,
    } = this.state

    // show loading screen when processing...
    if ( loading === true ){
      return(<Loading />)
    }

    return (
      <Container style={{marginTop: 60,}}>

        <SweetAlert
          show={sweet_alert_show}
          title={sweet_alert_title}
          text={sweet_alert_text}
          onConfirm={() => this.setState({ sweet_alert_show: false })}
        />

        <Header />

        <WalletCard loancoinBalance={loancoinBalance} />

        <Row style={{marginTop: 40, marginBottom: 30}}>
          <Col md="3" xs="12" />
          <Col md="6" xs="12" style={{textAlign: 'left'}}>
            <span>
              Store profile data on ipfs network and save the ipfs hash on ethereum network.
              <br/>
              This is a demo for oracle. Client upload profile data and signed hash to oracle server. Oracle server verify sender's address and store the ipfs hash on ethereum.
            </span>
          </Col>
          <Col md="3" xs="12" />
        </Row>

        <Row>
          <Col md="4" xs="12" />
          <Col md="4" xs="12" style={{textAlign: 'center'}}>
            <Button
              disabled={disabled}
              onClick={this._checkProfile}>check your profile</Button>
          </Col>
          <Col md="4" xs="12" />
        </Row>


        {showProfile && (
          <Row style={{marginTop: 30, marginBottom: 30}}>
            <Col xs="3" />
            <Col xs="6" style={{
                textAlign: 'left',
                wordWrap: 'break-word',
              }}>
              <span>
                {showProfile}
              </span>
            </Col>
            <Col xs="3" />
          </Row>
        )}
        {showProfile && (
          <Row>
            <Col md="4" xs="12" />
            <Col md="4" xs="12" style={{textAlign: 'center'}}>
              <Button
                disabled={disabled}
                onClick={this._uploadUportProfile}
                color="primary">Upload uport profile</Button>
            </Col>
            <Col md="4" xs="12" />
          </Row>
        )}

        <Row style={{marginTop: 40, marginBottom: 30}}>
          <Col xs="3" />
          <Col xs="6" style={{textAlign: 'left'}}>
            <span>
              You can check the saved hash here.
            </span>
          </Col>
          <Col xs="3" />
        </Row>

        <Row style={{marginTop: 30, marginBottom: 30}}>
          <Col xs="4" />
          <Col xs="4" style={{textAlign: 'center'}}>
            <Button
              disabled={disabled}
              onClick={this._checkIPFShash}>Check ipfs hash</Button>
          </Col>
          <Col xs="4" />
        </Row>

        {ipfs_hash_of_uport_profile && (
          <Row style={{marginTop: 30, marginBottom: 30}}>
            <Col xs="3" />
            <Col xs="6" style={{textAlign: 'left'}}>
              <span>https://ipfs.io/ipfs/{ipfs_hash_of_uport_profile}</span>
            </Col>
            <Col xs="3" />
          </Row>
        )}

        {encrypted_profile && (
          <Row style={{marginTop: 30, marginBottom: 30}}>
            <Col xs="3" />
            <Col xs="6" style={{textAlign: 'left'}}>
              <span style={{
                  wordWrap: 'break-word',
                }}>{encrypted_profile}</span>
            </Col>
            <Col xs="3" />
          </Row>
        )}
        {encrypted_profile && (
          <Row style={{marginTop: 30, marginBottom: 30}}>
            <Col xs="4" />
            <Col xs="4" style={{textAlign: 'center'}}>
              <Button
                disabled={disabled}
                onClick={this._decryptEncryptedProfile}>Decrypt Profile</Button>
            </Col>
            <Col xs="4" />
          </Row>
        )}

        {decrypted_profile && (
          <Row style={{marginTop: 30, marginBottom: 30}}>
            <Col xs="3" />
            <Col xs="6" style={{textAlign: 'left'}}>
              <span style={{
                  wordWrap: 'break-word',
                }}>{decrypted_profile}</span>
            </Col>
            <Col xs="3" />
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
  }
}

export default withRouter(connect( mapStateToProps, mapDispatchToProps )(OracleExample))
