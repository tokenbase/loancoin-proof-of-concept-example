// uPort
import { uport_clientId, uport_SimpleSigner } from './Settings'
import { Connect, SimpleSigner, MNID } from 'uport-connect'

// connect
const uport = new Connect('Ko\'s new app', {
  clientId: uport_clientId,
  // network: 'rinkeby or ropsten or kovan',
  signer: SimpleSigner(uport_SimpleSigner)
})

// const web3 = uport.getWeb3()
export { uport, MNID }
