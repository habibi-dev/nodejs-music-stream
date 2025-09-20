import MiddlewareDefinitionInterface from "../../../contracts/MiddlewareDefinitionInterface";
import homeMiddleware from "./middlewares/HomeMiddleware";

const kernel: MiddlewareDefinitionInterface[] = [
    {
        path: "/",
        handler: homeMiddleware
    }
];

export default kernel;
