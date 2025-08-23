import express from "express";
import flightsRouter from "./routes/flights.js";
import testRouter from "./routes/test/test.js";
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "BSale Airline API is running",
    timestamp: new Date().toISOString()
  });
});
//endpoint para Raleway Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString() 
  });
});

app.use("/flights", flightsRouter);

app.use("/test", testRouter);



export default app;
