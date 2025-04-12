const fs = require("fs");
const path = require("path");

const versionFilePath = path.resolve(__dirname, "src", "version.json");

// Read the current version from version.json
const versionData = JSON.parse(fs.readFileSync(versionFilePath, "utf8"));
const currentVersion = versionData.version;
console.log(`Version : ${currentVersion}`);
