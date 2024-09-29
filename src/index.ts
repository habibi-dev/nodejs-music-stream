import MusicController from "./controller/MusicController";
import Logger from "./lib/Logger";

Logger.initialize("logs")

new MusicController().start()

