const { run } = require("hardhat")

async function verify(contractAddress, args) {

    console.log("Please Wait Contract is Verifying......")

 try{
     await run("verify:verify", {

        address: contractAddress,
        constructorArgs: args

    })} catch(error) {

        if(error.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified")
        } else {
            console.log(error)
        }
}}


module.exports = { verify }