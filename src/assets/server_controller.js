import { exec } from "child_process";


export function processIsRunning(serverProcessName) {
    exec(`pidof -s ${serverProcessName}`, (error, stdout) => {
        if (error !== null)  {
            console.log(error.toString());
        } else if (stdout !== null) {
            return true;
        }
        return false; 
    }).unref();
}

export function getLastStartTimeOfServerInLogs(outputLogPath) {
    exec(`cat ${outputLogPath} | grep "Load world:" | tail -1`, (error, stdout) => {
        if (error !== null) {
            new Error('Unable to find a startTime in the logs');
            console.log(error.toString());
        } else if (stdout !== null) {
            return new Date(stdout.toString().trim().slice(0, 18));
        }
    }).unref();
}