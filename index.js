const axios = require('axios');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');
const moment = require('moment');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

(async () => {
    const chalk = (await import('chalk')).default;

    const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    const proxies = fs.readFileSync('proxies.txt', 'utf8').split('\n').map(line => line.trim());
    const vanities = fs.readFileSync('vanity.txt', 'utf8').split(/\r?\n/);

    const getTimeStamp = () => moment().format('HH:mm:ss');

    const logMessage = (message) => {
        console.log(chalk.blue(`UNDESYNC | [${getTimeStamp()}] | ${message}`));
    };

    logMessage(`Loaded ${vanities.length} vanities ${proxies.length} proxies`);

    const getProxy = () => proxies[Math.floor(Math.random() * proxies.length)];

    const proxyAgent = config.proxy.enable ? new HttpsProxyAgent(`http://${getProxy()}`) : null;

    logMessage(`Using proxy ${proxyAgent ? 'enabled' : 'disabled'}`);

    const checkVanity = async (vanity) => {
        try {
            await sleep(1000);
            const response = await axios.get(`https://canary.discord.com/api/v10/invites/${vanity}`, {
                httpAgent: proxyAgent,
                httpsAgent: proxyAgent
            });

            logMessage(`${vanity} | Invalid`);
            if (config.saves.enable && config.saves.invalids) {
                fs.appendFileSync('Invalids.txt', `${vanity}\n`);
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.code === 10006) {
                logMessage(`${vanity} | Valid`);
                if (config.saves.enable && config.saves.valids) {
                    fs.appendFileSync('Valids.txt', `${vanity}\n`);
                }
            } else {
                logMessage(`Error checking vanity ${vanity}: ${error.response ? error.response.data : error.message}`);
            }
        }
    };

    for (const vanity of vanities) {
        await checkVanity(vanity);
    }
})();