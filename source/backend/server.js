import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import seedRouter from './routes/seedRoutes.js';
import productRouter from './routes/productRoutes.js';
import userRouter from './routes/userRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import uploadRouter from './routes/uploadRoutes.js';
import Data from './data.js'
import ProductsModel from './models/productModel.js'
import fs from 'fs'

dotenv.config();

mongoose
  .connect("mongodb://localhost:27017/E-Cart")
  .then(() => {
    console.log('connected to db');
  })
  .catch((err) => {
    console.log(err.message);
  });

const app = express();
//app.use(cors)

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

// app.use(createProxyMiddleware({ 
//   target: 'http://localhost:9070/', //original url
//   changeOrigin: true, 
//   //secure: false,
//   onProxyRes: function (proxyRes, req, res) {
//      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
//   }
// }));
app.use(async (req,res,next)=>{
  const products = await ProductsModel.find({})
  if(products.length==0){
    // let Data = fs.readFile(path.join(__dirname,'/data.js')).toString("utf-8")
    // Data = JSON.parse(Data)
    await Promise.all(Data.products.map(async p=>{
      delete p.id
      p.slug=p.name.toLowerCase()
      p.countInStock=Math.floor(Math.random() * 10);
      p.numReviews= Math.floor(Math.random() * 90 + 10)
      p.rating = p.rating?p.rating:Math.floor(Math.random() * (10 * 100 - 1 * 100) + 1 * 100) / (1*100);
      await ProductsModel.create({...p})
    }))
  }
  next()
})
app.get('/',(req,res)=>{
  res.send("testing")
})
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/keys/paypal', (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || 'sb');
});
app.get('/api/keys/google', (req, res) => {
  res.send({ key: process.env.GOOGLE_API_KEY || '' });
});

app.use('/api/upload', uploadRouter);
app.use('/api/seed', seedRouter);
app.use('/api/products',productRouter);
app.use('/api/users', userRouter);
app.use('/api/orders', orderRouter);

const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'))
);

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

const port = process.env.PORT || 9090;
app.listen(port, () => {
  console.log(`serve at http://localhost:${port}`);
});
