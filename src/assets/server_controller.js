import { execSync } from "child_process";


export function processIsRunning(serverProcessName) {
    let pid = execSync(`pidof -s ${serverProcessName}`);

    if (pid !== null) {
        return true;
    }

    return false;
}

export function getLastStartTimeOfServerInLogs(outputLogPath) {
    let startTime;
    startTime = execSync(`cat ${outputLogPath} | grep "Load world:" | tail -1`);
    
    if (startTime == null) {
        console.log('Unable to find a startTime in the logs');
    }
 
    return startTime;
}