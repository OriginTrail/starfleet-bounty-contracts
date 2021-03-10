pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

abstract contract IERC677 is IERC20 {
    function transferAndCall(address to, uint value, bytes memory data) public virtual returns (bool success);

    event Transfer(address indexed from, address indexed to, uint value, bytes data);
}