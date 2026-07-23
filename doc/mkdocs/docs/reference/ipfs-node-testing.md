---
title: Testing with an Isolated IPFS Node
description: Spin up a standalone IPFS container to inspect content and decrypt workspace documents manually
icon: material/flask-outline
tags:
  - ipfs
  - testing
  - reference
  - advanced
---

# Testing with an Isolated IPFS Node

For advanced debugging, it can be useful to inspect IPFS content directly from a standalone container that is separate from the running TruSpace stack — for example, to fetch a CID and manually decrypt a document outside of the application.

!!! warning "Advanced / manual procedure"
    This is a low-level diagnostic technique intended for developers and administrators comfortable working directly with IPFS and Node.js. It is not required for normal operation of TruSpace.

---

## 1. Run an Isolated Container

Start a plain Ubuntu container attached to the TruSpace Docker network, with its own set of ports so it does not collide with the running stack:

```bash
docker run -itd --network truspace_default --name singleipfs \
  -p 5027:5001 -p 4027:4001 -p 8027:8080 -p 8028:8081 \
  --platform linux/arm64 arm64v8/ubuntu
```

!!! note "Platform flag"
    Adjust `--platform` (e.g. `linux/amd64`) to match your host architecture.

Attach a shell to the container:

```bash
docker exec -it singleipfs /bin/bash
```

## 2. Install an IPFS Node (Kubo)

Inside the container:

```bash
apt update -y && apt upgrade -y && apt install wget -y && apt install nodejs -y

wget https://dist.ipfs.tech/kubo/v0.33.2/kubo_v0.33.2_linux-arm64.tar.gz
tar xvfz kubo_v0.33.2_linux-arm64.tar.gz
cd kubo
./install.sh

ipfs init
ipfs daemon
```

!!! tip "Matching architecture"
    Download the Kubo release matching your platform (e.g. `kubo_v0.33.2_linux-amd64.tar.gz`) from the [Kubo release list](https://dist.ipfs.tech/kubo/).

## 3. Fetch Content by CID

With the daemon running (in a second shell into the same container, or backgrounded):

```bash
ipfs get <cid>
```

## 4. Decrypt a Fetched Document

TruSpace encrypts document content before writing it to IPFS, using the workspace ID as part of the key derivation (see [Security Architecture](../architecture/security.md#encryption)). To inspect a fetched file's plaintext outside of the application, use the helper script below with the workspace ID (CID) as the password.

Save as `decrypt.js`:

```js
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const ALGORITHM = "aes-256-cbc";
const KEY_DERIVATION_ITERATIONS = 10000;
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Encrypts data using AES-256-CBC and a user-provided key.
 *
 * @param {Buffer|string} data - The data to be encrypted.
 * @param {string} password - The key used for encryption.
 * @returns {Promise<Buffer>} - Encrypted data as a Buffer.
 */
async function encrypt(data, password) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const key = await new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      KEY_DERIVATION_ITERATIONS,
      KEY_LENGTH,
      "sha512",
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      }
    );
  });

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

  return Buffer.concat([salt, iv, encrypted]);
}

/**
 * Decrypts data previously encrypted with the `encrypt` function.
 *
 * @param {Buffer} data - Encrypted Buffer.
 * @param {string} password - The same key used during encryption.
 * @returns {Promise<Buffer>} - The decrypted data.
 */
async function decrypt(data, password) {
  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const text = data.subarray(SALT_LENGTH + IV_LENGTH);

  const key = await new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      KEY_DERIVATION_ITERATIONS,
      KEY_LENGTH,
      "sha512",
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      }
    );
  });

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(text), decipher.final()]);

  return decrypted;
}

/**
 * Reads file content.
 * @param {string} filePath - Path to the file.
 * @returns {Buffer} - File content as Buffer.
 */
function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File '${filePath}' not found.`);
    process.exit(1);
  }
  return fs.readFileSync(filePath);
}

/**
 * Writes content to a file.
 * @param {string} filePath - Path to the file.
 * @param {Buffer} data - Data to write.
 */
function writeFile(filePath, data) {
  fs.writeFileSync(filePath, data);
  console.log(`Output written to: ${filePath}`);
}

// Command-line interface (CLI)
(async () => {
  let [, , command, inputArg, inputFile, password] = process.argv;

  if (!command || !inputArg || !password) {
    console.error("Usage:");
    console.error('  node script.js encrypt "your message" "your-password"');
    console.error('  node script.js encrypt --file input.txt "your-password"');
    console.error('  node script.js decrypt <hex-data> "your-password"');
    console.error(
      '  node script.js decrypt --file encrypted.txt "your-password"'
    );
    process.exit(1);
  }

  let isFile = inputArg === "--file";
  let inputData;
  let outputFilePath;

  if (isFile) {
    if (!inputFile) {
      console.error("Error: No file specified after '--file'.");
      process.exit(1);
    }
    inputData = readFile(inputFile);
    outputFilePath =
      command === "encrypt" ? `${inputFile}.enc` : `${inputFile}.dec`;
  } else {
    inputData = inputArg;
  }

  try {
    if (command === "encrypt") {
      const encryptedData = await encrypt(inputData, password);
      if (isFile) {
        writeFile(outputFilePath, encryptedData);
      } else {
        console.log("Encrypted Data (Hex):", encryptedData.toString("hex"));
      }
    } else if (command === "decrypt") {
      const encryptedBuffer = isFile
        ? readFile(inputFile)
        : Buffer.from(inputArg, "hex");
      const decryptedData = await decrypt(encryptedBuffer, password);
      if (isFile) {
        writeFile(outputFilePath, decryptedData);
      } else {
        console.log("Decrypted Data:", decryptedData.toString("utf8"));
      }
    } else {
      console.error("Invalid command. Use 'encrypt' or 'decrypt'.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
```

Usage:

```bash
# Decrypt a file fetched from IPFS, using the workspace CID as the password
node decrypt.js decrypt --file ./<fetched-file> "<workspace-cid>"

# Encrypt arbitrary data the same way TruSpace would
node decrypt.js encrypt "some plaintext" "<workspace-cid>"
```

## Related

- [:octicons-arrow-right-24: Security Architecture](../architecture/security.md)
- [:octicons-arrow-right-24: Data Model](../architecture/data-model.md)
- [:octicons-arrow-right-24: Troubleshooting](troubleshooting.md#ipfs-cluster)
