import { unlink } from "fs/promises";
import config from "config";

async function removeFile(path) {
    try {
        await unlink(path);
    } catch (e) {
        console.log("Error while removing file", e.message);
    }
}

function authorizedUser(userName) {
    return config.get("AUTHORIZED_USERS").includes(userName);
}

export { removeFile, authorizedUser };
