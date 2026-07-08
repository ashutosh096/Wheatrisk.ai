import { Router, type IRouter } from "express";
import healthRouter from "./health";
import districtsRouter from "./districts";
import filtersRouter from "./filters";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/districts", districtsRouter);
router.use("/filters", filtersRouter);

export default router;
