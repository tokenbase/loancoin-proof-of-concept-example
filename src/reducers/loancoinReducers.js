import {
  USER_LOGIN,
  SET_KEYSTORE,
  SET_WEB3,
  UPDATE_ETH_BALANCE,
  UPDATE_LOADING,
  SWITCH_ADDRESS,
  SET_PASSWORD,
  UPDATE_LCN_BALANCE,
} from '../actions/LoancoinActions'

function user (state = {}, action) {

  const { params } = action

  switch (action.type) {

    case USER_LOGIN :

      return {
        ...state,
        profile: params.profile,
      }

    case SET_KEYSTORE :

      return {
        ...state,
        wallet: params.wallet,
      }

    case SET_WEB3 :

      return {
        ...state,
        web3: params.web3,
      }

    case UPDATE_ETH_BALANCE :

      return {
        ...state,
        eth_balance: params.eth_balance,
      }

    case UPDATE_LOADING :

      return {
        ...state,
        loading: params.loading,
      }

    case SWITCH_ADDRESS :

      return {
        ...state,
        current_address: params.current_address,
      }

    case SET_PASSWORD :

      return {
        ...state,
        account_password: params.account_password,
      }

    case UPDATE_LCN_BALANCE :

      return {
        ...state,
        lnc_balances: params.lnc_balances,
      }

    default :
      return state
  }
}


export default user
