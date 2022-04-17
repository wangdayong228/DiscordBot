const { Client, RichEmbed, Discord } = require('discord.js');
const ethers = require('ethers');
const client = new Client;
const settings = require('./settings.json');

client.on('ready', () => {
    console.log(`${client.user.tag} 準備好上戰場惹！`);
});

client.on('message', async (msg) => {
    if (msg.content.startsWith(settings.prefix + 'test')) {
        msg.channel.send('test committed');
    }
    if (msg.content.startsWith(settings.prefix + 'faucet')) {
        let addr = msg.content.substring((settings.prefix + 'faucet').length + 1);
        if (!ethers.utils.isAddress(addr)) {
            msg.channel.send('please input a valid address');
            return
        }
        let txhash = await sendCFX(addr);
        let link = `https://evm.confluxscan.net/tx/${txhash}`
        msg.channel.send(`sent ${settings.faucet_amount} CFX to ${addr}, please check by ${link}`);
    }
});

client.login(settings.token);


async function sendCFX(addr) {
    let provider = new ethers.providers.JsonRpcProvider(settings.rpc_url);
    let wallet = new ethers.Wallet(settings.faucet_key, provider);
    let tx = await wallet.sendTransaction({
        to: addr,
        value: ethers.utils.parseEther(settings.faucet_amount.toString())
    });
    console.log(tx);
    return tx.hash
}