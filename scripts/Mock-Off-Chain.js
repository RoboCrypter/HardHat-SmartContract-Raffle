const { ethers } = require("hardhat");
const { devNetworks } = require("../helper-hardhat-config")



async function mockChainlinkKeepers() {

    const raffle = await ethers.getContract("Raffle")

    const checkData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(""))

    const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(checkData)

    if(upkeepNeeded) {

        const tx = await raffle.performUpkeep(checkData)
        
        const txReciept = await tx.wait(1)

        const requestId = await txReciept.events[1].args.requestId

        console.log(`Performed Upkeep with Request Id : ${requestId}`)

        if(devNetworks) {

            await mockChainlinkVRF(requestId, raffle)

        } else{

            console.log("Upkeep Not Needed...!")
        }
    }
}


async function mockChainlinkVRF(requestId, raffle) {

    console.log("lets pretend...! We are on a Local Network")

    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")

    await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, raffle.address)

    console.log("Responded...!")

    const recentWinner = await raffle.getRecentWinner()

    console.log(`The Winner is : ${recentWinner}`)
}



mockChainlinkKeepers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })