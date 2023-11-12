import {Logger, MedusaNextFunction, MedusaRequest, MedusaResponse} from "@medusajs/medusa";

const BOT_ENABLED = process.env.BOT_ENABLED === 'true'
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3000'
const BOT_HEADER = process.env.BOT_HEADER || 'x-bot-id';

export const botDetectionMiddleware = async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction) => {

    const logger = req.scope.resolve<Logger>('logger')
    const botId = req.headers[BOT_HEADER];

    if (!BOT_ENABLED) {
        logger.debug(`Bot detection disabled. Skipping.`)
        next()
        return
    }

    logger.debug(`Verifying bot id: ${botId}`)
    if (!botId || typeof botId !== 'string') {
        logger.debug(`No bot id provided`)
        res.sendStatus(403)
        return
    }

    try {
        const result = await fetchBotResult(botId)
        const isBot = result.bot.result !== 'not_detected'
        if (isBot) {
            logger.debug(`Bot detected: ${botId}`)
            res.sendStatus(403)
            return
        }
    } catch (e) {
        logger.error(`Error fetching bot result: ${e}`)
        res.sendStatus(500)
    }

    next()
}

const fetchBotResult = async (botId: string): Promise<Result> => {
    const url = new URL(`/api/v1/verify/${botId}`, BOT_API_URL)
    const response = await fetch(url)
    return response.json()
}

interface Result {
    id: string;
    created_at: Date;
    bot: BotDetectionResult;
}

export interface BotDetectionResult {
    result: "not_detected" | "bad_bot" | "good_bot";
}
