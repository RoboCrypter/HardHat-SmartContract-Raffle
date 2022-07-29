const { network, ethers } = require("hardhat")
const { devNetworks } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") // This is premium of using "ChainLink Node", and the gas it will take is "0.25" LINK tokens.
const GAS_PRICE_LINK = 1e9 // It is the calculated value based on the price of gas on the chain, So price of requests change based on the price of gas.

module.exports = async ({getNamedAccounts, deployments}) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if(devNetworks.includes(network.name)) {
        log("Dev_Networks_Detected,  Deploying Mocks.......")

        await deploy("VRFCoordinatorV2Mock", {
            
            from: deployer,
            args:[BASE_FEE, GAS_PRICE_LINK],
            log: true
        })

        log("Mocks Deployed.............!")
    }

    log("----------------------------------------------------------------------")
}

module.exports.tags = ["all", "mocks"]