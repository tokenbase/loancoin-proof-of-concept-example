import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import {
  Nav,
  NavItem,
  NavLink,
 } from 'reactstrap';

class Header extends Component {

  home_clicked = () => {
    this.props.history.push("/")
  }

  oracle_example_clicked = () => {
    this.props.history.push("/oracle_example")
  }

  lnc_converter_clicked = () => {
    this.props.history.push("/lnc_converter")
  }

  lend_top_clicked = () => {
    this.props.history.push("/lend_top")
  }

  borrow_top_clicked = () => {
    this.props.history.push("/borrow_top")
  }

  render(){

    const { location, current_address } = this.props


    if ( !current_address ){
      return (
        <Nav>
          <NavItem>
            <NavLink
              onClick={this.home_clicked}
              style={{
                color: location.pathname === '/' ? '#000000' : '#cccccc',
                cursor: 'pointer',
            }}>Account</NavLink>
          </NavItem>
        </Nav>
      )
    }

    return(
      <Nav>
        <NavItem>
          <NavLink
            onClick={this.home_clicked}
            style={{
              color: location.pathname === '/' ? '#000000' : '#cccccc',
              cursor: 'pointer',
          }}>Account</NavLink>
        </NavItem>

        <NavItem>
          <NavLink
            onClick={this.lnc_converter_clicked}
            style={{
              color: location.pathname === '/lnc_converter' ? '#000000' : '#cccccc',
              cursor: 'pointer',
          }}>Converter</NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            onClick={this.lend_top_clicked}
            style={{
              color: location.pathname === '/lend_top' ? '#000000' : '#cccccc',
              cursor: 'pointer',
          }}>Lend</NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            onClick={this.borrow_top_clicked}
            style={{
              color: location.pathname === '/borrow_top' ? '#000000' : '#cccccc',
              cursor: 'pointer',
          }}>Borrow</NavLink>
        </NavItem>

        <NavItem>
          <NavLink
            onClick={this.oracle_example_clicked}
            style={{
              color: location.pathname === '/oracle_example' ? '#000000' : '#cccccc',
              cursor: 'pointer',
          }}>Upload documents</NavLink>
        </NavItem>
      </Nav>
    )
  }
}

function mapStateToProps ({ user }) {

  let current_address = null;
  if (user && user.current_address) {
    current_address = user.current_address;
  }

  return {
    current_address: current_address,
  }
}

export default withRouter(connect(mapStateToProps)(Header))
