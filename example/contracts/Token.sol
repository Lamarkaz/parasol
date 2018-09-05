pragma solidity ^0.4.24;

/// @title A very minimal token contract
contract Token {

    uint256 public totalSupply = 1*10**28;
    string public name = "Token";
    uint8 public decimals = 18;
    string public symbol = "TOK";
    mapping (address => uint256) balances;
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    constructor() public {
        balances[msg.sender] = totalSupply;
    }

    /// @author Nour Haridy
    /// @dev Transfers tokens
    /// @param _to The address of the transfer recipient
    /// @param _value The amount of tokens to be transferred
    /// @return true if tokens transferred successfully
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value);
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    /// @author Nour Haridy
    /// @dev Checks balance of address
    /// @param _owner The queried address
    /// @return balance of address
    function balanceOf(address _owner) constant public returns (uint256 balance) {
        return balances[_owner];
    }

}