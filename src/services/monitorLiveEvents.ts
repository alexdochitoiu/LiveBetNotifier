import webpush from "web-push";
import User, { IAlert } from "../models/user";
import saveEventsStats, { IEventsStats } from "./saveEventsStats";

const checkAlert = (event: IEventsStats, userAlerts: IAlert[]) => {
  const validStats = userAlerts.map((a) => {
    if (a.category === "Minute") {
      const minute =
        event.matchInfo.status === "Half Time"
          ? 45
          : parseInt(event.matchInfo.status);
      const userMinute = parseInt(a.value);
      if (a.type === "Under or Equal") {
        return minute <= userMinute;
      } else {
        return minute > userMinute;
      }
    } else if (a.category === "Goals") {
      const [home, away] = event.matchInfo.liveScore
        .split(" - ")
        .map((s) => parseInt(s));

      const userGoals = parseInt(a.value);
      if (!a.team || a.team === "Any") {
        if (a.type === "Under or Equal") {
          return home + away <= userGoals;
        } else {
          return home + away > userGoals;
        }
      } else if (a.team === "Home Team") {
        if (a.type === "Under or Equal") {
          return home <= userGoals;
        } else {
          return home > userGoals;
        }
      } else {
        if (a.type === "Under or Equal") {
          return away <= userGoals;
        } else {
          return away > userGoals;
        }
      }
    } else {
      if (event.stats[a.category]) {
        const [homeValue, awayValue] = event.stats[a.category].map((x) =>
          parseInt(x)
        );
        console.log(homeValue);
        const userValue = parseInt(a.value);
        if (a.team === "Any") {
          if (a.type === "Under or Equal") {
            return homeValue <= userValue || awayValue <= userValue;
          } else {
            return homeValue > userValue || awayValue <= userValue;
          }
        }
        const value = a.team === "Home Team" ? homeValue : awayValue;
        if (a.type === "Under or Equal") {
          return value <= userValue;
        } else {
          return value > userValue;
        }
      }
      return false;
    }
  });
  return validStats.reduce((curr, acc) => curr && acc, true);
};

export default async function monitorLiveEvents() {
  console.log("Monitoring live matches ... ");
  const eventsStats = await saveEventsStats();
  console.log(eventsStats);
  const users = await User.find({ active: true }).exec();
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
  await monitorLiveEvents();
}
