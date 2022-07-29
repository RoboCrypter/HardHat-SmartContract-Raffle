const { network, ethers } = require("hardhat")
const { networkConfig, devNetworks } = require("../helper-hardhat-config")


const VRF_SUB_ID_FUND_AMOUNT = ethers.utils.parseEther("2")


module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId

    let vrfCoordinatorV2MockAddress
    let subscriptionId

    if(devNetworks.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2MockAddress = vrfCoordinatorV2Mock.address

        const txResponse = await vrfCoordinatorV2Mock.createSubscription() // "createSubscription()" function is from the contract "VRFCoordinatorV2Mock.sol".
        const txReciept = await txResponse.wait(1)
        subscriptionId = txReciept.events[0].args.subId // Our, createSubscription() function in contract "VRFCoordinatorV2Mock.sol"  has an "event". so, we are getting a "subId" from that event.

        // Now, We have to fund the subscriptionId "Manually", means we have to code it in our deploy script just for our "Development Networks", We are using Chainlink VRF front end for our test_Nets.

        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_ID_FUND_AMOUNT) // "fundSubscription()" function is from the contract "VRFCoordinatorV2Mock.sol".

    } else{
        vrfCoordinatorV2MockAddress = networkConfig[chainId]["vrfCoordinatorV2MockAddress"]
        // For our TestNet we will use an actual Chainlink VRF front end to fund the subscriptionId.
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const entryFee = networkConfig[chainId]["entryFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const timeInterval = networkConfig[chainId]["timeInterval"]

    await deploy("Raffle", {
        from: deployer,
        args: [
            vrfCoordinatorV2MockAddress,
            entryFee,
            gasLane,
            subscriptionId,
            callbackGasLimit,
            timeInterval,
        ],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })


   ///  For Verification =>  I did a manual verification by creating an "arguments.js" file and run the following command.

   // yarn hardhat verify --network rinkeby --constructor-args arguments.js < DEPLOYED_CONTRACT_ADDRESS >

    log("Raffle is Deployed.............!")

    log("----------------------------------------------------------------------")
}

module.exports.tags = ["all", "raffle"]
