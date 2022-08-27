import webpush from "web-push";
import User, { IAlert } from "../models/user";
import saveEventsStats, { IEventsStats } from "./saveEventsStats";

const checkAlert = (event: IEventsStats, userAlerts: IAlert[]) => {
  if (userAlerts.length === 0) {
    return false;
  }
  const validStats = userAlerts.map((a) => {
    if (a.category === "Minute") {
      const minute =
        event.matchInfo.status === "Half Time"
          ? 45
          : parseInt(event.matchInfo.status);
      const userMinute = parseInt(a.value);
      if (a.type === "Under") {
        return minute <= userMinute;
      } else {
        return minute >= userMinute;
      }
    } else if (a.category === "Score") {
      const [hg, ag] = event.matchInfo.liveScore
        .split(" - ")
        .map((s) => parseInt(s));
      if (a.type === "Home Team Leads") {
        return hg > ag;
      } else if (a.type === "Away Team Leads") {
        return hg < ag;
      } else return hg === ag;
    } else {
      let homeValue = -1,
        awayValue = -1;
      if (a.category === "Goals") {
        [homeValue, awayValue] = event.matchInfo.liveScore
          .split(" - ")
          .map((s) => parseInt(s));
      } else if (event.stats[a.category]) {
        [homeValue, awayValue] = event.stats[a.category].map((x) =>
          parseInt(x)
        );
      }
      if (homeValue === -1 && awayValue === -1) {
        return false;
      }
      const userValue = parseInt(a.value);
      if (a.team === "Any") {
        if (a.type === "Under") {
          return homeValue <= userValue || awayValue <= userValue;
        } else {
          return homeValue >= userValue || awayValue >= userValue;
        }
      } else if (a.team === "Total") {
        if (a.type === "Under") {
          return homeValue + awayValue <= userValue;
        } else {
          return homeValue + awayValue >= userValue;
        }
      } else {
        const value = a.team === "Home Team" ? homeValue : awayValue;
        if (a.type === "Under") {
          return value <= userValue;
        } else {
          return value >= userValue;
        }
      }
    }
  });
  return validStats.reduce((curr, acc) => curr && acc, true);
};

export default async function monitorLiveEvents() {
  let lastSetTimeoutId = null;
  try {
    console.log("Monitoring live matches ... ");
    const eventsStats = await saveEventsStats();
    console.log(eventsStats);
    const users = await User.find({
      active: true,
    }).exec();
    await Promise.all(
      users.map(async (u) => {
        const notified = (
          await Promise.all(
            eventsStats.map(async (e) => {
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
                    return e.matchInfo.id;
                  }
                }
              }
            })
          )
        ).filter((n) => Boolean(n));
        await User.updateOne(
          { username: u.username },
          { notified: [...u.notified, ...notified] }
        );
      })
    );
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${used} MB`);
    lastSetTimeoutId = setTimeout(monitorLiveEvents, 5000);
  } catch (err) {
    console.error("[Error]:", err);
    if (lastSetTimeoutId) {
      clearTimeout(lastSetTimeoutId);
    }
  }
}
