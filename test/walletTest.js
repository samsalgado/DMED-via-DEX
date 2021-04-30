const Dex = artifacts.require("Dex")
const DMED = artifacts.require("DMED")
const truffleAssert = require('truffle-assertions');

contract("Dex", accounts => {
    it("should only be possible for owner to add tokens", async() => {
  let dex = await Dex.deployed()
  let Dmed = await DMED.deployed()
  await truffleAssert.passes(
  dex.addToken(web3.utils.fromUtf8("DMED"), Dmed.address, {from: accounts[0]})
  )
  await truffleAssert.reverts(
    dex.addToken(web3.utils.fromUtf8("DMED"), Dmed.address, {from: accounts[1]})
    )
    })
    it("should handle deposits correcty", async() => {
        let dex = await Dex.deployed()
        let Dmed = await DMED.deployed()
        await Dmed.approve(dex.address, 500);
        await dex.deposit(100, web3.utils.fromUtf8("DMED"));
        let balance = await dex.balances(accounts[0], web3.utils.fromUtf8("DMED"))
        assert.equal(balance.toNumber(100), 100 ) 
    
          })
          it("should handle faulty withdrawals correctly", async() => {
              let dex = await Dex.deployed()
              let Dmed = await DMED.deployed()
              await truffleAssert.reverts(dex.withdraw(500, web3.utils.fromUtf8("DMED")))
          }
          )
          it("should handle correct withdrawals correctly", async() => {
            let dex = await Dex.deployed()
            let Dmed = await DMED.deployed()
            await truffleAssert.passes(dex.withdraw(100, web3.utils.fromUtf8("DMED")))
        })
       
})

