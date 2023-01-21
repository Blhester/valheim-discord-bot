import { exec } from "child_process";


export function processIsRunning(serverProcessName) {
    let isRunning = false;
    const {stdout, stderr} = exec(`pidof -s ${serverProcessName}`);

    if (stderr !== null) {
        console.log(stderr.toString());
    }

    if (stdout !== null) isRunning = true;

    return isRunning;
}

export function getLastStartTimeOfServerInLogs(outputLogPath) {
    let startTime;
    const {stdout, stderr} = exec(`cat ${outputLogPath} | grep "Load world:" | tail -1`);
    
    if (stderr !== null) {
        new Error('Unable to find a startTime in the logs');
        console.log(stderr.toString());
    }

    if (stdout !== null) {
        startTime = new Date(stdout.toString().trim().slice(0, 18));
    }

    return startTime;
}