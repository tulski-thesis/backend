import {Logger, MedusaNextFunction, MedusaRequest, MedusaResponse} from "@medusajs/medusa";

const BOT_ENABLED = process.env.BOT_ENABLED === 'true'
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3000'
const BOT_HEADER = process.env.BOT_HEADER || 'x-bot-id';

const cache = new Map<string, Promise<Result>>();

export const botDetectionMiddleware = async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction) => {
    if (req.method === 'OPTIONS') {
        next()
        return
    }

    const logger = req.scope.resolve<Logger>('logger')
    const botId = req.headers[BOT_HEADER];

    if (!BOT_ENABLED) {
        logger.debug(`Bot detection disabled. Skipping verification for id: ${botId}`)
        next()
        return
    }

    logger.debug(`Verifying id: ${botId}`)
    if (!botId || typeof botId !== 'string') {
        logger.debug(`No bot id provided: ${botId}, type: ${typeof botId}`)
        res.sendStatus(403)
        return
    }

    try {
        const isBot = await getResult(botId)
        if (isBot) {
            logger.debug(`Bot detected: ${botId}`)
            res.status(403).send({error: 'Bot detected'})
            return
        }
    } catch (e) {
        logger.error(`Error fetching bot result: ${e}`)
        res.sendStatus(500)
        return
    }

    next()
}

const getResult = async (id: string): Promise<boolean> => {
    const result = await cachePromises(id)
    return result.bot.result === 'bad_bot'
}

const cachePromises = async (id: string) => {
    const cachedPromise = cache.get(id)
    if (typeof cachedPromise !== 'undefined') {
        return cachedPromise
    }
    cache.set(id, fetchBotResult(id))
    return cache.get(id)
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
