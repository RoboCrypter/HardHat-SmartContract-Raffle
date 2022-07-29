const { ethers } = require("hardhat")



async function enteringRaffle() {

    const raffle = await ethers.getContract("Raffle")

    const entryFee = await raffle.getEntryAmount()

    const tx = await raffle.enterRaffle({value: entryFee + 1})

    await tx.wait(1)

    console.log("Entered In the Raffle......!")
}




enteringRaffle()
    .then(() => process.exit(0))
    .catch((error) => { 
        console.error(error)  
        process.exit(1)
    })
