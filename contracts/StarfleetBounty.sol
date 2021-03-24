pragma solidity 0.6.10;

import "./IERC677.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";

contract StarfleetBounty is Ownable {

    using SafeMath for uint256;
    IERC677 token;

    address public constant TRAC_TOKEN_ADDRESS = 0x18F75411914f45665f352908F1D3D11f0Eb01f2A;

    // Official start time of the bounty period
    uint256 public constant BOUNTY_PERIOD_LENGTH = 90 days;
    uint256 public bounty_period_end;
    bool public withdrawals_enabled = false;

    // participant stakes
    mapping(address => uint256) public bounty;
    mapping(address => bool) public bountyClaimed;

    event TokenAddressSet(address indexed token_address);
    event BountyAdded(address indexed staker, uint256 amount);
    event BountyWithdrawn(address indexed staker, uint256 amount);
    event MisplacedEtherWithdrawn(address indexed custodian);
    event ContractCancelled();

    constructor(address token_address)  public {
        if (token_address!=address(0x0)){
            // for testing purposes
            token = IERC677(token_address);
            emit TokenAddressSet(token_address);
        } else {
            // default use TRAC
            token = IERC677(TRAC_TOKEN_ADDRESS);
            emit TokenAddressSet(TRAC_TOKEN_ADDRESS);
        }
    }

    // Override Ownable renounceOwnership function
    function renounceOwnership() public override onlyOwner {
        require(false, "Cannot renounce ownership of contract");
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

        if (amount > 0) {
            bool transaction_result = token.transfer(msg.sender, amount);
            require(transaction_result, "Token transaction execution failed!");
        }

        emit ContractCancelled();
    }

    function assignBounty(address[] memory contributors, uint256[] memory amounts, bool allowOverwriting) onlyOwner public {
        require(contributors.length == amounts.length, "Wrong input - contributors and amounts have different length");

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

    function getContributorBounty(address contributor) public view returns (uint256){
        return bounty[contributor];
    }

    function wasBountyClaimed(address contributor) public view returns (bool) {
        return bountyClaimed[contributor];
    }

    // Functional requirement FR2
    function withdrawTokens() public {
        require(now <= bounty_period_end, "Bounty period has closed, cannot withdraw tokens anymore!");
        require(withdrawals_enabled, "Withdrawals are disabled at this time!");

        uint256 amount = bounty[msg.sender];
        bounty[msg.sender] = 0;
        bountyClaimed[msg.sender] = true;
        require(amount > 0, "Cannot withdraw if there are no tokens staked with this address");
        require(token.balanceOf(address(this)) >= amount, "Contract does not have enough tokens to execute withdrawal!");

        bool transaction_result = token.transfer(msg.sender, amount);
        require(transaction_result, "Token transaction execution failed!");
        emit BountyWithdrawn(msg.sender, amount);
    }

    function withdrawRemainingTokens(address tokenAddress) onlyOwner public {
        require(now > bounty_period_end, "Cannot withdraw before the bounty period ends");
        IERC677 requestedToken = IERC677(tokenAddress);

        uint256 amount = requestedToken.balanceOf(address(this));
        if (amount > 0) {
            bool transaction_result = requestedToken.transfer(msg.sender, amount);
            require(transaction_result, "Token transaction execution failed!");
        }
    }

    function withdrawMisplacedEther() onlyOwner public {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = msg.sender.call.value(balance)("");
            require(success, "Transfer failed.");
        }

        emit MisplacedEtherWithdrawn(msg.sender);
    }
}
