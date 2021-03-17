pragma solidity 0.6.10;

import "./IERC677.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";

contract StarfleetBounty is Ownable {

    using SafeMath for uint256;
    IERC677 token;

    // TODO Determine fixed value for token contract
    address public constant TRAC_TOKEN_ADDRESS = 0x0000000000000000000000000000000000000000;


    // Official start time of the bounty period
    uint256 public constant BOUNTY_PERIOD_LENGTH = 90 days;
    uint256 public bounty_period_end;
    bool public withdrawals_enabled = false;

    // participant stakes
    mapping(address => uint256) public bounty;

    event TokenAddressSet(address indexed token_address);
    event BountyAdded(address indexed staker, uint256 amount);
    event BountyWithdrawn(address indexed staker, uint256 amount);
    event ContractCancelled();

    constructor(address token_address)  public {
        if (token_address!=address(0x0)){
            // for testing purposes
            token = IERC677(token_address);
            emit TokenAddressSet(token_address);
        }else{
            // default use TRAC
            token = IERC677(TRAC_TOKEN_ADDRESS);
            emit TokenAddressSet(TRAC_TOKEN_ADDRESS);
        }
    }

    function getTokenAddress() public view returns (address) {
        return address(token);
    }

    function enableWithdrawals() onlyOwner public {
        require(bounty_period_end == 0, "Cannot reenable withdrawals");
        withdrawals_enabled = true;
        bounty_period_end = now.add(BOUNTY_PERIOD_LENGTH);
    }

    function cancelWithdrawals() public onlyOwner {
        withdrawals_enabled = false;
        uint256 amount = token.balanceOf(address(this));

        bool transaction_result = token.transfer(msg.sender, amount);
        require(transaction_result, "Token transaction execution failed!");

        emit ContractCancelled();
    }

    function assignBounty(address[] memory contributors, uint256[] memory amounts, bool allowOverwriting) onlyOwner public {
        // make sure not to overwrite by accident
        if (!allowOverwriting){
            for (uint i = 0; i < contributors.length; i++) {
                if(bounty[contributors[i]]==0){
                    bounty[contributors[i]] = amounts[i];
                    emit BountyAdded(contributors[i], amounts[i]);
                }
            }
        } else {
            for (uint j = 0; j < contributors.length; j++) {
                bounty[contributors[j]] = amounts[j];
                emit BountyAdded(contributors[j], amounts[j]);
            }
        }
    }

    // Functional requirement FR2
    function withdrawTokens() public {
        require(withdrawals_enabled, "Withdrawals are disabled at this time!");

        uint256 amount = bounty[msg.sender];

        require(amount > 0, "Cannot withdraw if there are no tokens staked with this address");
        require(token.balanceOf(address(this)) >= amount, "Contract does not have enough tokens to execute withdrawal!");
        bounty[msg.sender] = 0;

        bool transaction_result = token.transfer(msg.sender, amount);
        require(transaction_result, "Token transaction execution failed!");
        emit BountyWithdrawn(msg.sender, amount);
    }
}
