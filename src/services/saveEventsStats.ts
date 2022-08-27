import puppeteer from "puppeteer";
import User from "../models/user";
import { querySelector } from "../utils";
import sendNotification from "./sendNotification";

const url = "https://www.flashscore.com/";

export interface IEventsStats {
  matchInfo: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    liveScore: string;
    status: string;
  };
  stats: { [key: string]: [string, string] };
}

export default async function saveEventsStats(): Promise<IEventsStats[]> {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  let page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
  await page.waitForSelector("div.leagues--live", {
    visible: true,
    timeout: 0,
  });
  const [liveButton] = await page.$x(
    `//*[@id="live-table"]/div[1]/div[1]/div[2]`
  );
  if (!liveButton) {
    await browser.close();
    return [];
  }
  await liveButton.click();
  const mainHtml = await page.content();
  const liveTable = querySelector(
    mainHtml,
    "div.leagues--live div.sportName.soccer"
  );

  const liveEventsHtml = liveTable?.childNodes.filter(
    (el) =>
      el.classNames.includes("event__match--live") &&
      el.childNodes.find((el2) => el2.classNames.includes("lineup-ico"))
  );
  if (!liveEventsHtml) {
    return [];
  }
  let events: IEventsStats[] = liveEventsHtml
    .map((el) => {
      const id = el.id.replace("g_1_", "");
      const homeTeam = el.childNodes
        .find((x) => x.classNames.includes("event__participant--home"))
        ?.text!.trim()!;
      const awayTeam = el.childNodes
        .find((x) => x.classNames.includes("event__participant--away"))
        ?.text!.trim()!;
      const homeScore = el.childNodes
        .find((x) => x.classNames.includes("event__score--home"))
        ?.text!.trim()!;
      const awayScore = el.childNodes
        .find((x) => x.classNames.includes("event__score--away"))
        ?.text!.trim()!;
      const status =
        el.childNodes
          .find((x) => x.classNames.includes("event__stage"))
          ?.text!.trim() || "";
      return {
        matchInfo: {
          id,
          homeTeam,
          awayTeam,
          liveScore: `${homeScore} - ${awayScore}`,
          status,
        },
        stats: {},
      };
    })
    .filter((e) => e.matchInfo.status !== "Finished");
  console.log(`[INFO]: Extracted ${events.length + 1} matches`);
  await page.close();
  for (const event of events) {
    page = await browser.newPage();
    const matchStatisticsUrl = `https://www.flashscore.com/match/${event.matchInfo.id}/#/match-summary/match-statistics/0`;
    await page.goto(matchStatisticsUrl, {
      waitUntil: "networkidle2",
      timeout: 0,
    });
    await page.waitForSelector("#detail > .tabs", {
      visible: true,
      timeout: 0,
    });
    const eventHtml = await page.content();
    const parsedEventHtml = querySelector(eventHtml, "#detail");
    const tabs = parsedEventHtml?.childNodes.find((el) =>
      el.classNames.includes("tabs__detail--nav")
    )?.childNodes[0].childNodes[0];
    if (tabs?.rawText.toUpperCase().includes("STATISTICS")) {
      const statistics = parsedEventHtml?.childNodes.find((el) =>
        el.classNames.includes("section")
      )?.childNodes;
      const stats =
        statistics
          ?.filter((stat) => stat.classNames[0] === "stat__row")
          .map((stat) => {
            const [homeValue, categoryName, awayValue] =
              stat.childNodes[0]!.childNodes;
            return {
              categoryName: categoryName.text,
              homeValue: homeValue.text,
              awayValue: awayValue.text,
            };
          }) || [];
      event.stats = stats.reduce(
        (obj, item) =>
          Object.assign(obj, {
            [item.categoryName]: [item.homeValue, item.awayValue],
          }),
        {}
      );
      if (Object.entries(event.stats).length > 0) {
        const users = await User.find({
          active: true,
        }).exec();
        await Promise.all(
          users.map(async (u) => await sendNotification(event, u))
        );
      }
    }
    await page.close();
  }
  await browser.close();
  return events.filter((e) => Object.entries(e.stats).length > 0);
}
