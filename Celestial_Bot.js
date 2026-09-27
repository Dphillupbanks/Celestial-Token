const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

const app = express();
app.get('/', (req, res) => res.send('Bot running'));

// Load and validate required environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
}
if (!ETHERSCAN_API_KEY) {
  throw new Error('ETHERSCAN_API_KEY environment variable is required');
}

const WALLET_ADDRESS = '0x612aB0d44E258170D0888779207eF68318D4caC9';
const ETHERSCAN_API_BASE = 'https://api.etherscan.io/v2/api';

/**
 * Fetch ERC-20 token transactions for the Celestial Token wallet from Etherscan.
 * @returns {Promise<Array>} Array of token transfer objects
 */
async function fetchTokenTransactions() {
  const url = `${ETHERSCAN_API_BASE}?chainid=1&module=account&action=tokentx` +
    `&address=${WALLET_ADDRESS}&startblock=0&endblock=99999999&sort=desc` +
    `&apikey=${ETHERSCAN_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  // Etherscan may return status '0' with message 'No transactions found' and an empty result
  // to indicate a normal "no data" condition. Treat that as an empty list instead of error.
  if (data.status !== '1') {
    const message = (data.message || '').toString();
    const noTxs =
      message.toLowerCase() === 'no transactions found' &&
      (data.result == null || (Array.isArray(data.result) && data.result.length === 0));

    if (noTxs) {
      return [];
    }

    throw new Error(message || 'Etherscan API error');
  }

  return data.result || [];
}

/**
 * Format a token transaction for display.
 * Safely handles missing or invalid token decimal values.
 * @param {Object} tx - Transaction object from Etherscan
 * @returns {string} Formatted transaction string
 */
function formatTransaction(tx) {
  try {
    const tokenSymbol = tx.tokenSymbol || 'UNKNOWN';
    const fromAddress = tx.from ? tx.from.slice(0, 8) : 'unknown';
    const blockNumber = tx.blockNumber || 'N/A';
    
    // Safely parse token decimals; default to 18 if missing
    let decimals = 18;
    if (tx.tokenDecimal != null && tx.tokenDecimal !== '') {
      decimals = parseInt(tx.tokenDecimal, 10);
      if (isNaN(decimals)) {
        decimals = 18;
      }
    }
    
    // Safely parse value; handle edge cases
    let value = '0';
    if (tx.value != null && tx.value !== '') {
      try {
        const divisor = BigInt(10) ** BigInt(decimals);
        value = (BigInt(tx.value) / divisor).toString();
      } catch (e) {
        value = tx.value; // Fallback to raw value if BigInt fails
      }
    }
    
    return `${tokenSymbol}: ${value} from ${fromAddress}... (block ${blockNumber})`;
  } catch (err) {
    return `Error formatting transaction: ${err.message}`;
  }
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

/**
 * /start command - Display bot welcome message and wallet info
 */
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `Greetings! You're in Celestial Deposits.\n` +
    `Wallet: ${WALLET_ADDRESS}\n` +
    `Celestial Token: 1,000,000 locked\n` +
    `Type /rank for status\n` +
    `Type /transactions to view recent token transfers`
  );
});

/**
 * /rank command - Display user rank and charity info
 */
bot.onText(/\/rank/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `Captain rank.\n3 kids fed.\nBeach cleanup done.\nCharity pool: 0.5% every spin. Keep winning.`
  );
});

/**
 * /transactions command - Fetch and display recent token transactions
 */
bot.onText(/\/transactions/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Fetching recent token transactions...');

  try {
    const txs = await fetchTokenTransactions();
    const recent = txs.slice(0, 5);

    if (recent.length === 0) {
      bot.sendMessage(chatId, 'No transactions found.');
      return;
    }

    const lines = recent.map(formatTransaction);
    bot.sendMessage(chatId, `Recent transactions:\n${lines.join('\n')}`);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    bot.sendMessage(chatId, `Error fetching transactions: ${err.message}`);
  }
});

// Error handler for bot polling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code, error.message);
});

app.listen(process.env.PORT || 3000, () => console.log('Bot server up'));
