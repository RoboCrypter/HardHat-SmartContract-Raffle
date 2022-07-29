const { ethers } = require("hardhat")

const networkConfig = {

    4: {
        name: "rinkeby",
        vrfCoordinatorV2MockAddress: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        entryFee: ethers.utils.parseEther("0.01"),
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        subscriptionId: "9502",
        callbackGasLimit: "500000",
        timeInterval: "30"
    },

    31337: {
        name: "hardhat",
     // There will be no vrfCoordinatorAddress because we will deploy mocks for that. 
        entryFee: ethers.utils.parseEther("0.01"),
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // It doesn't really matter, if we put gasLane in Hardhat or not, you can literally put anything here.
        callbackGasLimit: "500000",
        timeInterval: "30"
    }
}


const devNetworks = ["hardhat", "localhost"]


module.exports = {
    networkConfig,
    devNetworks
}