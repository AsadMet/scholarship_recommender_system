const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const User = require("./models/User")
require("dotenv").config()

const fixUserPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dreamfund", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log("Connected to MongoDB")

    // Find all users
    const users = await User.find({})
    console.log(`Found ${users.length} users`)

    for (const user of users) {
      console.log(`\nUser: ${user.email}`)
      console.log(`Has password: ${!!user.password}`)
      console.log(`Password length: ${user.password?.length || 0}`)
      console.log(`Auth method: ${user.authMethod}`)
      
      // Check if password looks hashed (bcrypt hashes start with $2a$ or $2b$)
      if (user.password && !user.password.startsWith('$2')) {
        console.log(`⚠️  Password for ${user.email} is NOT hashed! Hashing now...`)
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(user.password, salt)
        await user.save()
        console.log(`✅ Password hashed for ${user.email}`)
      } else if (user.password) {
        console.log(`✅ Password is already hashed`)
      } else {
        console.log(`❌ No password set for this user`)
      }
    }

    console.log("\n✅ All users checked!")
    process.exit(0)
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

fixUserPasswords()
