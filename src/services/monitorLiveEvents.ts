import saveEventsStats from "./saveEventsStats";

export default async function monitorLiveEvents() {
  let lastSetTimeoutId = null;
  try {
    console.log("[INFO]: Monitoring live matches ... ");
    await saveEventsStats();
    // console.log(eventsStats);
    // const users = await User.find({
    //   active: true,
    // }).exec();
    // await Promise.all(
    //   users.map(async (u) => {
    //     const notified = (
    //       await Promise.all(
    //         eventsStats.map(async (e) => {
    //           if (u.subscription && checkAlert(e, u.alerts)) {
    //             const payload = {
    //               url: `https://www.flashscore.com/match/${e.matchInfo.id}/#/match-summary/match-statistics/0`,
    //               title: `Match: ${e.matchInfo.homeTeam} - ${e.matchInfo.awayTeam}`,
    //               body: `Live bet alert: ${e.matchInfo.status}' (${e.matchInfo.liveScore})`,
    //             };
    //             if (u.notified.indexOf(e.matchInfo.id) === -1) {
    //               const result = await webpush.sendNotification(
    //                 u.subscription,
    //                 JSON.stringify(payload)
    //               );
    //               if (result.statusCode == 201) {
    //                 return e.matchInfo.id;
    //               }
    //             }
    //           }
    //         })
    //       )
    //     ).filter((n) => Boolean(n));
    //     await User.updateOne(
    //       { username: u.username },
    //       { notified: [...u.notified, ...notified] }
    //     );
    //   })
    // );
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
