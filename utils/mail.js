import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import env from "./env.js";
import { processLogger } from "./logger.js";

const oAuthClient = new OAuth2Client({
    clientId: env.GMAIL_CLIENT_ID,
    clientSecret: env.GMAIL_CLIENT_SECRET,
    redirectUri: env.GMAIL_REDIRECT_URI
})

oAuthClient.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });

let accessToken = null;
let lastFetchedToken = null;

async function getAccessToken(){
    if(lastFetchedToken && ((lastFetchedToken - Date.now()) < (59*60*1000))){
        return accessToken;
    } else {
        accessToken = await oAuthClient.getAccessToken();
        lastFetchedToken = Date.now();
        return accessToken;
    }
}

export async function sendBatchCompleteMail(to, jobId, archiveLink) {
    const accessToken = await getAccessToken();
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: env.GMAIL_USER,
            clientId: env.GMAIL_CLIENT_ID,
            clientSecret: env.GMAIL_CLIENT_SECRET,
            refreshToken: env.GMAIL_REFRESH_TOKEN,
            accessToken: accessToken
        }
    })

    return transporter.sendMail({
        to: to,
        from: `AlphaPDF <${env.GMAIL_USER}>`,
        subject: "PDF Job Processed",
        html: `<h1>JobId: ${jobId}</h1>
        <h1>Archive Link: <a href="${archiveLink}">${archiveLink}</a></h1>`,
    });
}


export async function sendRowMail(to, body, filePath) {
    processLogger.info(`Sending email to ${to}`);
    const accessToken = await getAccessToken();
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: env.GMAIL_USER,
            clientId: env.GMAIL_CLIENT_ID,
            clientSecret: env.GMAIL_CLIENT_SECRET,
            refreshToken: env.GMAIL_REFRESH_TOKEN,
            accessToken: accessToken
        }
    })

    return transporter.sendMail({
        to: to,
        from: `AlphaPDF <${env.GMAIL_USER}>`,
        subject: "ABC Health Insurance",
        html: body,
        attachments: [
            {
                filename: 'ABC Health Insurance.pdf',
                path: filePath
            }
        ]
    });
}

