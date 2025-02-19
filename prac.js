const a = {name:"him",age:25,profile:{height:"5.7ft"}}

const b = Object.assign({}, a)

b.name = "kadima"
b.profile.height="5.8ft"

console.log(a,b)