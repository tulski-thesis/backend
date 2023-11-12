import {MiddlewaresConfig} from "@medusajs/medusa";
import {botDetectionMiddleware} from "./bot-detection-middleware";

export const config: MiddlewaresConfig = {
    routes: [
        {
            matcher: "/store/*",
            middlewares: [botDetectionMiddleware],
        },
    ],
}
