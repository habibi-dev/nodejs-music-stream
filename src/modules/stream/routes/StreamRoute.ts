import {Router} from "express";
import RouteInterface from "../../../contracts/RouteInterface";
import {StreamController} from "../controllers/StreamController";

// Create router instance for home module
const router = Router();

// Register home index route
router.get("/:channelId", StreamController.channel);

// Export route configuration
const streamRoute: RouteInterface = {
    basePath: '/stream',
    router,
};

export default streamRoute;

