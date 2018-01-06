import React, { Component } from 'react';
import '../App.css';
import { Route, Switch } from 'react-router-dom'
import Alert from 'react-s-alert';
import 'react-s-alert/dist/s-alert-default.css';
import 'react-s-alert/dist/s-alert-css-effects/slide.css';
import { connect } from 'react-redux'
import { withRouter } from 'react-router';
import Home from './Home'
import NoMatch from './NoMatch'
import GetStarted from './GetStarted'
import OracleExample from './OracleExample'
import LoancoinConverter from './LoancoinConverter'
import LendTop from './LendTop'
import BorrowTop from './BorrowTop'

class App extends Component {

  render() {

    const { user } = this.props

    if (!user.profile){
      return (

        <div className="App">

          <Switch>

            <Route exact path='/' render={() => (
              <GetStarted />
            )} />

            <Route exact path='/lab' render={() => (
              <GetStarted />
            )} />

            <Route exact path='/oracle_example' render={() => (
              <GetStarted />
            )} />

            <Route exact path='/notfound' component={NoMatch} />
            <Route component={NoMatch} />

          </Switch>

          <Alert stack={{limit: 3}} />

        </div>

      )
    }

    return (
      <div className="App">

        <Switch>

          <Route exact path='/' render={() => (
            <Home />
          )} />

          <Route exact path='/lnc_converter' render={() => (
            <LoancoinConverter />
          )} />


          <Route exact path='/oracle_example' render={() => (
            <OracleExample />
          )} />

          <Route exact path='/lend_top' render={() => (
            <LendTop />
          )} />


          <Route exact path='/borrow_top' render={() => (
            <BorrowTop />
          )} />

          <Route exact path='/notfound' component={NoMatch} />
          <Route component={NoMatch} />

        </Switch>

        <Alert stack={{limit: 3}} />

      </div>
    );
  }
}

function mapStateToProps ({ user }) {
  return {
    user: user,
  }
}

export default withRouter(connect( mapStateToProps, null )(App))
