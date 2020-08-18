const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");
const admz = require("adm-zip");
const exec = require("child_process").exec;

/**
 * Basic Promise wrapper for the node internal `exec` command.
 * 
 * @param {string} cmd 
 */
function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve(stdout ? stdout : stderr);
    });
  });
}

/**
 * Returns the map of name to download link for Axios to
 * stream.
 */
function getDownloads() {
  return {
    "ubuntu-20.04": "https://aka.ms/wslubuntu2004",
    "ubuntu-18.04": "https://aka.ms/wsl-ubuntu-1804",
    "ubuntu-16.04": "https://aka.ms/wsl-ubuntu-1604",
    "debian": "https://aka.ms/wsl-debian-gnulinux",
    "kali": "https://aka.ms/wsl-kali-linux-new",
    "opensuse": "https://aka.ms/wsl-opensuse-42",
    "suse-enterprise": "https://aka.ms/wsl-sles-12",
    "fedora": "https://github.com/WhitewaterFoundry/WSLFedoraRemix/releases/",
  };
}

/**
 * Downloads a file based on its name returned by the `getDownloads`
 * function.
 * 
 * @param {string} name 
 */
async function downloadFromName(name) {
  let urlFound = getDownloads()[name];

  if (!urlFound) throw new Error("Failed to find distribution.");

  await axios
    .get(urlFound, {
      responseType: "stream",
    })
    .then((res) => {
      const outputName = name.replace(".", "-") + ".appx";
      const writer = fs.createWriteStream(
        path.resolve(os.tmpdir(), outputName)
      );

      res.data.pipe(writer);
    })
    .catch((err) => {
      console.error(err);
    });
}

/**
 * Unzips the specified installer in the temporary directory of Windows.
 * 
 * @param {string} name 
 */
function unzipDownload(name) {
  const outputName = name.replace(".", "-") + ".appx";
  const reader = new admz(path.resolve(os.tmpdir(), outputName));
  const unzipDir = path.resolve(os.tmpdir(), "wsll");

  reader.extractAllTo(unzipDir, true);
}

/**
 * Registers the root filesystem (`install.tar.gz` within the `appx`)
 * with WSL.
 * 
 * @param {string} customName 
 * @param {string} installLocation 
 */
async function runInstaller(customName, installLocation) {
  const unzipDir = path.resolve(os.tmpdir(), "wsll");

  if (!fs.existsSync(unzipDir))
    throw new Error("No unzipped distribution available.");

  const rootFs = path.resolve(os.tmpdir(), "wsll", "install.tar.gz");

  if (!fs.existsSync(rootFs)) throw new Error("No root filesystem found.");

  const cmd = `wsl.exe --import ${customName} ${installLocation} ${rootFs}`;

  return await execShellCommand(cmd)
    .then((v) => {
      console.log(v);
    })
    .catch((err) => {
      console.error(err);
    });
}

/**
 * Cleans up the temporary directory created by unzipping
 * and running the installer.
 */
async function cleanupInstaller() {
  const unzipDir = path.resolve(os.tmpdir(), "wsll");
  if (!fs.existsSync(unzipDir)) fs.rmdirSync(unzipDir);
}

/**
 * Spawns a terminal given the *registered* name of the
 * distribution specified in the `runInstaller` method.
 * 
 * @param {string} name 
 */
async function spawnTerminal(name) {
  await execShellCommand(`start powershell.exe wsl.exe --distribution ${name}`);
}

module.exports = {
  getDownloads: getDownloads,
  downloadFromName: downloadFromName,
  unzipDownload: unzipDownload,
  runInstaller: runInstaller,
  spawnTerminal: spawnTerminal,
  cleanup: cleanupInstaller,
};
