import {
  postProcessJourneyTraceHelper,
  TraceEvent,
} from "../src/postProcessJourneyTraceHelper.mjs";
import { runJourney } from "../src/run-scripts.mjs";

runJourney({
  journeyInputKey: "commitHash",
  inputs: [{ commitHash: "7344103589a6" }],
  browsersToRunOn: ["chromium", "firefox"],
  playwrightLaunchOptions: { headless: false },
  // diffOptions: { traceDir: `${process.cwd()}/traced` },
  async journey({ page, input: { commitHash } }) {
    await page.goto(
      `https://statlas.prod.atl-paas.net/atlassian-frontend/${commitHash}/examples.html?groupId=editor&packageId=editor-core&exampleId=kitchen-sink&mode=none`
    );

    // Click p:has-text("Type something here, and watch it render to the side!")
    await page.locator('[aria-label="Editable content"] p').click();
    console.log("1");

    await page.type('[aria-label="Editable content"] p', "Hello", {
      delay: 100,
    });
    console.log("2");

    await page.pause();

    return { commitHash };
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
