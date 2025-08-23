import express from "express";
import flightsRouter from "./routes/flights.js";
import testRouter from "./routes/test/test.js";
import cors from 'cors';

const app = express();
app.use(cors());

app.use(express.json());
app.use("/flights", flightsRouter);

app.use("/test", testRouter);

export default app;
