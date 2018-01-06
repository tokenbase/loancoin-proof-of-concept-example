import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'

class NoMatch extends Component {

  render() {

    return(
      <div className='nomach'>
        <span>NoMatch</span>
      </div>
    )
  }
}

export default withRouter( connect()(NoMatch) )
