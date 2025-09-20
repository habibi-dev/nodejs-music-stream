import cors from "cors";
import {Express} from "express";

export default function CorsConfig(app: Express) {
    app.use(
        cors({
            origin: "*", // Replace with domain
            optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
        })
    );
}