# Render Deployment Configuration for Celestial Token Bot

## Environment Variables Required

The following environment variables must be configured in the Render Web Service dashboard:

```
TELEGRAM_BOT_TOKEN=<your-bot-token-from-@BotFather>
ETHERSCAN_API_KEY=<your-api-key-from-etherscan.io>
NODE_ENV=production
```

Render automatically provides `PORT` — do not manually set it.

## Render Web Service Settings

| Setting | Value |
|---------|-------|
| Name | celestial-token-bot |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Root Directory | (leave blank) |
| Branch | main |
| Auto-Deploy | Enabled |
| Region | (choose closest to your users) |
| Plan | Free or Paid |

## Deploy Hook URL

1. After creating the Web Service in Render
2. Go to **Settings → Deploy Hook**
3. Copy the URL
4. Add to GitHub Secrets as `RENDER_DEPLOY_HOOK_URL`

## Health Check

Your bot exposes a health check endpoint:
- **GET /** → "Bot running"

This is useful for monitoring. Render's default health checks should work automatically.

## Logs and Monitoring

Monitor your bot in real-time:
1. Open your Render service dashboard
2. Click **Logs** to see bot output
3. Check for errors in TELEGRAM_BOT_TOKEN or ETHERSCAN_API_KEY

## Restart Bot

To manually restart the bot:
1. Go to Render service → **Settings**
2. Click **Restart Service**

## Deployment Flow

Every push to `main` triggers:
1. GitHub Actions syntax check
2. Environment variable validation
3. Auto-deploy to Render (if webhook is configured)
4. Bot restarts with latest code

## Troubleshooting

**Bot not running?**
- Check Render logs for errors
- Verify `TELEGRAM_BOT_TOKEN` and `ETHERSCAN_API_KEY` are set in Render
- Confirm GitHub Secrets are synced to Render

**Deployment not triggering?**
- Ensure `RENDER_DEPLOY_HOOK_URL` is in GitHub Secrets
- Check GitHub Actions tab for workflow errors
- Verify `main` branch protection rules allow deployments

**Bot not responding to Telegram commands?**
- Confirm bot token is correct
- Check Render logs for polling errors
- Test `/start` command in Telegram
