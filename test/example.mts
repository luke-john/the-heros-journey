import {
  postProcessJourneyTraceHelper,
  TraceEvent,
} from "../src/postProcessJourneyTraceHelper.mjs";
import { runJourney } from "../src/run-scripts.mjs";

runJourney({
  journeyInputKey: "commit",
  inputs: [
    { commit: "b4858938837dd6a04e289c244d9134ca624f1bd7" },
    { commit: "604bb7d32dfa87bc10e18093e7b903ce7ae19a65" },
  ],
  browsersToRunOn: ["chromium", "firefox"],
  // playwrightLaunchOptions: { headless: false },
  // diffOptions: { traceDir: `${process.cwd()}/traced` },
  async journey({ page, input: { commit } }) {
    await page.goto(`http://localhost:5173/?commit=${commit}`);

    // await page.pause();
    await page.locator("textarea").click();

    await page.keyboard.type("Hello");

    return { commit };
  },
  postProcessJourneyTrace: postProcessJourneyTraceHelper(async (props) => {
    for (const traceEvent of props.traceEvents) {
      const eventDetail = getEventDetail(traceEvent);
      console.log(eventDetail);
    }
  }),
});

function getEventDetail(traceEvent: TraceEvent) {
  switch (traceEvent.type) {
    case "screencast-frame":
      return { pageId: traceEvent.pageId };
  }
  return undefined;
}
