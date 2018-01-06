import crypto2 from 'crypto2';

// generate public and private keys
export const generateKeys = ({userId}) => {

  const hydra_storage_key = "CREDIT_HYDRA_"+userId;

  return new Promise((resolve, reject) => {
    crypto2.createKeyPair((err, privateKey, publicKey) => {
      if (err) {
        reject(err)
      }

      const keys = {
        privateKey: privateKey,
        publicKey: publicKey,
      }

      // save keys on local storage
      localStorage.setItem(hydra_storage_key, JSON.stringify(keys) )

      resolve(keys)
    });
  })

}

// get private key
export const getPrivateKey = ( { userId } ) => {

  const hydra_storage_key = "CREDIT_HYDRA_"+userId;
  const hydra_keys_str = localStorage.getItem(hydra_storage_key)
  if ( hydra_keys_str ) {
    const hydra_keys = JSON.parse(hydra_keys_str)
    return Promise.resolve(hydra_keys)
  }

  return generateKeys({userId})
}

// get public key
export const getPublicKey = ( { userId } ) => {

  const hydra_storage_key = "CREDIT_HYDRA_"+userId;
  const hydra_keys_str = localStorage.getItem(hydra_storage_key)
  if ( hydra_keys_str ) {
    const hydra_keys = JSON.parse(hydra_keys_str)
    return Promise.resolve(hydra_keys)
  }

  return generateKeys({userId})
}

// encrypt data with public key
export const encryptDataWithPublicKey = ({ userId, rawData, publicKey }) => {

  // get keys
  return new Promise((resolve, reject) => {
    crypto2.encrypt.rsa( rawData, publicKey, (err, encrypted) => {
      if (err){
        reject(err)
      }
      resolve(encrypted)
    });
  })
}

// decrypt data
export const decryptDataWithPrivateKey = ({ userId, encrypted }) => {

  // get keys
  return getPublicKey({userId})
  .then((results) => {
    const privateKey = results.privateKey

    return new Promise((resolve, reject) => {

      crypto2.decrypt.rsa(encrypted, privateKey, (err, decrypted) => {
        if (err){
          reject(err)
        }
        resolve(decrypted)
      });
    })

  })
}
