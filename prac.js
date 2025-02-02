const f = {userId:"kadima",escrowId:"escrowid",rating:"4"}
const b = Object.entries(f).map(([key, value])=>{
  return value
})

console.log(...b)