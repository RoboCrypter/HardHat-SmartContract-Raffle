require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()



const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY



module.exports = {

    defaultNetwork: "hardhat",

    networks: {

        hardhat: {
            chainId: 31337,
         // url: ,
         // accounts: [],
        },
        
        rinkeby: {
            chainId: 4,
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY],
            blockConfirmations: 6,
            gas: 6000000,
        }
    },

    etherscan: {
        apiKey: ETHERSCAN_API_KEY
    },

    gasReporter: {
        enabled: false,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "eth",
    },

    solidity: "0.8.7",

    namedAccounts: {

        deployer: {
            default: 0
        },

        participant: {
            default: 1
        }
    },

    mocha: {

        timeout: 500000,   // "500000" means, 500 "seconds".
    },

    contractSizer: {
        runOnCompile: false,
        only: ["Raffle"]
    }
}
