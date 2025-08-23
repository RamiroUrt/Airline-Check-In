import { Router } from "express";
import { getFlightPassengers } from "../controllers/flightController.js";

const router = Router();

router.get("/:id/passengers", getFlightPassengers);

router.get("/:id", getFlightPassengers);

export default router;
