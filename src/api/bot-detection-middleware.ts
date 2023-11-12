import {Logger, MedusaNextFunction, MedusaRequest, MedusaResponse} from "@medusajs/medusa";

const BOT_ENABLED = process.env.BOT_ENABLED === 'true'
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3000'
const BOT_HEADER = process.env.BOT_HEADER || 'x-bot-id';

const cache = new Map<string, boolean>();

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
        const isBot = getCachedResult(botId) || await getFetchedResult(botId)
        if (isBot) {
            logger.debug(`Bot detected: ${botId}`)
            res.status(403).send({error: 'Bot detected'})
            return
        }
    } catch (e) {
        logger.error(`Error fetching bot result: ${e}`)
        res.sendStatus(500)
    }

    next()
}

const getCachedResult = (id: string) => cache.get(id)

const getFetchedResult = async (id: string) => {
    const result = await fetchBotResult(id)
    const isBot = result.bot.result !== 'not_detected'
    cache.set(id, isBot)
    return isBot
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
