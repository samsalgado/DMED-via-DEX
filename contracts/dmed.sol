// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../@openzeppelin/contracts/utils/math/SafeMath.sol";

contract DMED is ERC20 {
    using SafeMath for uint256;
    constructor () ERC20("DecentMed", "DMED", 18, 10000000000000) {
        _mint(msg.sender, 1000);
    }
    function isContract(address account) internal view returns(bool) {
        uint256 size;
            // solhint-disable-next-line no-inline-assembly
            assembly { size := extcodesize(account) }
            return size > 0;
    }
}
