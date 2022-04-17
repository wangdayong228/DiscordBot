const { Client, RichEmbed, Discord } = require('discord.js');
const ethers = require('ethers');
const dotenv = require('dotenv')
const fs = require('fs');
const settings = require('./settings.json');
const env = process.env;
dotenv.config()
// console.log(env.faucet_key)


const client = new Client;
let { provider, faucted, wallet } = init();

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
            msg.channel.send('Please input a valid address');
            return
        }

        console.log("fauceted", faucted, `faucted[${addr}]`, faucted[addr])
        if (faucted[addr]) {
            msg.channel.send('Every address can only be fauceted once');
            return
        }

        // check balance
        if (!await checkBalance()) {
            msg.channel.send('Not enough balance, please try again later');
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
            msg.channel.send(`Faucet failed, please try again later`);
        }

    }
});

client.login(settings.token);


function init() {
    let provider = new ethers.providers.JsonRpcProvider(settings.rpc_url);
    let wallet = new ethers.Wallet(env.faucet_key, provider);

    if (!fs.existsSync('./fauceted')) {
        fs.writeFileSync('./fauceted', '');
    }
    let faucted = fs.readFileSync('./fauceted').toString();

    let map = {};
    faucted.split('\n').forEach(line => {
        map[line.trim()] = true;
    });
    faucted = map

    return { provider, wallet, faucted };
}

async function checkBalance() {
    let need = ethers.utils.parseEther(settings.faucet_amount.toString())
    need = need.add(ethers.BigNumber.from(21000) * ethers.BigNumber.from(5e9))
    const has = await wallet.getBalance();
    return has.gt(need)
}

async function sendCFX(addr) {
    let tx = await wallet.sendTransaction({
        to: addr,
        value: ethers.utils.parseEther(settings.faucet_amount.toString())
    });
    console.log(tx);
    return tx.hash
}