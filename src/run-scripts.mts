import process from "node:process";
import fs from "node:fs";
import playwright from "playwright";

type BrowserKey = "chromium" | "firefox" | "webkit";

type JourneyResultFailure = {
  result: "failure";
  traceFilePath: string;
  failureReason: unknown;
  input: any;
  browserKey: BrowserKey;
  /**
   * Folder where artifacts from journey are stored.
   */
  artifactsFolder: string;
  /**
   * Guaranteed to be available when the journey is run with
   * diffOptions.recordVideo set to true.
   */
  recordingPath: string | undefined;
  annotations: Annotation[];
};
type JourneyResultSuccess = {
  result: "success";
  traceFilePath: string;
  input: any;
  browserKey: BrowserKey;
  /**
   * Folder where artifacts from journey are stored.
   */
  artifactsFolder: string;
  /**
   * Guaranteed to be available when the journey is run with
   * diffOptions.recordVideo set to true.
   */
  recordingPath: string | undefined;
  annotations: Annotation[];
};
export type JourneyResult = JourneyResultFailure | JourneyResultSuccess;

type Annotation = {
  /**
   * milliseconds following the start of the journey
   */
  offset: number;
  message: string;
};

export async function runJourney<
  JourneyInputKey extends string,
  JourneyInput extends { [key in JourneyInputKey]: string }
>({
  journeyInputKey,
  inputs,
  browsersToRunOn,
  playwrightLaunchOptions,
  diffOptions,
  journey,
  postProcessJourneyTrace,
}: {
  /**
   * This is used to create a unique filename for the trace,
   * it needs to be a key on the JourneyInput (inputs) that
   * has a string value.
   */
  journeyInputKey: JourneyInputKey;
  /**
   * A series of inputs to run the journey with, for each input
   * the journey will be run on each browser defined in `browsersToRunOn`.
   */
  inputs: JourneyInput[];
  /**
   * A set of browsers to run the journeys on.
   */
  browsersToRunOn: BrowserKey[];
  /**
   * These options will be passed to playwright on startup.
   */
  playwrightLaunchOptions?: playwright.LaunchOptions;
  /**
   * Options for the diff.
   */
  diffOptions?: {
    /**
     * Directory to store artifacts such as traces and video recordings in.
     *
     * @defualt process.cwd()
     */
    artifactsDir?: string;
    /**
     * Records a video of the main page, and saves to the trace folder.
     *
     * IMPORTANT: if your journey opens another page, you will need to manually manage the path.
     * This can be done by returning the result of `await page.video().path()` from your journey.
     */
    recordVideo?: boolean;
  };
  /**
   * Runs a journey and records a trace.
   *
   * @returns {object} metadata to be attached to the generated journey trace and available in the `postProcessJourneyTrace` method.
   */
  journey: ({
    page,
    input,
  }: {
    page: playwright.Page;
    input: JourneyInput;
    annotate: (annotationMessage: string) => void;
  }) => Promise<object>;
  /**
   * Optional step to process traces generated by the journey.
   *
   * ```ts
   * postProcessJourneyTrace: postProcessJourneyTraceHelper(async (props) => {
   *   for (const traceEvent of props.traceEvents) {
   *     // process trace event
   *   }
   * })
   * ```
   */
  postProcessJourneyTrace?: (props: {
    traceFilePath: string;
    input: JourneyInput;
    journeyResult: JourneyResult;
  }) => Promise<void>;
}) {
  let browsers: { [browserKey in BrowserKey]?: playwright.Browser } = {};

  let journeyResults: JourneyResult[] = [];

  const artifactsDir =
    diffOptions?.artifactsDir ?? `${process.cwd()}/artifacts`;

  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir);
  } else {
    fs.rmSync(artifactsDir, { recursive: true });
    fs.mkdirSync(artifactsDir);
  }

  for (const input of inputs) {
    for (const browserKey of browsersToRunOn) {
      browsers[browserKey] ??= await playwright[browserKey].launch(
        playwrightLaunchOptions
      );
      const journeyArtifactsFolder = `${artifactsDir}/${input[journeyInputKey]}-${browserKey}`;
      if (!fs.existsSync(journeyArtifactsFolder)) {
        fs.mkdirSync(journeyArtifactsFolder);
      }
      const traceFilePath = `${journeyArtifactsFolder}/trace.zip`;
      const shouldRecordVideo = diffOptions?.recordVideo ?? false;

      let journeyStartTime = Date.now();
      const context = await browsers[browserKey]!.newContext(
        shouldRecordVideo
          ? {
              recordVideo: {
                dir: journeyArtifactsFolder,
              },
            }
          : {}
      );

      await context.tracing.start({ screenshots: true, snapshots: true });

      const page = await context.newPage();

      let journeyResult: JourneyResult;

      const annotations: Annotation[] = [];

      function annotate(annotationMessage: string) {
        // From testing -- it seems the time needs this offset
        // unknown why -- or whether this will work on other environments.
        const unknownOffset = 200;
        annotations.push({
          offset: Date.now() - journeyStartTime - unknownOffset,
          message: annotationMessage,
        });
      }
      const recordingPath = `${journeyArtifactsFolder}/recording.webm`;

      try {
        await journey({
          page,
          input,
          annotate,
        });

        journeyResult = {
          result: "success",
          input,
          traceFilePath,
          browserKey,
          artifactsFolder: journeyArtifactsFolder,
          recordingPath,
          annotations,
        };
      } catch (err) {
        journeyResult = {
          result: "failure",
          input,
          failureReason: err,
          traceFilePath,
          browserKey,
          artifactsFolder: journeyArtifactsFolder,
          recordingPath,
          annotations,
        };
      }
      // Take a final screenshot so it's in the trace file
      await page.screenshot();
      await context.tracing.stop({
        path: traceFilePath,
      });
      await page.close();
      console.log("closed");
      await page.video()?.saveAs(recordingPath);
      await context.close();

      journeyResults.push(journeyResult);
    }
  }

  for (const activeBrowser of Object.keys(browsers)) {
    await browsers[activeBrowser as BrowserKey]!.close();
  }

  fs.writeFileSync(
    artifactsDir + "/journeys.json",
    JSON.stringify(journeyResults, null, 2)
  );

  if (postProcessJourneyTrace) {
    for (const journeyResult of journeyResults) {
      await postProcessJourneyTrace({
        traceFilePath: journeyResult.traceFilePath,
        input: journeyResult.input,
        journeyResult,
      });
    }
  }
}
