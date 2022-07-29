/** 
* We have to make a function for entering the raffle.
* We have to set a min entry amount.
* We have to make a constructor for all our variables.
* We have to make an address array for participants, which have to be payable, because if they win we have to pay them the bounty.
* We have to make a function to pick a random winner.
*/ 

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

/* Imports */
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
/* Errors */
error Less_Than_Entry_Amount();
error Raffle_NOT_OPEN();
error Transfer_Failed();
error Upkeep_NOT_NEEDED(uint256 currentBalance, uint256 numberOfParticipants, uint256 raffleState);

/**
*@title  A fully Decentralized Raffle.
*@author ABossOfMyself.
*@notice A sample Smart Contract Raffle.
*@dev   This contract implements Chainlink - VRF Version 2.
 */

/* Contract */
contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {

/* Type Declarations */
    enum RaffleState{ OPEN, CALCULATING }

/* Lottery Variables */
    uint256 private immutable i_entryFee;
    address payable[] private s_participants;
    address private s_recentWinner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_timeInterval;

/* Chainlink VRF Variables */
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQEST_CONFIRMATION = 3;
    uint32 private constant NUM_WORDS = 1;


/* Events */
    event RaffleEnter(address indexed participants);
    event RaffleWinner(uint256 indexed requestId);
    event RaffleWinnerPicked(address indexed winner);

/* Functions */
    constructor(
        address vrfCoordinatorV2,
        uint256 entryFee, 
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 timeInterval
    )   VRFConsumerBaseV2 (vrfCoordinatorV2) {

        i_entryFee = entryFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_timeInterval = timeInterval;
    }

    function enterRaffle() public payable {
        if(msg.value < i_entryFee) revert Less_Than_Entry_Amount();

        if(s_raffleState != RaffleState.OPEN) revert Raffle_NOT_OPEN();

        s_participants.push(payable(msg.sender));

        emit RaffleEnter(msg.sender);
    }

    /**
     * @dev This is the function that the Chainlink Keeper nodes call, They look for `upkeepNeeded` to return True.

     * The following should be true for this to return true:

     * 1. The Raffle is Open Or Not.
     * 2. The Time interval of Raffle has passed between Raffle runs or Not.
     * 3. The Raffle has participants or Not.
     * 4. The Contract has balance in ETH, paid by participants to enter in the Raffle or Not.

     *  Implicitly, Your subscription is funded with LINK.
     */

    function checkUpkeep(bytes memory /* checkData */) public override returns(bool upkeepNeeded, bytes memory /* performData */) {

        bool isRaffleOpen = (s_raffleState == RaffleState.OPEN);
        bool hasRaffleTimePassed = ((block.timestamp - s_lastTimeStamp) > i_timeInterval);
        bool hasParticipants = (s_participants.length > 0);
        bool hasBalance = (address(this).balance > 0);
        
        upkeepNeeded = (isRaffleOpen && hasRaffleTimePassed && hasParticipants && hasBalance);

        return(upkeepNeeded, "0x00");
    }

    /**
     * @dev If `checkUpkeep` returned `true`.

     *  `performUpkeep` is called and it kicks off a Chainlink VRF call to get a random winner.
     */

    function performUpkeep(bytes calldata /* performData */) external override {

        (bool upkeepNeeded, /*bytes memory performData */) = checkUpkeep("");
        
        if(!upkeepNeeded) revert Upkeep_NOT_NEEDED(address(this).balance, s_participants.length, uint256(s_raffleState));

        s_raffleState = RaffleState.CALCULATING;

        uint256 requestId = i_vrfCoordinator.requestRandomWords(
        i_gasLane,
        i_subscriptionId,
        REQEST_CONFIRMATION,
        i_callbackGasLimit,
        NUM_WORDS
    );
        emit RaffleWinner(requestId);
    }

    /**
     * @dev This is the function that Chainlink VRF node calls to send the money to the random winner.
     */

    function fulfillRandomWords(uint256 /* requestId */, uint256[] memory randomWords) internal override {

        uint256 indexOfWinner = randomWords[0] % s_participants.length;
        address payable recentWinner = s_participants[indexOfWinner];

        s_recentWinner = recentWinner;

        s_participants = new address payable [](0);  // This will reset s_participants array.
        s_lastTimeStamp = block.timestamp;           // This will reset timestamp.

        s_raffleState = RaffleState.OPEN;

        (bool success,) = payable(recentWinner).call{value: address(this).balance}("");
        if(!success) revert Transfer_Failed();

        emit RaffleWinnerPicked(recentWinner);
    }




    /* View/Pure  Funtions  */

    function getEntryAmount() public view returns (uint256) {
        return i_entryFee;
    }

    function getParticipants(uint256 index) public view returns (address) {
        return s_participants[index];
    }

    function getNumberOfParticipants() public view returns(uint256) {
        return s_participants.length;
    }

    function getRecentWinner() public view returns(address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns(RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns(uint256) {
        return NUM_WORDS;
    }

    function getRequestConfirmation() public pure returns(uint256) {
        return REQEST_CONFIRMATION;
    }

    function getLastTimeStamp() public view returns(uint256) {
        return s_lastTimeStamp;
    }

    function getTimeInterval() public view returns(uint256) {
        return i_timeInterval;
    }
}
