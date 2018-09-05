describe('Token.sol', function() {
  describe('Transfer()', function() {
    it('should revert when transferred amount is smaller than 0', function() {
      contracts['Token.sol:Token'].methods.transfer(address0, -1).send().on('error', (e) => assertRevert(e))
    });
  });
});