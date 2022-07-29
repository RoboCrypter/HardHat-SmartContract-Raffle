const { network, getNamedAccounts, ethers, deployments } = require("hardhat")
const { devNetworks, networkConfig } = require("../../helper-hardhat-config")
const { expect } = require("chai")



!devNetworks.includes(network.name) ? describe.skip

    : describe("Unit Testing Raffle Contract", () => {

          let deployer
          let raffle
          let vrfCoordinatorV2Mock
          let timeInterval
          const chainId = network.config.chainId

          const entryFee = ethers.utils.parseEther("0.01")

          beforeEach("Deploying Raffle Contract", async () => {
              deployer = (await getNamedAccounts()).deployer
              
              await deployments.fixture(["all"])

              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              timeInterval = await raffle.getTimeInterval()
          })

          describe("constructor", () => {

            it("It initializes the Raffle", async() => {

               const raffleState = await raffle.getRaffleState()

               expect(raffleState.toString()).to.equal("0")

               expect(timeInterval.toString()).to.equal(networkConfig[chainId]["timeInterval"])
            })

            it("It check to see if Participants have paid enough", async() => {

                await expect(raffle.enterRaffle()).to.be.revertedWith("Less_Than_Entry_Amount")
            })

            it("It check to see if Participants are adding in a s_participants array", async() => {

                await raffle.enterRaffle({value: entryFee})

                const getParticipants = await raffle.getParticipants(0)

                expect(getParticipants.toString()).to.equal(deployer)
            })

            it("It emits an event upon Entering Raffle", async() => {

                await expect(raffle.enterRaffle({value: entryFee})).to.emit(raffle, "RaffleEnter")
            })

            it("It does not let participants get in the Raffle, When it is in Calculating State", async() => {
                
                await raffle.enterRaffle({value: entryFee})
                // lets use "evm_increaseTime" for increasing the timeInterval, for our test so we don't have to wait very long.
                await network.provider.send("evm_increaseTime", [timeInterval.toNumber() + 1])
                // lets now, mine the block, you have to increase the time and also mine the block to move forward.
                await network.provider.send("evm_mine", [])

                // Now, We pretend to be a Chainlink Node to run "performUpkeep" function, because in this function we are in a "Calculating State".
                await raffle.performUpkeep([])

                await expect(raffle.enterRaffle({value: entryFee})).to.be.revertedWith("Raffle_NOT_OPEN")
            })
          })

          describe("checkUpkeep", () => {
                
            it("It checks to see if no body is entered in the Raffle", async() => {

                await network.provider.send("evm_increaseTime", [timeInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])

                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])

                expect(!upkeepNeeded)
            })

            it("It should not let particpants participate when it is in Calculating State", async() => {

                await raffle.enterRaffle({value: entryFee})

                await network.provider.send("evm_increaseTime", [timeInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])

                await raffle.performUpkeep("0x00") // Or: write it like "performUpkeep([])" because the argument is a "bytes data type" so you can use either of the two ways.

                const raffleState = await raffle.getRaffleState()

                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])

                expect(raffleState.toString()).to.equal("1")

                expect(upkeepNeeded).to.equal(false)
            })

            it("It should return false if enough time has not passed, and the Raffle is still in Calculating State", async() => {

                await raffle.enterRaffle({value: entryFee})

                await network.provider.send("evm_increaseTime", [timeInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])

                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x00")

                expect(!upkeepNeeded)
            })

            it("It should performUpkeep if there are Participants and Balance in Raffle, and Raffle State is Open", async() => {

                await raffle.enterRaffle({value: entryFee})

                await network.provider.send("evm_increaseTime", [timeInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])

                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x00")

                expect(upkeepNeeded)
            })
          })

          describe("performUpkeep", () => {
                
            it("It should only performUpkeep if checkUpkeep is True", async() => {

                await raffle.enterRaffle({value: entryFee})

                await network.provider.send("evm_increaseTime", [timeInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])

                const performUpkeep = await raffle.performUpkeep("0x00")

                expect(performUpkeep)
            })

            it("It should not performUpkeep if checkUpkeep is False", async() => {

                await expect(raffle.performUpkeep("0x00")).to.be.revertedWith("Upkeep_NOT_NEEDED")
            })

            it("It should update the Raffle State, emits an event, and calls VRFCoordinator", async() => {

                await raffle.enterRaffle({value: entryFee})

                await network.provider.send("evm_increaseTime", [timeInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])

                const performUpkeep = await raffle.performUpkeep("0x00")

                const txReciept = await performUpkeep.wait(1)

                const requestId = await txReciept.events[1].args.requestId
                
                const updatedRaffleState = await raffle.getRaffleState()

                expect(requestId.toString() > 0)
                
                expect(updatedRaffleState.toString()).to.equal("1")
            })
        })  

          describe("fulfillRandomWords", () => {

           beforeEach("We are Participating in the Raffle", async() => {
            // First: We have to enter in the Raffle.
            await raffle.enterRaffle({value: entryFee})

            await network.provider.send("evm_increaseTime", [timeInterval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
           })

            it("fulfillRandomWords only called after performUpkeep", async() => {
                // Check the request on "0".
                await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request")
                // lets: Check again the request on "1".
                await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)).to.be.revertedWith("nonexistent request")
                // We can go on and on, but this is to show "fulfillRandomWords" is not getting called before "performUpkeep".
            })

            it("It should pick a Winner, Resets the Raffle, and sends the money to the Winner", async() => {

                let participantOne, participantTwo, participantThree

                const totalParticipants = 3

                const participantAddressIndex = 1   // because Index "0" is the deployer's address.

                const accounts = await ethers.getSigners()

                if(i = participantAddressIndex, i < totalParticipants + participantAddressIndex, i++) {

                  const accountConnectedToRaffle = await raffle.connect(accounts[i])

                  await accountConnectedToRaffle.enterRaffle({value: entryFee})
                }

                const startingTimeStamp = await raffle.getLastTimeStamp()

                // This is our: Listener, which is listening for an "Event":
                await new Promise(async(resolve, reject) => {
                    
                    raffle.once("RaffleWinnerPicked", async() => {
                        
                        console.log("Found The Event: 'RaffleWinnerPicked'")

                      try {

                        const recentWinner = await raffle.getRecentWinner()

                            console.log(`Congratulations...The Winner is : ${recentWinner}`)
                            console.log("-------------------------------------------------------")
                            // These are all the Participating accounts, including the deployer's account.
                            console.log(accounts[0].address)  // It's the deployer's account.
                            console.log(accounts[1].address)
                            console.log(accounts[2].address)
                            console.log(accounts[3].address)

                        const raffleState = await raffle.getRaffleState() // It should be "OPEN" again.

                        const endingTimeStamp = await raffle.getLastTimeStamp() // endingTimeStamp should be greater than startingTimeStamp.

                        const getNumberOfParticipants = await raffle.getNumberOfParticipants() // It should be "0", because we reseted the "s_participants" array.

                        // So, The winner is account: 2, After resolving the "Promise".
                        const winnerEndingBalance = await accounts[2].getBalance()


                        expect(raffleState.toString()).to.equal("0")

                        expect(endingTimeStamp > startingTimeStamp)

                        await expect(raffle.getParticipants(0)).to.be.reverted    // It should be reverted, because we reseted the array, So there will be no participant on Index "0".

                        expect(getNumberOfParticipants).to.equal("0")

                        expect(winnerEndingBalance.toString()).to.equal(winnerStartingBalance.add(entryFee.mul(totalParticipants).sub(entryFee)).toString())

                        resolve()  // Try to "resolve".

                      } catch(error) {

                        reject(error)  // Otherwise "reject".
                      }
                    })

                    // We are performing: performUpkeep for our "Promise" to listen.
                    const tx = await raffle.performUpkeep("0x00")
                    const txReciept = await tx.wait(1)

                    // So, Account: 2 : Is the Winner after resolving the "Promise", we initialize the winner's account balance below to check, Is the Winner is getting the "bounty" or not by checking its "before" and "after" balance.
                    const winnerStartingBalance = await accounts[2].getBalance()

                    await vrfCoordinatorV2Mock.fulfillRandomWords(txReciept.events[1].args.requestId, raffle.address)
                })
            })        
        })
    })    
