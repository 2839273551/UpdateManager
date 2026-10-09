const semver = require('semver');

/**
 * Clean and normalize a version string (e.g., "v1.2.3" -> "1.2.3", "1.2" -> "1.2.0")
 */
function cleanVersion(versionStr) {
  if (!versionStr) return null;
  const trimmed = versionStr.trim().replace(/^v/i, '');
  const coerced = semver.coerce(trimmed);
  return coerced ? coerced.version : null;
}

/**
 * Compare two versions. Returns true if remote is newer than current.
 */
function isNewerVersion(remoteVersion, currentVersion) {
  const remote = cleanVersion(remoteVersion);
  const current = cleanVersion(currentVersion);
  if (!remote || !current) return false;
  return semver.gt(remote, current);
}

/**
 * Detect OS and architecture platform from filename
 */
function detectPlatform(fileName) {
  if (!fileName) return 'universal';
  const name = fileName.toLowerCase();

  // Exclude checksum, metadata, and doc files
  if (name.endsWith('.txt') || name.endsWith('.sha256') || name.endsWith('.md') || name.endsWith('.json')) {
    return 'metadata';
  }

  // Windows detection
  const isWindows = name.includes('win') || name.endsWith('.exe') || name.endsWith('.msi');
  // macOS detection
  const isMac = name.includes('mac') || name.includes('darwin') || name.includes('osx') || name.endsWith('.dmg') || name.endsWith('.pkg');
  // Linux detection
  const isLinux = name.includes('linux') || name.endsWith('.appimage') || name.endsWith('.deb') || name.endsWith('.rpm');

  // Architecture detection
  const isArm64 = name.includes('arm64') || name.includes('aarch64');
  const isArm = name.includes('arm') || name.includes('armv7');
  const isX86 = name.includes('x86') || name.includes('ia32') || name.includes('i386') || name.includes('i686') || name.includes('win32');
  const isX64 = name.includes('x64') || name.includes('amd64') || name.includes('x86_64');

  if (isWindows) {
    if (isArm64) return 'windows_arm64';
    if (isX86) return 'windows_x86';
    return 'windows_x64';
  }

  if (isMac) {
    if (isArm64 || name.includes('apple') || name.includes('m1') || name.includes('m2') || name.includes('m3')) return 'mac_arm64';
    if (name.includes('universal')) return 'mac_universal';
    return 'mac_x64';
  }

  if (isLinux) {
    if (isArm64) return 'linux_arm64';
    if (isArm) return 'linux_armv7';
    return 'linux_x64';
  }

  return 'universal';
}

/**
 * Parse checksum files like checksums.txt, SHA256SUMS, etc.
 * Supports format:
 * <hash>  <filename>
 * <hash> *<filename>
 */
function parseChecksums(textContent) {
  const checksumMap = {};
  if (!textContent) return checksumMap;

  const lines = textContent.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Match 64-char hex string followed by space and filename
    const match = trimmed.match(/^([a-fA-F0-9]{64})\s+[\*]?(.+)$/);
    if (match) {
      const hash = match[1].toLowerCase();
      const filename = match[2].trim();
      checksumMap[filename] = hash;
      // Also match basename just in case path is included
      const basename = filename.split(/[\/\\]/).pop();
      checksumMap[basename] = hash;
    }
  }

  return checksumMap;
}

module.exports = {
  cleanVersion,
  isNewerVersion,
  detectPlatform,
  parseChecksums
};
