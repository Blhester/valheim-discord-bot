import { execSync } from "child_process";


export function processIsRunning(serverProcessName) {
    try {
        execSync(`pidof -s ${serverProcessName}`);
    } catch {
        return false;
    }

    return true;
}

export function getLastStartTimeOfServerInLogs(outputLogPath) {
    let startTime;
    try {
        startTime = execSync(`cat ${outputLogPath} | grep "Load world:" | tail -1`);
    } catch {
        console.log('Unable to find a startTime in the logs');
        return null;
    }
 
    return startTime.toString().trim().slice(0, 18);
}