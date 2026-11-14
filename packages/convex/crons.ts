import {cronJobs} from "convex/server";
import {internal} from "./_generated/api";

const crons = cronJobs();

// 10:00 CET / 11:00 CEST. Wysyłka obejmuje wyłącznie osoby, które włączyły push.
crons.daily("promotion-highlights", {hourUTC: 9, minuteUTC: 0}, internal.notifications.sendPromotionHighlights);
crons.daily("promotion-newsletter", {hourUTC: 9, minuteUTC: 10}, internal.notifications.sendPromotionNewsletter);

export default crons;
