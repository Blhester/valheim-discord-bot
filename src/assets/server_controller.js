import { exec } from "child_process";


export function processIsRunning(serverProcessName) {
    let isRunning = false;
    exec(`pidof -s ${serverProcessName}`, (error, stdout) => {
        if (error !== null) {
            console.log(error.toString());
            return;
        } else if (stdout !== null) {
            isRunning = true;
            return;
        }
    });
    return isRunning;
}

export function getLastStartTimeOfServerInLogs(outputLogPath) {
    let startTime;
    exec(`cat ${outputLogPath} | grep "Load world:" | tail -1`, (error, stdout) => {
        if (error !== null) {
            new Error('Unable to find a startTime in the logs');
            console.log(error.toString());
            return;
        } else if (stdout !== null) {
            startTime = new Date(stdout.toString().trim().slice(0, 18));
            return;
        }
    });
    return startTime;
}