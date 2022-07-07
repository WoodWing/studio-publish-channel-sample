import fs from 'fs';
import path from 'path';
import stream from 'stream';
import { promisify } from 'util';
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import MessageValidator from 'sns-validator';
import fetch from 'node-fetch';
import unzipper from 'unzipper';
import { ChannelMessage } from './model';

export const app = express();

const validator = new MessageValidator();

const snsMessageTypeHandlers = {
    SubscriptionConfirmation: handleSubscriptionConfirmation,
    Notification: handleNotification,
};

// Parse text/plain as json, as sent by sns
// See https://docs.aws.amazon.com/sns/latest/dg/sns-message-and-json-formats.html
app.use(bodyParser.json({ type: 'text/plain' }));

/**
 * Handles both subscription confirmation requests and publish notification messages
 */
app.post('/', async function (req: Request, res: Response) {
    if (!(await isValidSnsRequest(req, res))) {
        return;
    }
    const messageType = req.headers['x-amz-sns-message-type'] as keyof typeof snsMessageTypeHandlers;
    await snsMessageTypeHandlers[messageType](req, res);
});

/**
 * Validate that we received a correct AWS SNS request, either trying
 * to confirm the subscription or to send a notification.
 */
async function isValidSnsRequest(req: Request, res: Response) {
    const type = req.headers['x-amz-sns-message-type'];
    if (!type) {
        res.status(400).send('Header "x-amz-sns-message-type" not set');
        return false;
    }
    if (!Object.keys(snsMessageTypeHandlers).includes(type as string)) {
        res.status(400).send(
            `Unknown x-amz-sns-message-type "${type}". Supported types: ${Object.keys(snsMessageTypeHandlers).join(
                ', ',
            )}`,
        );
        return false;
    }
    if (type === 'SubscriptionConfirmation' && !req.body.SubscribeURL) {
        res.status(400).send('Expect SubscribeURL to be set in request body.');
        return false;
    }
    try {
        await promisify(validator.validate).call(validator, req.body);
    } catch (e) {
        res.status(400).send('Failed to validate the SNS message signature.');
        return false;
    }
    return true;
}

async function handleSubscriptionConfirmation(req: Request, res: Response) {
    await fetch(req.body.SubscribeURL);
    res.send();
    console.log(`Successfully handled subscription confirmation.`);
}

async function handleNotification(req: Request, res: Response) {
    // Immediately respond to let AWS know we received the notification correctly. We need to respond with the
    // AWS SNS timeout of 15 seconds in order to prevent AWS SNS from sending the message again.
    res.send();
    await downloadFiles(req.body);
    await postProcess();
}

/**
 * Download the SNS notification and related article files to disk
 */
async function downloadFiles(snsNotification: any) {
    const message: ChannelMessage = JSON.parse(snsNotification.Message);
    const filesFolder = await createFilesFolder(message.name);
    await fs.promises.mkdir(filesFolder, { recursive: true });
    await fs.promises.writeFile(
        path.join(filesFolder, 'sns-publish-notification.json'),
        JSON.stringify(snsNotification, null, 2),
    );
    await fs.promises.writeFile(path.join(filesFolder, 'channel-message.json'), JSON.stringify(message, null, 2));
    if (message.articleJsonUrl) {
        await downloadFile(message.articleJsonUrl, path.join(filesFolder, 'article.json'));
    }
    await downloadFile(message.metadataUrl, path.join(filesFolder, 'metadata.json'));
    await downloadFile(message.componentSetInfo.url, path.join(filesFolder, 'component-set-info.json'));
    await downloadAndUnZip(message.url, path.join(filesFolder, 'article-files-package'));
    if (message.customData) {
        await downloadAndUnZip(message.customData.url, path.join(filesFolder, 'custom-data'));
    }
    console.log(`Successfully downloaded article "${message.name}" to: ${filesFolder}`);
}

/**
 * Perform any post processing of an article rendition and upload to a destination channel platform (CMS, App, etc).
 */
async function postProcess() {}

async function createFilesFolder(articleName: string) {
    const formattedDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60 * 1000)
        .toISOString()
        .replaceAll(':', '_');
    const filesFolder = path.resolve('articles', `${formattedDate} - ${articleName}`);
    await fs.promises.mkdir(filesFolder, { recursive: true });
    return filesFolder;
}

async function fetchFileData(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Unable to download ${url}: ${response.statusText}`);
    }
    return response.body;
}

async function downloadFile(url: string, destination: string) {
    await stream.promises.pipeline(await fetchFileData(url), fs.createWriteStream(destination));
}

async function downloadAndUnZip(url: string, destination: string) {
    await stream.promises.pipeline(await fetchFileData(url), unzipper.Extract({ path: destination }));
}
