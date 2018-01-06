import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Button, Row, Col } from 'reactstrap';
import { uport } from '../utils/myUport'
import { userLoginAction } from '../actions/LoancoinActions'
import Alert from 'react-s-alert';

class GetStarted extends Component {

  clicked = (e) => {

    // Request credentials to login
    uport.requestCredentials({
      requested: ['name', 'avatar','phone', 'country'],
      notifications: true // We want this if we want to recieve credentials
    })
    .then((userProfile) => {
      // Do something
      return Promise.resolve(userProfile)
    })
    .then((userProfile) => {

      const params = {
        profile: userProfile,
      }
      this.props.updateUser(params)
    })
    .then(() => {
      this.props.history.push("/")
    })
    .catch((err) => {
      console.log("err:", err)

      Alert.error(err.message, {
        position: 'top-right',
        effect: 'slide',
        timeout: 5000
      });
    })
  }

  render(){

    return(
      <div className="container" style={{marginTop: 60,}}>

        <Row style={{ marginTop:40 }}>
          <Col md="5" xs="12" />
          <Col md="2" xs="12" style={{textAlign: 'center'}}>
            <img src={require('../images/hydra_logo_image_560.png')} style={{
                width: '100%',
              }} alt="hydra_logo" />
          </Col>
          <Col md="5" xs="12" />
        </Row>

        <Row style={{}}>
          <Col xs="12" style={{textAlign: 'center'}}>
            <span style={{
                fontSize: 24,
              }}>
              Proof-of-concept for
              <br/>
              Credit Hydra and Loancoin
            </span>
          </Col>
        </Row>

        <Row style={{marginTop:40}}>
          <Col xs="12" style={{textAlign: 'center'}}>
            <Button
              onClick={this.clicked}
              color="primary">Login with uPort</Button>
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

  return {
    userProfile: user.profile,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    updateUser: (data) => dispatch(userLoginAction({ params: data})),
  }
}

export default withRouter(connect( mapStateToProps, mapDispatchToProps )(GetStarted))
