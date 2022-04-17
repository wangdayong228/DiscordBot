const { Client, RichEmbed, Discord } = require('discord.js');
const ethers = require('ethers');
const dotenv = require('dotenv')
const fs = require('fs');
const settings = require('./settings.json');
const env = process.env;
dotenv.config()
console.log(env.faucet_key)


const client = new Client;
let { faucted } = init();

client.on('ready', () => {
    console.log(`${client.user.tag} 準備好上戰場惹！`);
});

client.on('message', async (msg) => {
    if (msg.content.startsWith(settings.prefix + 'test')) {
        msg.channel.send('test committed');
    }
    if (msg.content.startsWith(settings.prefix + 'faucet')) {
        let addr = msg.content.substring((settings.prefix + 'faucet').length + 1).trim().toLowerCase();
        if (!ethers.utils.isAddress(addr)) {
            msg.channel.send('please input a valid address');
            return
        }

        console.log("fauceted",faucted,`faucted[${addr}]`,faucted[addr])
        if (faucted[addr]) {
            msg.channel.send('every address can only be fauceted once');
            return
        }

        try {
            faucted[addr] = true
            msg.channel.send('address is valid, please wait a few seconds to receive CFX')
            let txhash = await sendCFX(addr);
            let link = `https://evm.confluxscan.net/tx/${txhash}`
            msg.channel.send(`Done! please check from ${link}`);
            fs.appendFileSync('./fauceted', addr + '\n');
        }
        catch (e) {
            faucted[addr] = false
        }

    }
});

client.login(settings.token);


function init() {
    if (!fs.existsSync('./fauceted')) {
        fs.writeFileSync('./fauceted', '');
    }
    let faucted = fs.readFileSync('./fauceted').toString();

    let map = {};
    faucted.split('\n').forEach(line => {
        map[line.trim()] = true;
    });

    return { faucted };
}

async function sendCFX(addr) {
    let provider = new ethers.providers.JsonRpcProvider(settings.rpc_url);
    let wallet = new ethers.Wallet(env.faucet_key, provider);
    let tx = await wallet.sendTransaction({
        to: addr,
        value: ethers.utils.parseEther(settings.faucet_amount.toString())
    });
    console.log(tx);
    return tx.hash
}