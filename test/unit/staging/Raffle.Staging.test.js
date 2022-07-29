const { expect } = require("chai");
const { network, ethers, getNamedAccounts } = require("hardhat");
const { devNetworks } = require("../../../helper-hardhat-config");



devNetworks.includes(network.name) ? describe.skip

: describe("Staging Test on Contract Raffle", () => {


    let deployer
    let raffle
    let entryFee


    beforeEach("Deploying the Contract Raffle", async() => {

        deployer = (await getNamedAccounts()).deployer

        raffle = await ethers.getContract("Raffle", deployer)

        entryFee = await raffle.getEntryAmount()
    })

    describe("fulfillRandomWords", () => {

        it("It should interact with Chainklink Keepers and also Chainlink VRF, to get the random Winner", async() => {
            
            const startingTimeStamp = await raffle.getLastTimeStamp()

            const accounts = await ethers.getSigners()

            // Lets Enter the Raffle......
            console.log("Entering The Raffle......")

            const enterRaffle = await raffle.enterRaffle({value: entryFee})

            await enterRaffle.wait(1)

            console.log("Now, Lets wait a little bit......")

            // This will be our "deployer" account, Because we are the one entering in the Raffle.
            const startingWinnerBalance = await accounts[0].getBalance()

            console.log("Setting Up Our Listener......")
            // This is our: Listener, which is listening for an "Event":
            await new Promise(async(resolve, reject) => {

                raffle.once("RaffleWinnerPicked", async() => {

                    console.log("Found the Event: 'RaffleWinnerPicked'")

                try{
                    
                    const recentWinner = await raffle.getRecentWinner()

                    const raffleState = await raffle.getRaffleState()

                    const endingTimeStamp = await raffle.getLastTimeStamp()

                    const endingWinnerBalance = await accounts[0].getBalance()


                    expect(recentWinner.toString()).to.equal(accounts[0].address)    // Index "0" is the deployer's address, And we are the only one participating in the Raffle.

                    await expect(raffle.getParticipants(0)).to.be.reverted

                    expect(raffleState.toString()).to.equal("0")

                    expect(endingTimeStamp > startingTimeStamp)

                    expect(endingWinnerBalance.toString()).to.equal(startingWinnerBalance.add(entryFee).toString())


                    resolve()      // Try to resolve.

                } catch(error) {

                    reject(error) // Otherwise reject.
                }

                // This Test won't complete until our Listener is "Finished" Listening.

            })
         })
      })
   })     
})