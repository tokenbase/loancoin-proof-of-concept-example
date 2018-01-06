export const USER_LOGIN = 'USER_LOGIN'
export const SET_KEYSTORE = 'SET_KEYSTORE'
export const SET_WEB3 = 'SET_WEB3'
export const UPDATE_ETH_BALANCE = 'UPDATE_ETH_BALANCE'
export const UPDATE_LOADING = 'UPDATE_LOADING'
export const SWITCH_ADDRESS = 'SWITCH_ADDRESS'
export const SET_PASSWORD = 'SET_PASSWORD'
export const UPDATE_LCN_BALANCE = 'UPDATE_LCN_BALANCE'

export function userLoginAction ( { params }) {
  return {
    type: USER_LOGIN,
    params
  }
}

export function setKeystoreAction ( { params }) {
  return {
    type: SET_KEYSTORE,
    params
  }
}

export function setWeb3Action ( { params }) {
  return {
    type: SET_WEB3,
    params
  }
}

export function updateEthBalanceAction ( { params }) {
  return {
    type: UPDATE_ETH_BALANCE,
    params
  }
}

export function updateLoadingStatus ( { params }) {
  return {
    type: UPDATE_LOADING,
    params
  }
}

export function switchAddress ( { params }) {
  return {
    type: SWITCH_ADDRESS,
    params
  }
}

export function setPassword ( { params }) {
  return {
    type: SET_PASSWORD,
    params
  }
}

export function updateLoancoinBalance ( { params }) {
  return {
    type: UPDATE_LCN_BALANCE,
    params
  }
}
