
# Smart Contract Documentation


## [Token.psol:Token](../contracts/Token.psol)
`Solidity version 0.4.24+commit.e67f0147`
A minimal token contract

 ##### function name `0x06fdde03` 
 constant view 


___
 ##### function decimals `0x313ce567` 
 constant view 


___
 ##### function forceTransfer `0x33bebb77` 
  nonpayable 
Force transfers tokens from any account to another. Only compiled in &#x27;dev&#x27; network

 Type | Name |
--- | --- |
| address | _from |
| address | _to |
| uint256 | _value |
___
 ##### function _balances `0x6ebcf607` 
 constant view 


 Type | Name |
--- | --- |
| address |  |
___
 ##### function balanceOf `0x70a08231` by Nour Haridy
 constant view 
Checks balance of address

 Type | Name |
--- | --- |
| address | _owner |
___
 ##### function symbol `0x95d89b41` 
 constant view 


___
 ##### function transfer `0xa9059cbb` 
  nonpayable 
Transfer token for a specified addresses

 Type | Name |
--- | --- |
| address | _to |
| uint256 | _value |
___
 ##### constructor  `constructor` 
  nonpayable 


___
 ##### event Transfer `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef` 
   


 Type | Name |
--- | --- |
| address | _from |
| address | _to |
| uint256 | _value |
___

---