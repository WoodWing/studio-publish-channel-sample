# Studio publication channel endpoint sample

Sample app that runs a simple Node.js web server which consumes the AWS SNS publish messages triggered by Studio. When a publish message is received the article files are downloaded. This sample app shows how to properly handle SNS subscription and notification messages. It can be a starting point or inspiration for an integration between Studio and an actual destination channel (Web CMS, mobile App, etc).

## Configuration

Clone or download this repo. To develop and deploy the channel you need Node.js version 16 installed. It is recommended to install via [`nvm`](https://github.com/creationix/nvm) or [`nvm-windows`](https://github.com/coreybutler/nvm-windows).

### Install dependencies

```bash
npm install
```

### Run endpoint

Run with the default port (3000):

```bash
npm run start
```

Or run on a custom port:

```bash
PORT=8888 npm run start
```

### Put it online (ngrok)

Your endpoint need to be available to the internet, otherwise AWS cannot send messages to it. For a local development/test purposes you can use [ngrok](https://ngrok.com/) to achieve this.

You need to download ngrok and create an ngrok account. After that you can start the tunnel to your locally running endpoint:

```bash
ngrok http 3000
```

More information on how to use ngrok can be found in the [ngrok documentation](https://ngrok.com/docs).

### Channel installation

To actually use the channel you need to configure the channel as described in [Studio documentation](https://helpcenter.woodwing.com/hc/en-us/articles/360040134192--Configuring-Studio-for-publishing-to-a-custom-Publish-Channel)

The endpoint URL to use, is the URL created by ngrok, something like: `https://<random-number>.ngrok.io`.

All default options for the channel can be used.

## Usage

Publish one or multiple stories from Studio. After a few seconds the message will be handled by the running endpoint which will download the article files in the `articles` folder.
