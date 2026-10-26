
import {v} from "convex/values";
import {internalAction} from "./_generated/server";

const SITE_HOST = "gotujto.com";
const SITE_URL = `https://${SITE_HOST}`;

export const submitUrls = internalAction({
    args: {
        urls: v.array(v.string()),
    },
    handler: async (_ctx, args) => {
        const key = process.env.INDEXNOW_KEY?.trim();

        if (!key) {
            console.error("IndexNow: brak konfiguracji INDEXNOW_KEY.");
            return {
                status: "missing_key",
                submittedCount: 0,
            };
        }

        const urls = [...new Set(args.urls)].filter(value => {
            try {
                const url = new URL(value);

                return (
                    url.protocol === "https:" &&
                    url.hostname === SITE_HOST
                );
            } catch {
                return false;
            }
        });

        if (urls.length === 0) {
            console.warn("IndexNow: brak prawidłowych adresów do zgłoszenia.");
            return {
                status: "no_valid_urls",
                submittedCount: 0,
            };
        }

        try {
            const response = await fetch(
                "https://api.indexnow.org/indexnow",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                    body: JSON.stringify({
                        host: SITE_HOST,
                        key,
                        keyLocation: `${SITE_URL}/${key}.txt`,
                        urlList: urls,
                    }),
                },
            );

            const responseBody = (
                await response.text()
            ).slice(0, 500);

            const result = {
                status: response.status,
                submittedCount: urls.length,
            };

            if (response.status === 200) {
                console.info("IndexNow: adresy przyjęte.", result);
            } else if (response.status === 202) {
                console.warn(
                    "IndexNow: przyjęto adresy, oczekiwanie na weryfikację klucza.",
                    result,
                );
            } else {
                console.error("IndexNow: zgłoszenie nie powiodło się.", {
                    ...result,
                    body: responseBody,
                });
            }

            return result;
        } catch (error) {
            console.error("IndexNow: błąd komunikacji.", error);

            return {
                status: "network_error",
                submittedCount: urls.length,
            };
        }
    },
});
