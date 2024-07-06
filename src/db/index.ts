import {connect} from "mongoose";

const uri = 'mongodb://localhost:27017/smart-cycle-market';
connect(uri).then(()=>{
    console.log('db conneted successfully.');
}).catch((err) =>{
    console.log("db connect error : ",err.message);
})