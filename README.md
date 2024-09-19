# RTMPS Music Streaming Server with Node.js

![Screenshot](src/assets/cover.jpg)

This project is a simple for RTMPS streams music using Node.js. The bot fetches and streams `.mp3` files from a directory on the server to users on RTMPS.

## Prerequisites

Ensure `ffmpeg` is installed on your server. You can install `ffmpeg` with the following commands:

**On Ubuntu:**

  ```bash
  sudo apt update
  sudo apt install ffmpeg
  ```

**On CentOS:**

```bash
  sudo yum install epel-release
  sudo yum install ffmpeg
  ```

## Installation
- Clone this repository:
  ```bash
  git clone https://github.com/habibi-dev/nodejs-music-stream.git
  cd nodejs-music-stream
  ```
- Install the required dependencies:
  ```bash
  npm install
  ```
- Copy the .env.example file to .env and update the environment variables:
  ```bash
  cp .env.example .env
  ```
  - In the .env file, set the value of DIR to the absolute path of the directory containing your .mp3 files. Make sure this folder only contains .mp3 files.
- Run the bot:
  ```bash 
  npm start
  ```

## Environment Variables
- ```STREAM_KEY:``` Your STREAM_KEY in Channel.
- ```SERVER_URL:``` Your SERVER_URL in Channel.
- ```DIR:``` The full path to the directory containing only .mp3 files.
- ```COVER:``` The COVER image must have a size of 1280x720


