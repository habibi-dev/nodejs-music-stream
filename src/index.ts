import dotenv from "dotenv";
import MusicController from "./controller/MusicController";

dotenv.config();

new MusicController().start()

