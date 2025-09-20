import {Router} from "express";
import HomeController from "../controller/HomeController";
import RouteInterface from "../../../contracts/RouteInterface";

// Create router instance for home module
const router = Router();

// Register home index route
router.get('/status', HomeController.status);

// Export route configuration
const homeRoute: RouteInterface = {
    basePath: '/api',
    router,
};

export default homeRoute;
