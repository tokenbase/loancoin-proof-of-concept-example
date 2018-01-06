pragma solidity ^0.4.18;

// Loan Contract
contract LoancoinContract {

  // collateral for each loan contract (ipfs hash)
  mapping (address => mapping (string => uint256)) private collaterals;

  // loan contract template
  // save only signature and states. detail can be found on ipfs file
  struct LoanContract {
      address lender;
      address borrower;
      string lender_sig;
      string borrower_sig;
      uint256 deadline; // -> deadline, 1513056825
      uint8 status;
      uint256 balance; // -> updated each month
      uint256 balanceUpdatedAt; // > to prevent double increase
  }

  // access to loan contract by mapping
  mapping (string => LoanContract) private loanContracts;

  // creater address
  address public oracleAddress;
  address public loancoinAddress;

  // Modifiers
  modifier onlyOracle {
    if (msg.sender != oracleAddress) revert();
    _;
  }

  // Modifiers
  modifier onlyOracleOrLoancoin {
    if (msg.sender != loancoinAddress && msg.sender != oracleAddress) revert();
    _;
  }

  // Constructor
  function LoancoinContract() public {
    oracleAddress = msg.sender;
  }

  // creat new laoncoin contract
  function cerateLoanContract (
      string _ipfsHash,
      address _lender,
      address _borrower,
      uint256 _deadline
      ) public returns (bool success) {

      loanContracts[_ipfsHash] = LoanContract(
          _lender,
          _borrower,
          "",
          "",
          _deadline,
          0,
          0,
          0);

      return true;
  }

  // transfer Oracle
  function transferOracle(address _newOracle) public onlyOracle returns (bool success) {
    oracleAddress = _newOracle;
    return true;
  }

  // update loancoin address
  function updateLoancoinAddress(address _address) public onlyOracle returns (bool success) {
    loancoinAddress = _address;
    return true;
  }

  // return loan coin status with ipfs hash
  function loancontractOf(string _ipfsHash) constant public returns (
      address lender,
      address borrower,
      string lender_sig,
      string borrower_sig,
      uint256 deadline,
      uint8 status,
      uint256 balance
      ) {

      LoanContract storage lc = loanContracts[_ipfsHash];

      return ( lc.lender, lc.borrower, lc.lender_sig, lc.borrower_sig, lc.deadline, lc.status, lc.balance );
  }

  // balance of
  function loancontractBalanceOf(string _ipfsHash) constant public returns (uint256 balance) {
      LoanContract storage lc = loanContracts[_ipfsHash];
      return ( lc.balance );
  }

  // set lenders signature
  function setLenderSig (
      string _ipfsHash,
      string _lender_sig,
      address _token_addr,
      string _loanHash
      ) onlyOracle public returns (bool success) {

      LoanContract storage lc = loanContracts[_ipfsHash];

      if (lc.status != 0) revert();

      lc.lender_sig = _lender_sig;

      if ( bytes(lc.lender_sig).length != 0  && bytes(lc.borrower_sig).length != 0 && lc.status == 0 ) {

          // if there is no collateral, then revert
          uint256 _value = collateralOf(lc.lender, _loanHash);
          if ( _value == 0 ) revert();

          // we do not have collateral any more
          deleteCollateralOf(lc.lender, _loanHash);

          // allow
          LoancoinToken(_token_addr).approveCollateralWithdrawal(
              lc.borrower,
              this,
              _value);

          lc.status = 1;
      }

      return true;
  }

  // set borrowers signature
  // set lenders signature
  function setBorrowerSig (
      string _ipfsHash,
      string _borrower_sig,
      address _token_addr,
      string _loanHash
      ) onlyOracle public returns (bool success) {

      LoanContract storage lc = loanContracts[_ipfsHash];

      if (lc.status != 0) revert();

      lc.borrower_sig = _borrower_sig;

      if ( bytes(lc.lender_sig).length != 0  && bytes(lc.borrower_sig).length != 0 && lc.status == 0 ) {

          // if there is no collateral, then revert
          uint256 _value = collateralOf(lc.lender, _loanHash);
          if ( _value == 0 ) revert();

          // we do not have collateral any more
          deleteCollateralOf(lc.lender, _loanHash);

          // allow
          LoancoinToken(_token_addr).approveCollateralWithdrawal(
              lc.borrower,
              this,
              _value);

           lc.status = 1;
      }

      return true;
  }

  // loacoin contract < only oracle should be able to update
  // 0: initialized, 1: signed, 2: withdrawed, 3: active, 4: completed, 5: default
  function updateLoanState(
    string _ipfsHash,
    uint8 _status,
    uint256 _value
    ) onlyOracleOrLoancoin public returns (bool success) {

      LoanContract storage lc = loanContracts[_ipfsHash];

      if ( now < lc.balanceUpdatedAt + 3600  ) revert();
      if ( now > lc.deadline && _status < 5 ) revert();

      if (lc.status == 4) revert();
      if (lc.status == 5) revert();

      lc.status = _status;
      lc.balance = _value;

      return true;
  }

  // retrieve collateral of address and loan hash
  function collateralOf(address _address, string _loanHash) constant public returns (uint256 remaining) {
    return collaterals[_address][_loanHash];
  }

  // delete collateral of  address and loan hash
  function deleteCollateralOf(address _address, string _loanHash) onlyOracleOrLoancoin public returns (bool success) {
    delete collaterals[_address][_loanHash];
    return true;
  }

  // fallback for loancoin
  function setCollateral(
    address _address,
    uint256 _value,
    string _loanHash
    ) onlyOracleOrLoancoin public  returns (bool success) {

    if ( collaterals[_address][_loanHash] != 0 ) revert();

    // set as collateral
    collaterals[_address][_loanHash] = _value;

    return true;
  }

  // fallback for loancoin
  function tokenFallback(address _address, uint256 _value, bytes _data) public {
  }

  // kill contract itself
  function kill() onlyOracle public {
      selfdestruct(oracleAddress);
  }

  // fallback for ether
  function() payable public {
    revert();
  }
}

contract LoancoinToken {

  /*mapping (address => mapping (string => uint256)) private collaterals;*/

  // ERC20 State
  mapping (address => uint256) public balances;
  mapping (address => mapping (address => uint256)) public allowances;
  uint256 public totalSupply;

  // Human State
  string public name;
  uint8 public decimals;
  string public symbol;
  string public version;

  // Minter State
  address public centralMinter;

  // Laoncoin Contract address
  address public loanContractAddress;

  // Backed By Ether State
  uint256 public buyPrice;
  uint256 public sellPrice;

  // Modifiers
  modifier onlyMinter {
    if (msg.sender != centralMinter) revert();
    _;
  }

  // Modifiers
  modifier onlyMinterOrLoanContract {
    if (msg.sender != loanContractAddress && msg.sender != centralMinter) revert();
    _;
  }

  // update loancoin address
  function updateLoanContractAddress(address _address) public onlyMinter returns (bool success) {
    loanContractAddress = _address;
    return true;
  }

  // ERC20 Events
  event Transfer(address indexed _from, address indexed _to, uint256 _value, bytes _data);
  event Approval(address indexed _owner, address indexed _spender, uint256 _value);

  // Constructor
  function LoancoinToken(uint256 _initialAmount) public {
    balances[msg.sender] = _initialAmount;
    totalSupply = _initialAmount;
    name = "Loancoin";
    decimals = 18;
    symbol = "LNC";
    version = "0.1";
    centralMinter = msg.sender;
    buyPrice = 100000000000000;
    sellPrice = 99000000000000;
  }

  function isContract(address _address) private view returns (bool is_contract) {
      uint length;
      assembly {
          length := extcodesize(_address)
      }
      if (length > 0) {
          return true;
      } else {
          return false;
      }
  }

  // ERC20 Methods
  function balanceOf(address _address) constant public returns (uint256 balance) {
    return balances[_address];
  }

  function allowance(address _owner, address _spender) constant public returns (uint256 remaining) {
    return allowances[_owner][_spender];
  }

  // ERC 20
  function transfer(address _to, uint256 _value) public returns (bool success) {
    return transfer(_to, _value, "");
  }

  // ERC 223
  function transfer(address _to, uint256 _value, bytes _data) public returns (bool success) {

    if (isContract(_to)) {

      if(balances[msg.sender] < _value) revert();
      if(balances[_to] + _value < balances[_to]) revert();
      balances[msg.sender] -= _value;
      balances[_to] += _value;

      LoancoinContract receiver = LoancoinContract(_to);
      receiver.tokenFallback(msg.sender, _value, _data);

      Transfer(msg.sender, _to, _value, _data);
      return true;
    } else {
      // nomal address
      if(balances[msg.sender] < _value) revert();
      if(balances[_to] + _value < balances[_to]) revert();
      balances[msg.sender] -= _value;
      balances[_to] += _value;
      Transfer(msg.sender, _to, _value, "");
      return true;
    }
  }

  function payback(
    address _lender,
    address _loanContract_addr,
    uint256 _value,
    string _ipfsHash
    ) public returns (bool success) {

    // update loan contract status
    uint256 loan_balance = LoancoinContract(_loanContract_addr).loancontractBalanceOf(_ipfsHash);
    if ( loan_balance == 0 ) revert();

    // if dealline passed..

    uint256 difference = _value;
    if ( _value >= loan_balance ) {
      difference = _value - loan_balance;
      LoancoinContract(_loanContract_addr).updateLoanState(_ipfsHash, 4, 0);
    } else {
      LoancoinContract(_loanContract_addr).updateLoanState(_ipfsHash, 3, loan_balance - difference);
    }

    // transfer token
    transfer(_lender, difference, "payback");
  }

  function approve(address _spender, uint256 _value) public returns (bool success) {
    allowances[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
    return true;
  }

  function cancelCollateral(
      string _loanHash,
      address _loan_address
      ) public returns (bool success) {

    // if msg.sender has enough token on collaterals,
    // then, msg.sender can give permission to withdrow token from contract

    // if there is no collateral, then revert
    uint256 _value = LoancoinContract(_loan_address).collateralOf(msg.sender, _loanHash);
    if ( _value == 0 ) revert();

    // update allowance
    allowances[_loan_address][msg.sender] = _value;

    // we do not have collateral any more
    LoancoinContract(_loan_address).deleteCollateralOf(msg.sender, _loanHash);

    Approval(_loan_address, msg.sender, _value);

    return true;
  }

  function approveCollateralWithdrawal  (
      address _spender,
      address _loanContract_addr,
      uint256 _value
      ) onlyMinterOrLoanContract public returns (bool success) {
    // update allowance
    allowances[_loanContract_addr][_spender] = _value;

    Approval(_loanContract_addr, _spender, _value);

    return true;
  }

  function moveTokenAsCollateral(uint256 _value, string _loanHash, bytes _data, address _loan_address) public returns (bool success) {

    // if the _loanhash has collateral, revert
    uint256 collateral_value = LoancoinContract(_loan_address).collateralOf(msg.sender, _loanHash);
    if ( collateral_value != 0 ) revert();

    // transfer token
    transfer(_loan_address, _value, _data);

    // set as collateral
    LoancoinContract(_loan_address).setCollateral(msg.sender, _value, _loanHash);

    return true;
  }

  function transferFrom(address _owner, address _to, uint256 _value) public returns (bool success) {
    if(balances[_owner] < _value) revert();
    if(balances[_to] + _value < balances[_to]) revert();
    if(allowances[_owner][msg.sender] < _value) revert();
    balances[_owner] -= _value;
    balances[_to] += _value;
    allowances[_owner][msg.sender] -= _value;

    Transfer(_owner, _to, _value, "transferFrom");
    return true;
  }

  function withdrawTokenFromContract (
    address _owner,
    address _to,
    uint256 _value,
    string _ipfsHash,
    uint256 _balance
    ) public returns (bool success) {

    // update status
    LoancoinContract(_owner).updateLoanState(_ipfsHash, 2, _balance);

    // transfer money
    transferFrom(_owner, _to, _value);

    return true;
  }

  // Minter Functions
  function mint(uint256 _amountToMint) public onlyMinter {
    balances[centralMinter] += _amountToMint;
    totalSupply += _amountToMint;
    Transfer(this, centralMinter, _amountToMint, "mint");
  }

  function transferMinter(address _newMinter) public onlyMinter {
    centralMinter = _newMinter;
  }

  // Backed By Ether Methods
  // Must create the contract so that it has enough Ether to buy back ALL tokens on the market, or else the contract will be insolvent and users won't be able to sell their tokens
  function setPrices(uint256 _newSellPrice, uint256 _newBuyPrice) public onlyMinter {
    sellPrice = _newSellPrice;
    buyPrice = _newBuyPrice;
  }

  function buy() payable public returns (uint amount) {
    amount = msg.value / buyPrice;
    if(balances[centralMinter] < amount) revert();            // Validate there are enough tokens minted
    balances[centralMinter] -= amount;
    balances[msg.sender] += amount;
    Transfer(centralMinter, msg.sender, amount, "buy");
    return amount;
  }

  function sell(uint _amount) public returns (uint revenue) {
    if (balances[msg.sender] < _amount) revert();            // Validate sender has enough tokens to sell
    balances[centralMinter] += _amount;
    balances[msg.sender] -= _amount;
    revenue = _amount * sellPrice;
    if (!msg.sender.send(revenue)) {
      revert();
    } else {
      Transfer(msg.sender, centralMinter, _amount, "sell");
      return revenue;
    }
  }

  // kill contract itself
  function kill() onlyMinter public {
      selfdestruct(centralMinter);
  }

  // fallback for ether
  function() payable public {
    revert();
  }
}
