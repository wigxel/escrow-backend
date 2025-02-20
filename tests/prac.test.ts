
const market = {
  getApples: () => 100
}

const getApplesSpy = vi.spyOn(market, 'getApples')
market.getApples()
getApplesSpy.mock.calls.length === 1


describe("testing", ()=>{
  it('should return mocked data', () => {
    const mockFetchData = vi.fn().mockReturnValue({ name: 'Alice', age: 25 });
    const result = mockFetchData();
    expect(result).toEqual({ name: 'Alice', age: 25 });
  });

})