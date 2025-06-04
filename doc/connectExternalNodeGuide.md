# Run isolated container

`docker run -itd --network truspace_default --name singleipfs -p 5027:5001 -p 4027:4001 -p 8027:8080 -p 8028:8081 --platform linux/arm64 arm64v8/ubuntu`

`docker exec -it singleipfs /bin/bash`

# Install ipfs node

`apt update -y && apt upgrade -y && apt install wget -y && apt install nodejs -y`

`wget https://dist.ipfs.tech/kubo/v0.33.2/kubo_v0.33.2_linux-arm64.tar.gz`

`tar xvfz kubo_v0.33.2_linux-arm64.tar.gz`

`cd kubo`

`./install.sh`

`ipfs init`

`ipfs daemon`

# Get some file

`ipfs get <cid>`

Use this script to decrypt and use the workspace cid as password

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
