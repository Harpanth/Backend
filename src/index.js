// Always use try catch to connect to db because there are cases of error occurence and also look for async and await
// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
    path: '.env'
})


connectDB();








// import express from 'express'
// const app= express();

//  ;( async () => {
//     try {
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 
//        app.on("error", (error)=> {
//         console.log("ERROR", error);
//         throw error
//        })

//        app.listen(process.env.PORT, ()=> {
//         console.log(`APP is listening on port ${process.env.PORT}`)
//        })
//     } catch (error) {
//         console.log("ERROR: ",error)
//         throw error
//     }
//  })()