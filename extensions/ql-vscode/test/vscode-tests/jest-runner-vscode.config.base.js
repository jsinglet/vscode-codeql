const path = require("path");
const tmp = require("tmp-promise");

const tmpDir = tmp.dirSync({ unsafeCleanup: true });

const rootDir = path.resolve(__dirname, "../..");

/** @type import("jest-runner-vscode").RunnerOptions */
const config = {
  version: "stable",
  launchArgs: [
    "--disable-gpu",
    "--extensions-dir=" + path.join(rootDir, ".vscode-test", "extensions"),
  ],
  extensionDevelopmentPath: rootDir,
  // Hide VSCode stdout, but show console.log
  filterOutput: true,
  // Hide information about VSCode exit code and download
  quiet: true,
};

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
  if (process.env.VSCODE_WAIT_FOR_DEBUGGER === "true") {
    config.launchArgs?.push("--inspect-brk-extensions", "9223");
  } else {
    config.launchArgs?.push("--inspect-extensions", "9223");
  }
}

module.exports = {
  config,
  tmpDir,
  rootDir,
};
