import 'dotenv/config'
import express from 'express';
import 'express-async-errors'
import authRouter from 'routes/auth';
import "src/db"
import productRouter from './routes/product';
const app = express();
app.use(express.static("src/public"));
app.use(express.json());
app.use(express.urlencoded({extended : false}));
// API ROUTES
app.use("/auth",authRouter);
app.use("/product",productRouter);

app.use(function(err,req,res,next){
    res.status(500).json({message : err.message});
} as express.ErrorRequestHandler)

app.listen(8000,()=>{
    console.log("this app is on the http://localhost:8000");
    
})