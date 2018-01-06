import { API_SERVER, API_KEY } from './Settings'

const headers = {
  'Accept': 'application/json',
  'Authorization': API_KEY
}

// get data test
export const getDataTest = (params) =>
  fetch(`${API_SERVER}/api/request_data_through_oracle`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( params )
  }).then(res => res.json())

// get data test
export const addLoanInitiation = (params) =>
  fetch(`${API_SERVER}/api/add_loan_initiation`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( params )
  }).then(res => res.json())


// retrieve loan list
// export const checkInitiatedLoans = (params) =>
export const getLoanList = (params) =>
  fetch(`${API_SERVER}/api/get_loan_list`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( params )
  }).then(res => res.json())

// give me 10 ether
export const giveMeEther = (params) =>
  fetch(`${API_SERVER}/api/give_me_ether`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( params )
  }).then(res => res.json())


// // _getLoansToApply
// export const getLoansToApply = (params) =>
//   fetch(`${API_SERVER}/api/get_loans_to_apply`, {
//     method: 'POST',
//     headers: {
//       ...headers,
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify( params )
//   }).then(res => res.json())


// _applyToLoan
export const applyToLoan = (params) =>
  fetch(`${API_SERVER}/api/apply_to_loan`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( params )
  }).then(res => res.json())

// _approveBorrower
export const approveBorrower = (params) =>
  fetch(`${API_SERVER}/api/approve_borrower`, {
  // fetch(`${API_SERVER}/api/test`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( params )
  }).then(res => res.json())


// delete loan contrct
export const deleteLoanContract = (params) =>
  fetch(`${API_SERVER}/api/delete_loan_contract`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( params )
  }).then(res => res.json())

// send signature
export const sendSignature = (params) =>
  fetch(`${API_SERVER}/api/send_signature`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( params )
  }).then(res => res.json())

// send uport profile
export const sendUportProfile = (params) =>
  fetch(`${API_SERVER}/api/send_uport_profile`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( params )
  }).then(res => res.json())

// get ipfs data from our server
export const getUportProfile = (params) =>
  fetch(`${API_SERVER}/api/get_uport_profile`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( params )
  }).then(res => res.json())
