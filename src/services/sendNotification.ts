import webpush from "web-push";
import User, { IUserDocument } from "../models/user";
import { checkAlert } from "./checkAlert";
import { IEventsStats } from "./saveEventsStats";

export default async function sendNotification(
  e: IEventsStats,
  u: IUserDocument
) {
  if (u.subscription && checkAlert(e, u.alerts)) {
    const payload = {
      url: `https://www.flashscore.com/match/${e.matchInfo.id}/#/match-summary/match-statistics/0`,
      title: `Match: ${e.matchInfo.homeTeam} - ${e.matchInfo.awayTeam}`,
      body: `Live bet alert: ${e.matchInfo.status}' (${e.matchInfo.liveScore})`,
    };
    if (u.notified.indexOf(e.matchInfo.id) === -1) {
      const result = await webpush.sendNotification(
        u.subscription,
        JSON.stringify(payload)
      );
      if (result.statusCode == 201) {
        console.log(
          `[NOTIF]: Send notification to '${u.username}' (${e.matchInfo.status}' ${payload.title})`
        );
        await User.updateOne(
          { username: u.username },
          { notified: [...u.notified, e.matchInfo.id] }
        );
      }
    }
  }
}
