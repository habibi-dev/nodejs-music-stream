import CronDefinitionInterface from "../../../contracts/CronDefinitionInterface";
import ClearingTmp from "./jobs/ClearingTmp";

const kernel: CronDefinitionInterface[] = [
    {
        schedule: "* * * * *",
        job: new ClearingTmp()
    }
];

export default kernel;
