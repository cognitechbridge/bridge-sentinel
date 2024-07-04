# Bridge Sentinel: Secure and Encrypted File Sharing GUI

Welcome to **Bridge Sentinel**, the graphical user interface for the BridgeGuard secure and encrypted file sharing system. Bridge Sentinel enhances the BridgeGuard experience by providing an intuitive and user-friendly interface for managing secure file sharing.

## Table of Contents

- [Bridge Sentinel: Secure and Encrypted File Sharing GUI](#bridge-sentinel-secure-and-encrypted-file-sharing-gui)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [How It Works](#how-it-works)
  - [Features](#features)
  - [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [Steps](#steps)
  - [License](#license)

## Introduction

**Bridge Sentinel** is designed to provide a seamless and accessible way to utilize the robust security features of BridgeGuard. Developed using Tauri and Svelte, it enables users to share files securely with or without traditional cloud services, ensuring data privacy and integrity through end-to-end encryption.

## How It Works

1. **Create a Shared Folder**: Users can create a shared folder in their preferred environment, such as Google Cloud, NAS, or removable drives.
2. **Mount the Folder**: Use Bridge Sentinel to mount the shared folder on your operating system.
3. **Normal Use**: Access and store files in the mounted drive as usual.
4. **Encryption**: Bridge Sentinel handles encryption operations to secure data before storage.
5. **Shared Access**: Authorized users can access encrypted data using their encryption keys through Bridge Sentinel.

## Features

- **End-to-End Encryption**: Only authorized users can access shared files.
- **Flexible Storage Options**: Compatible with cloud services, NAS, and removable drives.
- **User-Friendly Interface**: Easy-to-use graphical interface for seamless file sharing.
- **Secure Sharing**: Generate encrypted links for secure file sharing.
- **Independence from Traditional Cloud Services**: Offers flexibility in choosing storage options.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (version 14 or later)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install)
- Git

### Steps
1. Clone the repository:

  ```bash
    git clone https://github.com/cognitechbridge/bridge-sentinel.git
    cd bridge-sentinel
  ```

2. Install Node.js dependencies using pnpm:

  ```bash
  pnpm install
  ```

3. Run the app:

  ```bash
  pnpm run tauri build
  ```

## License

This project is licensed under the CC BY-NC 4.0 License. To view a copy of this license, visit [https://creativecommons.org/licenses/by-nc/4.0/](https://creativecommons.org/licenses/by-nc/4.0/).

---

For more information, please visit our [GitHub page](https://github.com/cognitechbridge/bridge-sentinel).

Happy Sharing!