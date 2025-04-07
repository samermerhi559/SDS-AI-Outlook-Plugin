const fs = require("fs");
const path = require("path");

const versionFilePath = path.resolve(__dirname, "src", "version.json");

// Read the current version from version.json
const versionData = JSON.parse(fs.readFileSync(versionFilePath, "utf8"));
const currentVersion = versionData.version;

// Split the version into major, minor, patch, and build
const versionParts = currentVersion.split(".");
if (versionParts.length !== 4) {
  console.error("Invalid version format. Expected format: x.x.x.x");
  process.exit(1);
}

const [major, minor, patch, build] = versionParts.map(Number);

// Increment the build number
const newBuild = build + 1;
const newVersion = `${major}.${minor}.${patch}.${newBuild}`;

// Update the version.json file
versionData.version = newVersion;
fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));

console.log(`Version updated: ${currentVersion} -> ${newVersion}`);