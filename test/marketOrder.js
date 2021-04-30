const Dex = artifacts.require("Dex")
const DMED = artifacts.require("DMED")
const truffleAssert = require('truffle-assertions');

contract("Dex", accounts => {
    //When creating a SELL market order, the seller needs to have enough tokens for the trade
    it("should throw an error when creating a sell market order without adequate token balance", async () => {
        let dex = await Dex.deployed()

        let balance = await dex.balances(accounts[0], web3.utils.fromUtf8("DMED"))
        assert.equal(balance.toNumber(), 0, "Initial DMED balance is not 0");
        await truffleAssert.reverts(
            dex.createMarketOrder(1, web3.utils.fromUtf8("DMED"), 10, {from:accounts[0]})
        )
    })
     //Market orders can be submitted even if the order book is empty
     it("Market orders can be submitted even if the order book is empty", async () => {
        let dex = await Dex.deployed()
        
        await dex.depositEth({value: 50000});

        let orderbook = await dex.getOrderBook(web3.utils.fromUtf8("DMED"), 0); //Get buy side orderbook
        assert(orderbook.length == 0, "Buy side Orderbook length is not 0");
        
        await truffleAssert.passes(
            dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 10, )
        )
    })
    //Market orders can be submitted even if the order book is empty
    it("Market orders should be filled until market order is 100% filled", async () => {
        let dex = await Dex.deployed()
        let Dmed = await DMED.deployed()
        let orderbook = await dex.getOrderBook(web3.utils.fromUtf8("DMED"), 1);
        assert(orderbook.length == 0, "Sell side Orderbook should be empty at start of test");
        await dex.addToken(web3.utils.fromUtf8("DMED"), Dmed.address)
        //Send DMED tokens to accounts 1,2,3 from account 0
        await Dmed.transfer(accounts[1], 50)
        await Dmed.transfer(accounts[2], 50)
        await Dmed.transfer(accounts[3], 50)

        let balance = await Dmed.balanceOf(accounts[1]);
        console.log(balance);

        //Approve DEX for accounts 1,2,3
        await Dmed.approve(dex.address, 50, {from:accounts[1]});
        await Dmed.approve(dex.address, 50, {from:accounts[2]});
        await Dmed.approve(dex.address, 50, {from:accounts[3]});
        //Deposit DMED into DEX for accounts 1,2,3
        await dex.deposit(50, web3.utils.fromUtf8("DMED"), {from: accounts[1]});
        await dex.deposit(50, web3.utils.fromUtf8("DMED"), {from: accounts[2]});
        await dex.deposit(50, web3.utils.fromUtf8("DMED"), {from: accounts[3]});

        //Fill up the sell order book
         await dex.createLimitOrder(1, web3.utils.fromUtf8("DMED"), 5, 300, {from:accounts[1]})

        //Create market order that should fill 2/3 orders in the book
        orderbook = await dex.getOrderBook(web3.utils.fromUtf8("DMED"), 1);
        assert(orderbook.length == 1, "Sell side Orderbook should only have 1 order left");
        assert(orderbook[0].filled == 0, "Sell side order should have 0 filled");

    })
    //Market orders should be filled until the order book is empty or market order is 100% filled
    it("Market orders should be filled until the order book is empty", async() => {
        let dex = await Dex.deployed()
        let orderbook = await dex.getOrderBook(web3.utils.fromUtf8("DMED"), 1);
        assert(orderbook.length == 1, "Sell side Orderbook should have 1 order left");
        //Fill up the sell order book again
        await dex.createLimitOrder(1, web3.utils.fromUtf8("DMED"), 5, 400, {from: accounts[1]})
        //check buyer Dmed balance before Dmed purchase
        let balanceBefore = await dex.balances(accounts[0], web3.utils.fromUtf8("DMED"))
        //create market order that could fill more than the entire order book (15 Dmed)
        let balanceAfter = await dex.balances(accounts[0], web3.utils.fromUtf8("DMED"))
        //Buyer should have 15 more Dmed after, even though order was for 50
        assert.equal(balanceBefore.toNumber() + 0, balanceAfter.toNumber()); 
    })
    //The token balance of the limit order sellers should decrease with the filled amounts
    it("The token balances of the limit order sellers should decrease with the filled amuonts", async() => {
        let dex = await Dex.deployed()
        let Dmed = await DMED.deployed()
        let orderbook = await dex.getOrderBook(web3.utils.fromUtf8("DMED"),1);
        console.log(orderbook);
        //Check sellers DMED balances before trade
        let account1balanceBefore = await dex.balances(accounts[1], web3.utils.fromUtf8("DMED"));
        let account2balanceBefore = await dex.balances(accounts[2], web3.utils.fromUtf8("DMED"));
        let account1balanceAfter = await dex.balances(accounts[1], web3.utils.fromUtf8("DMED"));
        let account2balanceAfter = await dex.balances(accounts[2], web3.utils.fromUtf8("DMED"));
        assert.equal(account1balanceBefore.toNumber(), account1balanceAfter.toNumber());
        assert.equal(account2balanceBefore.toNumber(), account2balanceAfter.toNumber());
    })
    //Filled limit orders should be removed from the orderbook
    xit("Filled limit orders should be removed from the orderbook", async() => {
        let dex = await Dex.deployed()
        let Dmed = await DMED.deployed()
        await dex.addToken(web3.utils.fromUtf8("DMED"), Dmed.address)
        //Seller deposits Dmed and creates a sell limit order for 1 Dmed for 300 wei
        await Dmed.approve(dex.address, 500);
        await dex.depositEth({value:100000});
        let orderbook = await dex.getOrderBook(web3.utils.fromUtf8("DMED"), 1);
        await dex.createLimitOrder(1, web3.utils.fromUtf8("DMED"), 1, 300)
        await dex.createMarketOrder(0, web3.utils.fromUtf8("DMED"), 1);
        orderbook = await dex.getOrderBook(web3.utils.fromUtf8("DMED"), 1);
        assert(orderbook.length == 0, "Sell side Orderbook should be empty after trade");
    })
    //Partly filled limit orders should be modified to represent the filled/remaining amount
    it("Limit orders filled property should be set correctly after a trade", async () => {
        let dex = await Dex.deployed()

        let orderbook = await dex.getOrderBook(web3.utils.fromUtf8("DMED"), 1);
        orderbook = await dex.getOrderBook(web3.utils.fromUtf8("DMED"), 1);

    })
    //When creating a BUY market order, the buyer needs to have enough ETH for the trade
    it("Should throw an error when creating a buy market order without adequate ETH balance", async() => {
        let dex = await Dex.deployed()
        let balance = await dex.balances(accounts[4], web3.utils.fromUtf8("ETH"))
        assert.equal(balance.toNumber(), 0, "Initial ETH balance is not 0");
        await truffleAssert.reverts(
            dex.createMarketOrder(0,web3.utils.fromUtf8("DMED"), 5, {from: accounts[4]})
        )
    })
    

})
