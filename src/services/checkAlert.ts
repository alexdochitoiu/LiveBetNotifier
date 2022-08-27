import { IAlert } from "../models/user";
import { IEventsStats } from "./saveEventsStats";

export const checkAlert = (event: IEventsStats, userAlerts: IAlert[]) => {
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
