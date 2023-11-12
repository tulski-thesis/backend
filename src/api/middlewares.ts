import {MiddlewaresConfig} from "@medusajs/medusa";
import {botDetectionMiddleware} from "./bot-detection-middleware";

export const config: MiddlewaresConfig = {
    routes: [
        {
            matcher: "/store/*",
            method: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            middlewares: [botDetectionMiddleware],
        },
    ],
}
