const bcrypt = require('bcrypt')
require('dotenv').config()

const password = "123"
const encpassword = bcrypt.hashSync(password , process.env.PASSWORD_SECRET)
const newPass = bcrypt.hashSync("newPass" , process.env.PASSWORD_SECRET)

console.log('password: ' + password)
console.log('encpassword: ' + encpassword)

console.log('compare: ' + bcrypt.compareSync(password , bcrypt.hashSync('123456' , process.env.PASSWORD_SECRET) ))
