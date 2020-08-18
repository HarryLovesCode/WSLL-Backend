# WSLL Backend

This project is going to be the `npm` module responsible for controlling Windows Subsystem for Linux (WSL) called by the in-progress Electron front-end. Right now, the functionality is relatively basic.

- Download official `.appx` distributions.
- Unzip them to access root file system.
- Register them with a custom name and directory.
- Spawn a terminal within the distribution.

