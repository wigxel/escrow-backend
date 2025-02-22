import { getBankList } from "~/services/bank.service"
import { runTest } from "./app"

describe("Bank service", ()=>{
  describe("Get bank list", ()=>{
    test("should return all bank lists", async()=>{
      const program = getBankList()
      const result = await runTest(program)
      expect(result).toMatchInlineSnapshot(`
        {
          "data": [
            {
              "active": "active",
              "code": "112",
              "id": "bank-id",
              "name": "bank name",
            },
          ],
          "message": "",
          "status": "",
        }
      `)
    })
  })
})