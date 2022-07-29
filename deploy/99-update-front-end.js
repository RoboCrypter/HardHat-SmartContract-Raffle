const { ethers, network } = require("hardhat")
const fs = require("fs")


const FRONT_END_ADDRESSES_FILE = "../nextjs-smartcontract-raffle/constants/contractAddresses.json"
const FRONT_END_ABI_FILE = "../nextjs-smartcontract-raffle/constants/abi.json"


module.exports = async function () {

    if(process.env.UPDATE_FRONT_END) {

    //  Updating Front End......!

        updateContractAddresses()

        updateAbi()
    }
}


async function updateContractAddresses() {

    const raffle = await ethers.getContract("Raffle")

    const chainId = network.config.chainId.toString()
    
    const contractAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8"))

    if(chainId in contractAddresses) {

        if(!contractAddresses[chainId].includes(raffle.address)) {

            contractAddresses[chainId].push(raffle.address)
        }

    } else{

        contractAddresses[chainId] = [raffle.address]
    }

    fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(contractAddresses))
}


async function updateAbi() {

    const raffle = await ethers.getContract("Raffle")

    fs.writeFileSync(FRONT_END_ABI_FILE, raffle.interface.format(ethers.utils.FormatTypes.json))
}




module.exports.tags = ["all", "frontEnd"]