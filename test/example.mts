import child_process from "node:child_process";

import { runJourney } from "../src/run-scripts.mjs";

runJourney({
  journeyInputKey: "commitHash",
  inputs: [{ commitHash: "7344103589a6" }],
  browsersToRunOn: ["chromium", "webkit"],
  // playwrightLaunchOptions: { headless: false },
  diffOptions: {
    artifactsDir: `${process.cwd()}/artifacts`,
    recordVideo: true,
  },
  async journey({ page, input: { commitHash }, annotate }) {
    await page.goto(
      `https://statlas.prod.atl-paas.net/atlassian-frontend/${commitHash}/examples.html?groupId=editor&packageId=editor-core&exampleId=kitchen-sink&mode=none`
    );

    // Click p:has-text("Type something here, and watch it render to the side!")
    await page.locator('[aria-label="Editable content"] p').click();
    // await page.pause();
    annotate("start");

    await page.keyboard.type("Hello ");
    await page.keyboard.type("/");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    annotate("end");

    return { commitHash };
  },
  async postProcessJourneyTrace(props) {
    console.log(
      "processing",
      props.journeyResult.recordingPath,
      props.journeyResult.artifactsFolder
    );
    const start = secondsToFFMPEGTimestamp(
      props.journeyResult.annotations.find(
        (annotation) => annotation.message === "start"
      )!.offset
    );
    const end = secondsToFFMPEGTimestamp(
      props.journeyResult.annotations.find(
        (annotation) => annotation.message === "end"
      )!.offset
    );
    console.log(start, end);

    child_process.execSync(
      `ffmpeg -i ${props.journeyResult.recordingPath} -ss ${start} -t ${end} -qscale 0 ${props.journeyResult.artifactsFolder}/output.gif`,
      { encoding: "utf8" }
    );
  },
});

function secondsToFFMPEGTimestamp(milliseconds: number) {
  const seconds = milliseconds / 1000;
  let hoursPart = Math.floor(seconds / 3600);
  let minutesPart = Math.floor((seconds - hoursPart * 3600) / 60);
  let secondsPart = seconds - hoursPart * 3600 - minutesPart * 60;

  return `${hoursPart.toString(10).padStart(2, "0")}:${minutesPart
    .toString(10)
    .padStart(2, "0")}:${secondsPart.toString(10).padStart(2, "0")}`;
}
