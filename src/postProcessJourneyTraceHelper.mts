import jszip from "jszip";
import fs from "node:fs";

import type { JourneyResult } from "./run-scripts.mjs";

/**
 * TODO add types
 */
type Resource = unknown;

type TraceHelperProps<JourneyInput> = {
  traceEvents: TraceEvent[];
  networkEvents: ResourceSnapshotTraceEvent[];
  resources: Resource[];
  input: JourneyInput;
  journeyResult: JourneyResult;
};

export function postProcessJourneyTraceHelper<JourneyInput>(
  handler: (props: TraceHelperProps<JourneyInput>) => Promise<any>
) {
  async function postProcessJourneyTraceHandler({
    traceFilePath,
    input,
    journeyResult,
  }: {
    traceFilePath: string;
    input: JourneyInput;
    journeyResult: JourneyResult;
  }) {
    const zipFile = fs.readFileSync(traceFilePath);
    const zipObject = await jszip.loadAsync(zipFile);

    const traceTraceContents = await zipObject.files["trace.trace"]?.async(
      "string"
    )!;
    const traceNetworkContents = await zipObject.files["trace.trace"]?.async(
      "string"
    )!;

    await handler({
      traceEvents: getTraceEvents<TraceEvent>(traceTraceContents),
      networkEvents: getTraceEvents(traceNetworkContents),
      resources: [],
      input,
      journeyResult,
    });
  }
  return postProcessJourneyTraceHandler;
}

function getTraceEvents<TraceItem>(traceFileContents: string): TraceItem[] {
  const eventLines = traceFileContents.split("\n");

  let events = [];
  for (const eventLine of eventLines) {
    if (eventLine.trim() !== "") {
      events.push(JSON.parse(eventLine));
    }
  }

  return events;
}

// Trace types vendored from
// https://github.com/microsoft/playwright/blob/main/packages/trace/src/trace.ts
// In the upcoming version (v1.27) of playwright -- these may be available

/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export type Size = { width: number; height: number };

// Make sure you add _modernize_N_to_N1(event: any) to traceModel.ts.
export type VERSION = 3;

export type BrowserContextEventOptions = {
  viewport?: Size;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  userAgent?: string;
};

export type ContextCreatedTraceEvent = {
  version: number;
  type: "context-options";
  browserName: string;
  platform: string;
  wallTime: number;
  title?: string;
  options: BrowserContextEventOptions;
};

export type ScreencastFrameTraceEvent = {
  type: "screencast-frame";
  pageId: string;
  sha1: string;
  width: number;
  height: number;
  timestamp: number;
};

export type ActionTraceEvent = {
  type: "action" | "event";
  metadata: CallMetadata;
};

export type ResourceSnapshotTraceEvent = {
  type: "resource-snapshot";
  snapshot: ResourceSnapshot;
};

export type FrameSnapshotTraceEvent = {
  type: "frame-snapshot";
  snapshot: FrameSnapshot;
};

export type TraceEvent =
  | ContextCreatedTraceEvent
  | ScreencastFrameTraceEvent
  | ActionTraceEvent
  | ResourceSnapshotTraceEvent
  | FrameSnapshotTraceEvent;

/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export type ResourceSnapshot = HAREntry;

export type NodeSnapshot =
  // Text node.
  | string
  // Subtree reference, "x snapshots ago, node #y". Could point to a text node.
  // Only nodes that are not references are counted, starting from zero, using post-order traversal.
  | [[number, number]]
  // Just node name.
  | [string]
  // Node name, attributes, child nodes.
  // Unfortunately, we cannot make this type definition recursive, therefore "any".
  | [string, { [attr: string]: string }, ...any];

export type ResourceOverride = {
  url: string;
  sha1?: string;
  ref?: number;
};

export type FrameSnapshot = {
  snapshotName?: string;
  pageId: string;
  frameId: string;
  frameUrl: string;
  timestamp: number;
  collectionTime: number;
  doctype?: string;
  html: NodeSnapshot;
  resourceOverrides: ResourceOverride[];
  viewport: { width: number; height: number };
  isMainFrame: boolean;
};

export type RenderedFrameSnapshot = {
  html: string;
  pageId: string;
  frameId: string;
  index: number;
};

/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// see http://www.softwareishard.com/blog/har-12-spec/
export type HARFile = {
  log: Log;
};

export type Log = {
  version: string;
  creator: Creator;
  browser?: Browser;
  pages?: Page[];
  entries: HAREntry[];
  comment?: string;
};

export type Creator = {
  name: string;
  version: string;
  comment?: string;
};

export type Browser = {
  name: string;
  version: string;
  comment?: string;
};

export type Page = {
  startedDateTime: Date;
  id: string;
  title: string;
  pageTimings: PageTimings;
  comment?: string;
};

export type PageTimings = {
  onContentLoad?: number;
  onLoad?: number;
  comment?: string;
};

export type HAREntry = {
  pageref?: string;
  startedDateTime: Date;
  time: number;
  request: Request;
  response: Response;
  cache: Cache;
  timings: Timings;
  serverIPAddress?: string;
  connection?: string;
  _frameref?: string;
  _monotonicTime?: number;
  _serverPort?: number;
  _securityDetails?: SecurityDetails;
};

export type Request = {
  method: string;
  url: string;
  httpVersion: string;
  cookies: Cookie[];
  headers: Header[];
  queryString: QueryParameter[];
  postData?: PostData;
  headersSize: number;
  bodySize: number;
  comment?: string;
};

export type Response = {
  status: number;
  statusText: string;
  httpVersion: string;
  cookies: Cookie[];
  headers: Header[];
  content: Content;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
  comment?: string;
  _transferSize?: number;
  _failureText?: string;
};

export type Cookie = {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
  comment?: string;
};

export type Header = {
  name: string;
  value: string;
  comment?: string;
};

export type QueryParameter = {
  name: string;
  value: string;
  comment?: string;
};

export type PostData = {
  mimeType: string;
  params: Param[];
  text: string;
  comment?: string;
  _sha1?: string;
  _file?: string;
};

export type Param = {
  name: string;
  value?: string;
  fileName?: string;
  contentType?: string;
  comment?: string;
};

export type Content = {
  size: number;
  compression?: number;
  mimeType: string;
  text?: string;
  encoding?: string;
  comment?: string;
  _sha1?: string;
  _file?: string;
};

export type Cache = {
  beforeRequest?: CacheState | null;
  afterRequest?: CacheState | null;
  comment?: string;
};

export type CacheState = {
  expires?: string;
  lastAccess: string;
  eTag: string;
  hitCount: number;
  comment?: string;
};

export type Timings = {
  blocked?: number;
  dns?: number;
  connect?: number;
  send: number;
  wait: number;
  receive: number;
  ssl?: number;
  comment?: string;
};

/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export type CallMetadata = {
  id: string;
  wallTime: number;
  startTime: number;
  endTime: number;
  pauseStartTime?: number;
  pauseEndTime?: number;
  type: string;
  method: string;
  params: any;
  apiName?: string;
  // Client is making an internal call that should not show up in
  // the inspector or trace.
  internal?: boolean;
  // Service-side is making a call to itself, this metadata does not go
  // through the dispatcher, so is always excluded from inspector / tracing.
  isServerSide?: boolean;
  stack?: StackFrame[];
  log: string[];
  afterSnapshot?: string;
  snapshots: { title: string; snapshotName: string }[];
  error?: SerializedError;
  result?: any;
  point?: Point;
  objectId?: string;
  pageId?: string;
  frameId?: string;
};

/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// This file is generated by generate_channels.js, do not edit manually.

export type Binary = Buffer;

export interface Channel {}

// ----------- Initializer Traits -----------
export type InitializerTraits<T> = T extends JsonPipeChannel
  ? JsonPipeInitializer
  : T extends AndroidDeviceChannel
  ? AndroidDeviceInitializer
  : T extends AndroidSocketChannel
  ? AndroidSocketInitializer
  : T extends AndroidChannel
  ? AndroidInitializer
  : T extends ElectronApplicationChannel
  ? ElectronApplicationInitializer
  : T extends ElectronChannel
  ? ElectronInitializer
  : T extends CDPSessionChannel
  ? CDPSessionInitializer
  : T extends WritableStreamChannel
  ? WritableStreamInitializer
  : T extends StreamChannel
  ? StreamInitializer
  : T extends ArtifactChannel
  ? ArtifactInitializer
  : T extends TracingChannel
  ? TracingInitializer
  : T extends DialogChannel
  ? DialogInitializer
  : T extends BindingCallChannel
  ? BindingCallInitializer
  : T extends ConsoleMessageChannel
  ? ConsoleMessageInitializer
  : T extends WebSocketChannel
  ? WebSocketInitializer
  : T extends ResponseChannel
  ? ResponseInitializer
  : T extends RouteChannel
  ? RouteInitializer
  : T extends RequestChannel
  ? RequestInitializer
  : T extends ElementHandleChannel
  ? ElementHandleInitializer
  : T extends JSHandleChannel
  ? JSHandleInitializer
  : T extends WorkerChannel
  ? WorkerInitializer
  : T extends FrameChannel
  ? FrameInitializer
  : T extends PageChannel
  ? PageInitializer
  : T extends BrowserContextChannel
  ? BrowserContextInitializer
  : T extends EventTargetChannel
  ? EventTargetInitializer
  : T extends BrowserChannel
  ? BrowserInitializer
  : T extends BrowserTypeChannel
  ? BrowserTypeInitializer
  : T extends SelectorsChannel
  ? SelectorsInitializer
  : T extends SocksSupportChannel
  ? SocksSupportInitializer
  : T extends DebugControllerChannel
  ? DebugControllerInitializer
  : T extends PlaywrightChannel
  ? PlaywrightInitializer
  : T extends RootChannel
  ? RootInitializer
  : T extends LocalUtilsChannel
  ? LocalUtilsInitializer
  : T extends APIRequestContextChannel
  ? APIRequestContextInitializer
  : object;

// ----------- Event Traits -----------
export type EventsTraits<T> = T extends JsonPipeChannel
  ? JsonPipeEvents
  : T extends AndroidDeviceChannel
  ? AndroidDeviceEvents
  : T extends AndroidSocketChannel
  ? AndroidSocketEvents
  : T extends AndroidChannel
  ? AndroidEvents
  : T extends ElectronApplicationChannel
  ? ElectronApplicationEvents
  : T extends ElectronChannel
  ? ElectronEvents
  : T extends CDPSessionChannel
  ? CDPSessionEvents
  : T extends WritableStreamChannel
  ? WritableStreamEvents
  : T extends StreamChannel
  ? StreamEvents
  : T extends ArtifactChannel
  ? ArtifactEvents
  : T extends TracingChannel
  ? TracingEvents
  : T extends DialogChannel
  ? DialogEvents
  : T extends BindingCallChannel
  ? BindingCallEvents
  : T extends ConsoleMessageChannel
  ? ConsoleMessageEvents
  : T extends WebSocketChannel
  ? WebSocketEvents
  : T extends ResponseChannel
  ? ResponseEvents
  : T extends RouteChannel
  ? RouteEvents
  : T extends RequestChannel
  ? RequestEvents
  : T extends ElementHandleChannel
  ? ElementHandleEvents
  : T extends JSHandleChannel
  ? JSHandleEvents
  : T extends WorkerChannel
  ? WorkerEvents
  : T extends FrameChannel
  ? FrameEvents
  : T extends PageChannel
  ? PageEvents
  : T extends BrowserContextChannel
  ? BrowserContextEvents
  : T extends EventTargetChannel
  ? EventTargetEvents
  : T extends BrowserChannel
  ? BrowserEvents
  : T extends BrowserTypeChannel
  ? BrowserTypeEvents
  : T extends SelectorsChannel
  ? SelectorsEvents
  : T extends SocksSupportChannel
  ? SocksSupportEvents
  : T extends DebugControllerChannel
  ? DebugControllerEvents
  : T extends PlaywrightChannel
  ? PlaywrightEvents
  : T extends RootChannel
  ? RootEvents
  : T extends LocalUtilsChannel
  ? LocalUtilsEvents
  : T extends APIRequestContextChannel
  ? APIRequestContextEvents
  : undefined;

// ----------- EventTarget Traits -----------
export type EventTargetTraits<T> = T extends JsonPipeChannel
  ? JsonPipeEventTarget
  : T extends AndroidDeviceChannel
  ? AndroidDeviceEventTarget
  : T extends AndroidSocketChannel
  ? AndroidSocketEventTarget
  : T extends AndroidChannel
  ? AndroidEventTarget
  : T extends ElectronApplicationChannel
  ? ElectronApplicationEventTarget
  : T extends ElectronChannel
  ? ElectronEventTarget
  : T extends CDPSessionChannel
  ? CDPSessionEventTarget
  : T extends WritableStreamChannel
  ? WritableStreamEventTarget
  : T extends StreamChannel
  ? StreamEventTarget
  : T extends ArtifactChannel
  ? ArtifactEventTarget
  : T extends TracingChannel
  ? TracingEventTarget
  : T extends DialogChannel
  ? DialogEventTarget
  : T extends BindingCallChannel
  ? BindingCallEventTarget
  : T extends ConsoleMessageChannel
  ? ConsoleMessageEventTarget
  : T extends WebSocketChannel
  ? WebSocketEventTarget
  : T extends ResponseChannel
  ? ResponseEventTarget
  : T extends RouteChannel
  ? RouteEventTarget
  : T extends RequestChannel
  ? RequestEventTarget
  : T extends ElementHandleChannel
  ? ElementHandleEventTarget
  : T extends JSHandleChannel
  ? JSHandleEventTarget
  : T extends WorkerChannel
  ? WorkerEventTarget
  : T extends FrameChannel
  ? FrameEventTarget
  : T extends PageChannel
  ? PageEventTarget
  : T extends BrowserContextChannel
  ? BrowserContextEventTarget
  : T extends EventTargetChannel
  ? EventTargetEventTarget
  : T extends BrowserChannel
  ? BrowserEventTarget
  : T extends BrowserTypeChannel
  ? BrowserTypeEventTarget
  : T extends SelectorsChannel
  ? SelectorsEventTarget
  : T extends SocksSupportChannel
  ? SocksSupportEventTarget
  : T extends DebugControllerChannel
  ? DebugControllerEventTarget
  : T extends PlaywrightChannel
  ? PlaywrightEventTarget
  : T extends RootChannel
  ? RootEventTarget
  : T extends LocalUtilsChannel
  ? LocalUtilsEventTarget
  : T extends APIRequestContextChannel
  ? APIRequestContextEventTarget
  : undefined;

export type StackFrame = {
  file: string;
  line?: number;
  column?: number;
  function?: string;
};

export type Metadata = {
  stack?: StackFrame[];
  apiName?: string;
  internal?: boolean;
};

export type Point = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SerializedValue = {
  n?: number;
  b?: boolean;
  s?: string;
  v?: "null" | "undefined" | "NaN" | "Infinity" | "-Infinity" | "-0";
  d?: string;
  u?: string;
  r?: {
    p: string;
    f: string;
  };
  a?: SerializedValue[];
  o?: {
    k: string;
    v: SerializedValue;
  }[];
  h?: number;
  id?: number;
  ref?: number;
};

export type SerializedArgument = {
  value: SerializedValue;
  handles: Channel[];
};

export type ExpectedTextValue = {
  string?: string;
  regexSource?: string;
  regexFlags?: string;
  matchSubstring?: boolean;
  ignoreCase?: boolean;
  normalizeWhiteSpace?: boolean;
};

export type AXNode = {
  role: string;
  name: string;
  valueString?: string;
  valueNumber?: number;
  description?: string;
  keyshortcuts?: string;
  roledescription?: string;
  valuetext?: string;
  disabled?: boolean;
  expanded?: boolean;
  focused?: boolean;
  modal?: boolean;
  multiline?: boolean;
  multiselectable?: boolean;
  readonly?: boolean;
  required?: boolean;
  selected?: boolean;
  checked?: "checked" | "unchecked" | "mixed";
  pressed?: "pressed" | "released" | "mixed";
  level?: number;
  valuemin?: number;
  valuemax?: number;
  autocomplete?: string;
  haspopup?: string;
  invalid?: string;
  orientation?: string;
  children?: AXNode[];
};

export type SetNetworkCookie = {
  name: string;
  value: string;
  url?: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
};

export type NetworkCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
};

export type NameValue = {
  name: string;
  value: string;
};

export type OriginStorage = {
  origin: string;
  localStorage: NameValue[];
};

export type SerializedError = {
  error?: {
    message: string;
    name: string;
    stack?: string;
  };
  value?: SerializedValue;
};

export type RecordHarOptions = {
  path: string;
  content?: "embed" | "attach" | "omit";
  mode?: "full" | "minimal";
  urlGlob?: string;
  urlRegexSource?: string;
  urlRegexFlags?: string;
};

export type FormField = {
  name: string;
  value?: string;
  file?: {
    name: string;
    mimeType?: string;
    buffer: Binary;
  };
};

// ----------- APIRequestContext -----------
export type APIRequestContextInitializer = {
  tracing: TracingChannel;
};
export interface APIRequestContextEventTarget {}
export interface APIRequestContextChannel
  extends APIRequestContextEventTarget,
    Channel {
  _type_APIRequestContext: boolean;
  fetch(
    params: APIRequestContextFetchParams,
    metadata?: Metadata
  ): Promise<APIRequestContextFetchResult>;
  fetchResponseBody(
    params: APIRequestContextFetchResponseBodyParams,
    metadata?: Metadata
  ): Promise<APIRequestContextFetchResponseBodyResult>;
  fetchLog(
    params: APIRequestContextFetchLogParams,
    metadata?: Metadata
  ): Promise<APIRequestContextFetchLogResult>;
  storageState(
    params?: APIRequestContextStorageStateParams,
    metadata?: Metadata
  ): Promise<APIRequestContextStorageStateResult>;
  disposeAPIResponse(
    params: APIRequestContextDisposeAPIResponseParams,
    metadata?: Metadata
  ): Promise<APIRequestContextDisposeAPIResponseResult>;
  dispose(
    params?: APIRequestContextDisposeParams,
    metadata?: Metadata
  ): Promise<APIRequestContextDisposeResult>;
}
export type APIRequestContextFetchParams = {
  url: string;
  params?: NameValue[];
  method?: string;
  headers?: NameValue[];
  postData?: Binary;
  jsonData?: any;
  formData?: NameValue[];
  multipartData?: FormField[];
  timeout?: number;
  failOnStatusCode?: boolean;
  ignoreHTTPSErrors?: boolean;
  maxRedirects?: number;
};
export type APIRequestContextFetchOptions = {
  params?: NameValue[];
  method?: string;
  headers?: NameValue[];
  postData?: Binary;
  jsonData?: any;
  formData?: NameValue[];
  multipartData?: FormField[];
  timeout?: number;
  failOnStatusCode?: boolean;
  ignoreHTTPSErrors?: boolean;
  maxRedirects?: number;
};
export type APIRequestContextFetchResult = {
  response: APIResponse;
};
export type APIRequestContextFetchResponseBodyParams = {
  fetchUid: string;
};
export type APIRequestContextFetchResponseBodyOptions = {};
export type APIRequestContextFetchResponseBodyResult = {
  binary?: Binary;
};
export type APIRequestContextFetchLogParams = {
  fetchUid: string;
};
export type APIRequestContextFetchLogOptions = {};
export type APIRequestContextFetchLogResult = {
  log: string[];
};
export type APIRequestContextStorageStateParams = {};
export type APIRequestContextStorageStateOptions = {};
export type APIRequestContextStorageStateResult = {
  cookies: NetworkCookie[];
  origins: OriginStorage[];
};
export type APIRequestContextDisposeAPIResponseParams = {
  fetchUid: string;
};
export type APIRequestContextDisposeAPIResponseOptions = {};
export type APIRequestContextDisposeAPIResponseResult = void;
export type APIRequestContextDisposeParams = {};
export type APIRequestContextDisposeOptions = {};
export type APIRequestContextDisposeResult = void;

export interface APIRequestContextEvents {}

export type APIResponse = {
  fetchUid: string;
  url: string;
  status: number;
  statusText: string;
  headers: NameValue[];
};

export type LifecycleEvent =
  | "load"
  | "domcontentloaded"
  | "networkidle"
  | "commit";
// ----------- LocalUtils -----------
export type LocalUtilsInitializer = {};
export interface LocalUtilsEventTarget {}
export interface LocalUtilsChannel extends LocalUtilsEventTarget, Channel {
  _type_LocalUtils: boolean;
  zip(
    params: LocalUtilsZipParams,
    metadata?: Metadata
  ): Promise<LocalUtilsZipResult>;
  harOpen(
    params: LocalUtilsHarOpenParams,
    metadata?: Metadata
  ): Promise<LocalUtilsHarOpenResult>;
  harLookup(
    params: LocalUtilsHarLookupParams,
    metadata?: Metadata
  ): Promise<LocalUtilsHarLookupResult>;
  harClose(
    params: LocalUtilsHarCloseParams,
    metadata?: Metadata
  ): Promise<LocalUtilsHarCloseResult>;
  harUnzip(
    params: LocalUtilsHarUnzipParams,
    metadata?: Metadata
  ): Promise<LocalUtilsHarUnzipResult>;
  connect(
    params: LocalUtilsConnectParams,
    metadata?: Metadata
  ): Promise<LocalUtilsConnectResult>;
}
export type LocalUtilsZipParams = {
  zipFile: string;
  entries: NameValue[];
};
export type LocalUtilsZipOptions = {};
export type LocalUtilsZipResult = void;
export type LocalUtilsHarOpenParams = {
  file: string;
};
export type LocalUtilsHarOpenOptions = {};
export type LocalUtilsHarOpenResult = {
  harId?: string;
  error?: string;
};
export type LocalUtilsHarLookupParams = {
  harId: string;
  url: string;
  method: string;
  headers: NameValue[];
  postData?: Binary;
  isNavigationRequest: boolean;
};
export type LocalUtilsHarLookupOptions = {
  postData?: Binary;
};
export type LocalUtilsHarLookupResult = {
  action: "error" | "redirect" | "fulfill" | "noentry";
  message?: string;
  redirectURL?: string;
  status?: number;
  headers?: NameValue[];
  body?: Binary;
};
export type LocalUtilsHarCloseParams = {
  harId: string;
};
export type LocalUtilsHarCloseOptions = {};
export type LocalUtilsHarCloseResult = void;
export type LocalUtilsHarUnzipParams = {
  zipFile: string;
  harFile: string;
};
export type LocalUtilsHarUnzipOptions = {};
export type LocalUtilsHarUnzipResult = void;
export type LocalUtilsConnectParams = {
  wsEndpoint: string;
  headers?: any;
  slowMo?: number;
  timeout?: number;
  socksProxyRedirectPortForTest?: number;
};
export type LocalUtilsConnectOptions = {
  headers?: any;
  slowMo?: number;
  timeout?: number;
  socksProxyRedirectPortForTest?: number;
};
export type LocalUtilsConnectResult = {
  pipe: JsonPipeChannel;
};

export interface LocalUtilsEvents {}

// ----------- Root -----------
export type RootInitializer = {};
export interface RootEventTarget {}
export interface RootChannel extends RootEventTarget, Channel {
  _type_Root: boolean;
  initialize(
    params: RootInitializeParams,
    metadata?: Metadata
  ): Promise<RootInitializeResult>;
}
export type RootInitializeParams = {
  sdkLanguage: string;
};
export type RootInitializeOptions = {};
export type RootInitializeResult = {
  playwright: PlaywrightChannel;
};

export interface RootEvents {}

// ----------- Playwright -----------
export type PlaywrightInitializer = {
  chromium: BrowserTypeChannel;
  firefox: BrowserTypeChannel;
  webkit: BrowserTypeChannel;
  android: AndroidChannel;
  electron: ElectronChannel;
  utils: LocalUtilsChannel;
  deviceDescriptors: {
    name: string;
    descriptor: {
      userAgent: string;
      viewport: {
        width: number;
        height: number;
      };
      screen?: {
        width: number;
        height: number;
      };
      deviceScaleFactor: number;
      isMobile: boolean;
      hasTouch: boolean;
      defaultBrowserType: "chromium" | "firefox" | "webkit";
    };
  }[];
  selectors: SelectorsChannel;
  preLaunchedBrowser?: BrowserChannel;
  socksSupport?: SocksSupportChannel;
};
export interface PlaywrightEventTarget {}
export interface PlaywrightChannel extends PlaywrightEventTarget, Channel {
  _type_Playwright: boolean;
  newRequest(
    params: PlaywrightNewRequestParams,
    metadata?: Metadata
  ): Promise<PlaywrightNewRequestResult>;
  hideHighlight(
    params?: PlaywrightHideHighlightParams,
    metadata?: Metadata
  ): Promise<PlaywrightHideHighlightResult>;
}
export type PlaywrightNewRequestParams = {
  baseURL?: string;
  userAgent?: string;
  ignoreHTTPSErrors?: boolean;
  extraHTTPHeaders?: NameValue[];
  httpCredentials?: {
    username: string;
    password: string;
  };
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
  timeout?: number;
  storageState?: {
    cookies: NetworkCookie[];
    origins: OriginStorage[];
  };
  tracesDir?: string;
};
export type PlaywrightNewRequestOptions = {
  baseURL?: string;
  userAgent?: string;
  ignoreHTTPSErrors?: boolean;
  extraHTTPHeaders?: NameValue[];
  httpCredentials?: {
    username: string;
    password: string;
  };
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
  timeout?: number;
  storageState?: {
    cookies: NetworkCookie[];
    origins: OriginStorage[];
  };
  tracesDir?: string;
};
export type PlaywrightNewRequestResult = {
  request: APIRequestContextChannel;
};
export type PlaywrightHideHighlightParams = {};
export type PlaywrightHideHighlightOptions = {};
export type PlaywrightHideHighlightResult = void;

export interface PlaywrightEvents {}

export type RecorderSource = {
  isRecorded: boolean;
  id: string;
  label: string;
  text: string;
  language: string;
  highlight: {
    line: number;
    type: string;
  }[];
  revealLine?: number;
  group?: string;
};

// ----------- DebugController -----------
export type DebugControllerInitializer = {};
export interface DebugControllerEventTarget {
  on(
    event: "inspectRequested",
    callback: (params: DebugControllerInspectRequestedEvent) => void
  ): this;
  on(
    event: "browsersChanged",
    callback: (params: DebugControllerBrowsersChangedEvent) => void
  ): this;
  on(
    event: "sourcesChanged",
    callback: (params: DebugControllerSourcesChangedEvent) => void
  ): this;
}
export interface DebugControllerChannel
  extends DebugControllerEventTarget,
    Channel {
  _type_DebugController: boolean;
  setTrackHierarchy(
    params: DebugControllerSetTrackHierarchyParams,
    metadata?: Metadata
  ): Promise<DebugControllerSetTrackHierarchyResult>;
  setReuseBrowser(
    params: DebugControllerSetReuseBrowserParams,
    metadata?: Metadata
  ): Promise<DebugControllerSetReuseBrowserResult>;
  resetForReuse(
    params?: DebugControllerResetForReuseParams,
    metadata?: Metadata
  ): Promise<DebugControllerResetForReuseResult>;
  navigateAll(
    params: DebugControllerNavigateAllParams,
    metadata?: Metadata
  ): Promise<DebugControllerNavigateAllResult>;
  setRecorderMode(
    params: DebugControllerSetRecorderModeParams,
    metadata?: Metadata
  ): Promise<DebugControllerSetRecorderModeResult>;
  highlightAll(
    params: DebugControllerHighlightAllParams,
    metadata?: Metadata
  ): Promise<DebugControllerHighlightAllResult>;
  hideHighlightAll(
    params?: DebugControllerHideHighlightAllParams,
    metadata?: Metadata
  ): Promise<DebugControllerHideHighlightAllResult>;
  kill(
    params?: DebugControllerKillParams,
    metadata?: Metadata
  ): Promise<DebugControllerKillResult>;
  closeAllBrowsers(
    params?: DebugControllerCloseAllBrowsersParams,
    metadata?: Metadata
  ): Promise<DebugControllerCloseAllBrowsersResult>;
}
export type DebugControllerInspectRequestedEvent = {
  selector: string;
};
export type DebugControllerBrowsersChangedEvent = {
  browsers: {
    contexts: {
      pages: string[];
    }[];
  }[];
};
export type DebugControllerSourcesChangedEvent = {
  sources: RecorderSource[];
};
export type DebugControllerSetTrackHierarchyParams = {
  enabled: boolean;
};
export type DebugControllerSetTrackHierarchyOptions = {};
export type DebugControllerSetTrackHierarchyResult = void;
export type DebugControllerSetReuseBrowserParams = {
  enabled: boolean;
};
export type DebugControllerSetReuseBrowserOptions = {};
export type DebugControllerSetReuseBrowserResult = void;
export type DebugControllerResetForReuseParams = {};
export type DebugControllerResetForReuseOptions = {};
export type DebugControllerResetForReuseResult = void;
export type DebugControllerNavigateAllParams = {
  url: string;
};
export type DebugControllerNavigateAllOptions = {};
export type DebugControllerNavigateAllResult = void;
export type DebugControllerSetRecorderModeParams = {
  mode: "inspecting" | "recording" | "none";
  language?: string;
  file?: string;
};
export type DebugControllerSetRecorderModeOptions = {
  language?: string;
  file?: string;
};
export type DebugControllerSetRecorderModeResult = void;
export type DebugControllerHighlightAllParams = {
  selector: string;
};
export type DebugControllerHighlightAllOptions = {};
export type DebugControllerHighlightAllResult = void;
export type DebugControllerHideHighlightAllParams = {};
export type DebugControllerHideHighlightAllOptions = {};
export type DebugControllerHideHighlightAllResult = void;
export type DebugControllerKillParams = {};
export type DebugControllerKillOptions = {};
export type DebugControllerKillResult = void;
export type DebugControllerCloseAllBrowsersParams = {};
export type DebugControllerCloseAllBrowsersOptions = {};
export type DebugControllerCloseAllBrowsersResult = void;

export interface DebugControllerEvents {
  inspectRequested: DebugControllerInspectRequestedEvent;
  browsersChanged: DebugControllerBrowsersChangedEvent;
  sourcesChanged: DebugControllerSourcesChangedEvent;
}

// ----------- SocksSupport -----------
export type SocksSupportInitializer = {};
export interface SocksSupportEventTarget {
  on(
    event: "socksRequested",
    callback: (params: SocksSupportSocksRequestedEvent) => void
  ): this;
  on(
    event: "socksData",
    callback: (params: SocksSupportSocksDataEvent) => void
  ): this;
  on(
    event: "socksClosed",
    callback: (params: SocksSupportSocksClosedEvent) => void
  ): this;
}
export interface SocksSupportChannel extends SocksSupportEventTarget, Channel {
  _type_SocksSupport: boolean;
  socksConnected(
    params: SocksSupportSocksConnectedParams,
    metadata?: Metadata
  ): Promise<SocksSupportSocksConnectedResult>;
  socksFailed(
    params: SocksSupportSocksFailedParams,
    metadata?: Metadata
  ): Promise<SocksSupportSocksFailedResult>;
  socksData(
    params: SocksSupportSocksDataParams,
    metadata?: Metadata
  ): Promise<SocksSupportSocksDataResult>;
  socksError(
    params: SocksSupportSocksErrorParams,
    metadata?: Metadata
  ): Promise<SocksSupportSocksErrorResult>;
  socksEnd(
    params: SocksSupportSocksEndParams,
    metadata?: Metadata
  ): Promise<SocksSupportSocksEndResult>;
}
export type SocksSupportSocksRequestedEvent = {
  uid: string;
  host: string;
  port: number;
};
export type SocksSupportSocksDataEvent = {
  uid: string;
  data: Binary;
};
export type SocksSupportSocksClosedEvent = {
  uid: string;
};
export type SocksSupportSocksConnectedParams = {
  uid: string;
  host: string;
  port: number;
};
export type SocksSupportSocksConnectedOptions = {};
export type SocksSupportSocksConnectedResult = void;
export type SocksSupportSocksFailedParams = {
  uid: string;
  errorCode: string;
};
export type SocksSupportSocksFailedOptions = {};
export type SocksSupportSocksFailedResult = void;
export type SocksSupportSocksDataParams = {
  uid: string;
  data: Binary;
};
export type SocksSupportSocksDataOptions = {};
export type SocksSupportSocksDataResult = void;
export type SocksSupportSocksErrorParams = {
  uid: string;
  error: string;
};
export type SocksSupportSocksErrorOptions = {};
export type SocksSupportSocksErrorResult = void;
export type SocksSupportSocksEndParams = {
  uid: string;
};
export type SocksSupportSocksEndOptions = {};
export type SocksSupportSocksEndResult = void;

export interface SocksSupportEvents {
  socksRequested: SocksSupportSocksRequestedEvent;
  socksData: SocksSupportSocksDataEvent;
  socksClosed: SocksSupportSocksClosedEvent;
}

// ----------- Selectors -----------
export type SelectorsInitializer = {};
export interface SelectorsEventTarget {}
export interface SelectorsChannel extends SelectorsEventTarget, Channel {
  _type_Selectors: boolean;
  register(
    params: SelectorsRegisterParams,
    metadata?: Metadata
  ): Promise<SelectorsRegisterResult>;
}
export type SelectorsRegisterParams = {
  name: string;
  source: string;
  contentScript?: boolean;
};
export type SelectorsRegisterOptions = {
  contentScript?: boolean;
};
export type SelectorsRegisterResult = void;

export interface SelectorsEvents {}

// ----------- BrowserType -----------
export type BrowserTypeInitializer = {
  executablePath: string;
  name: string;
};
export interface BrowserTypeEventTarget {}
export interface BrowserTypeChannel extends BrowserTypeEventTarget, Channel {
  _type_BrowserType: boolean;
  launch(
    params: BrowserTypeLaunchParams,
    metadata?: Metadata
  ): Promise<BrowserTypeLaunchResult>;
  launchPersistentContext(
    params: BrowserTypeLaunchPersistentContextParams,
    metadata?: Metadata
  ): Promise<BrowserTypeLaunchPersistentContextResult>;
  connectOverCDP(
    params: BrowserTypeConnectOverCDPParams,
    metadata?: Metadata
  ): Promise<BrowserTypeConnectOverCDPResult>;
}
export type BrowserTypeLaunchParams = {
  channel?: string;
  executablePath?: string;
  args?: string[];
  ignoreAllDefaultArgs?: boolean;
  ignoreDefaultArgs?: string[];
  handleSIGINT?: boolean;
  handleSIGTERM?: boolean;
  handleSIGHUP?: boolean;
  timeout?: number;
  env?: NameValue[];
  headless?: boolean;
  devtools?: boolean;
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
  downloadsPath?: string;
  tracesDir?: string;
  chromiumSandbox?: boolean;
  firefoxUserPrefs?: any;
  slowMo?: number;
};
export type BrowserTypeLaunchOptions = {
  channel?: string;
  executablePath?: string;
  args?: string[];
  ignoreAllDefaultArgs?: boolean;
  ignoreDefaultArgs?: string[];
  handleSIGINT?: boolean;
  handleSIGTERM?: boolean;
  handleSIGHUP?: boolean;
  timeout?: number;
  env?: NameValue[];
  headless?: boolean;
  devtools?: boolean;
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
  downloadsPath?: string;
  tracesDir?: string;
  chromiumSandbox?: boolean;
  firefoxUserPrefs?: any;
  slowMo?: number;
};
export type BrowserTypeLaunchResult = {
  browser: BrowserChannel;
};
export type BrowserTypeLaunchPersistentContextParams = {
  channel?: string;
  executablePath?: string;
  args?: string[];
  ignoreAllDefaultArgs?: boolean;
  ignoreDefaultArgs?: string[];
  handleSIGINT?: boolean;
  handleSIGTERM?: boolean;
  handleSIGHUP?: boolean;
  timeout?: number;
  env?: NameValue[];
  headless?: boolean;
  devtools?: boolean;
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
  downloadsPath?: string;
  tracesDir?: string;
  chromiumSandbox?: boolean;
  noDefaultViewport?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  screen?: {
    width: number;
    height: number;
  };
  ignoreHTTPSErrors?: boolean;
  javaScriptEnabled?: boolean;
  bypassCSP?: boolean;
  userAgent?: string;
  locale?: string;
  timezoneId?: string;
  geolocation?: {
    longitude: number;
    latitude: number;
    accuracy?: number;
  };
  permissions?: string[];
  extraHTTPHeaders?: NameValue[];
  offline?: boolean;
  httpCredentials?: {
    username: string;
    password: string;
  };
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  colorScheme?: "dark" | "light" | "no-preference";
  reducedMotion?: "reduce" | "no-preference";
  forcedColors?: "active" | "none";
  acceptDownloads?: boolean;
  baseURL?: string;
  recordVideo?: {
    dir: string;
    size?: {
      width: number;
      height: number;
    };
  };
  recordHar?: RecordHarOptions;
  strictSelectors?: boolean;
  serviceWorkers?: "allow" | "block";
  userDataDir: string;
  slowMo?: number;
};
export type BrowserTypeLaunchPersistentContextOptions = {
  channel?: string;
  executablePath?: string;
  args?: string[];
  ignoreAllDefaultArgs?: boolean;
  ignoreDefaultArgs?: string[];
  handleSIGINT?: boolean;
  handleSIGTERM?: boolean;
  handleSIGHUP?: boolean;
  timeout?: number;
  env?: NameValue[];
  headless?: boolean;
  devtools?: boolean;
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
  downloadsPath?: string;
  tracesDir?: string;
  chromiumSandbox?: boolean;
  noDefaultViewport?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  screen?: {
    width: number;
    height: number;
  };
  ignoreHTTPSErrors?: boolean;
  javaScriptEnabled?: boolean;
  bypassCSP?: boolean;
  userAgent?: string;
  locale?: string;
  timezoneId?: string;
  geolocation?: {
    longitude: number;
    latitude: number;
    accuracy?: number;
  };
  permissions?: string[];
  extraHTTPHeaders?: NameValue[];
  offline?: boolean;
  httpCredentials?: {
    username: string;
    password: string;
  };
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  colorScheme?: "dark" | "light" | "no-preference";
  reducedMotion?: "reduce" | "no-preference";
  forcedColors?: "active" | "none";
  acceptDownloads?: boolean;
  baseURL?: string;
  recordVideo?: {
    dir: string;
    size?: {
      width: number;
      height: number;
    };
  };
  recordHar?: RecordHarOptions;
  strictSelectors?: boolean;
  serviceWorkers?: "allow" | "block";
  slowMo?: number;
};
export type BrowserTypeLaunchPersistentContextResult = {
  context: BrowserContextChannel;
};
export type BrowserTypeConnectOverCDPParams = {
  endpointURL: string;
  headers?: NameValue[];
  slowMo?: number;
  timeout?: number;
};
export type BrowserTypeConnectOverCDPOptions = {
  headers?: NameValue[];
  slowMo?: number;
  timeout?: number;
};
export type BrowserTypeConnectOverCDPResult = {
  browser: BrowserChannel;
  defaultContext?: BrowserContextChannel;
};

export interface BrowserTypeEvents {}

// ----------- Browser -----------
export type BrowserInitializer = {
  version: string;
  name: string;
};
export interface BrowserEventTarget {
  on(event: "close", callback: (params: BrowserCloseEvent) => void): this;
}
export interface BrowserChannel extends BrowserEventTarget, Channel {
  _type_Browser: boolean;
  close(
    params?: BrowserCloseParams,
    metadata?: Metadata
  ): Promise<BrowserCloseResult>;
  killForTests(
    params?: BrowserKillForTestsParams,
    metadata?: Metadata
  ): Promise<BrowserKillForTestsResult>;
  newContext(
    params: BrowserNewContextParams,
    metadata?: Metadata
  ): Promise<BrowserNewContextResult>;
  newContextForReuse(
    params: BrowserNewContextForReuseParams,
    metadata?: Metadata
  ): Promise<BrowserNewContextForReuseResult>;
  newBrowserCDPSession(
    params?: BrowserNewBrowserCDPSessionParams,
    metadata?: Metadata
  ): Promise<BrowserNewBrowserCDPSessionResult>;
  startTracing(
    params: BrowserStartTracingParams,
    metadata?: Metadata
  ): Promise<BrowserStartTracingResult>;
  stopTracing(
    params?: BrowserStopTracingParams,
    metadata?: Metadata
  ): Promise<BrowserStopTracingResult>;
}
export type BrowserCloseEvent = {};
export type BrowserCloseParams = {};
export type BrowserCloseOptions = {};
export type BrowserCloseResult = void;
export type BrowserKillForTestsParams = {};
export type BrowserKillForTestsOptions = {};
export type BrowserKillForTestsResult = void;
export type BrowserNewContextParams = {
  noDefaultViewport?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  screen?: {
    width: number;
    height: number;
  };
  ignoreHTTPSErrors?: boolean;
  javaScriptEnabled?: boolean;
  bypassCSP?: boolean;
  userAgent?: string;
  locale?: string;
  timezoneId?: string;
  geolocation?: {
    longitude: number;
    latitude: number;
    accuracy?: number;
  };
  permissions?: string[];
  extraHTTPHeaders?: NameValue[];
  offline?: boolean;
  httpCredentials?: {
    username: string;
    password: string;
  };
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  colorScheme?: "dark" | "light" | "no-preference";
  reducedMotion?: "reduce" | "no-preference";
  forcedColors?: "active" | "none";
  acceptDownloads?: boolean;
  baseURL?: string;
  recordVideo?: {
    dir: string;
    size?: {
      width: number;
      height: number;
    };
  };
  recordHar?: RecordHarOptions;
  strictSelectors?: boolean;
  serviceWorkers?: "allow" | "block";
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
  storageState?: {
    cookies?: SetNetworkCookie[];
    origins?: OriginStorage[];
  };
};
export type BrowserNewContextOptions = {
  noDefaultViewport?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  screen?: {
    width: number;
    height: number;
  };
  ignoreHTTPSErrors?: boolean;
  javaScriptEnabled?: boolean;
  bypassCSP?: boolean;
  userAgent?: string;
  locale?: string;
  timezoneId?: string;
  geolocation?: {
    longitude: number;
    latitude: number;
    accuracy?: number;
  };
  permissions?: string[];
  extraHTTPHeaders?: NameValue[];
  offline?: boolean;
  httpCredentials?: {
    username: string;
    password: string;
  };
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  colorScheme?: "dark" | "light" | "no-preference";
  reducedMotion?: "reduce" | "no-preference";
  forcedColors?: "active" | "none";
  acceptDownloads?: boolean;
  baseURL?: string;
  recordVideo?: {
    dir: string;
    size?: {
      width: number;
      height: number;
    };
  };
  recordHar?: RecordHarOptions;
  strictSelectors?: boolean;
  serviceWorkers?: "allow" | "block";
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
  storageState?: {
    cookies?: SetNetworkCookie[];
    origins?: OriginStorage[];
  };
};
export type BrowserNewContextResult = {
  context: BrowserContextChannel;
};
export type BrowserNewContextForReuseParams = {
  noDefaultViewport?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  screen?: {
    width: number;
    height: number;
  };
  ignoreHTTPSErrors?: boolean;
  javaScriptEnabled?: boolean;
  bypassCSP?: boolean;
  userAgent?: string;
  locale?: string;
  timezoneId?: string;
  geolocation?: {
    longitude: number;
    latitude: number;
    accuracy?: number;
  };
  permissions?: string[];
  extraHTTPHeaders?: NameValue[];
  offline?: boolean;
  httpCredentials?: {
    username: string;
    password: string;
  };
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  colorScheme?: "dark" | "light" | "no-preference";
  reducedMotion?: "reduce" | "no-preference";
  forcedColors?: "active" | "none";
  acceptDownloads?: boolean;
  baseURL?: string;
  recordVideo?: {
    dir: string;
    size?: {
      width: number;
      height: number;
    };
  };
  recordHar?: RecordHarOptions;
  strictSelectors?: boolean;
  serviceWorkers?: "allow" | "block";
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
  storageState?: {
    cookies?: SetNetworkCookie[];
    origins?: OriginStorage[];
  };
};
export type BrowserNewContextForReuseOptions = {
  noDefaultViewport?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  screen?: {
    width: number;
    height: number;
  };
  ignoreHTTPSErrors?: boolean;
  javaScriptEnabled?: boolean;
  bypassCSP?: boolean;
  userAgent?: string;
  locale?: string;
  timezoneId?: string;
  geolocation?: {
    longitude: number;
    latitude: number;
    accuracy?: number;
  };
  permissions?: string[];
  extraHTTPHeaders?: NameValue[];
  offline?: boolean;
  httpCredentials?: {
    username: string;
    password: string;
  };
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  colorScheme?: "dark" | "light" | "no-preference";
  reducedMotion?: "reduce" | "no-preference";
  forcedColors?: "active" | "none";
  acceptDownloads?: boolean;
  baseURL?: string;
  recordVideo?: {
    dir: string;
    size?: {
      width: number;
      height: number;
    };
  };
  recordHar?: RecordHarOptions;
  strictSelectors?: boolean;
  serviceWorkers?: "allow" | "block";
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
  storageState?: {
    cookies?: SetNetworkCookie[];
    origins?: OriginStorage[];
  };
};
export type BrowserNewContextForReuseResult = {
  context: BrowserContextChannel;
};
export type BrowserNewBrowserCDPSessionParams = {};
export type BrowserNewBrowserCDPSessionOptions = {};
export type BrowserNewBrowserCDPSessionResult = {
  session: CDPSessionChannel;
};
export type BrowserStartTracingParams = {
  page?: PageChannel;
  path?: string;
  screenshots?: boolean;
  categories?: string[];
};
export type BrowserStartTracingOptions = {
  page?: PageChannel;
  path?: string;
  screenshots?: boolean;
  categories?: string[];
};
export type BrowserStartTracingResult = void;
export type BrowserStopTracingParams = {};
export type BrowserStopTracingOptions = {};
export type BrowserStopTracingResult = {
  binary: Binary;
};

export interface BrowserEvents {
  close: BrowserCloseEvent;
}

// ----------- EventTarget -----------
export type EventTargetInitializer = {};
export interface EventTargetEventTarget {}
export interface EventTargetChannel extends EventTargetEventTarget, Channel {
  _type_EventTarget: boolean;
  waitForEventInfo(
    params: EventTargetWaitForEventInfoParams,
    metadata?: Metadata
  ): Promise<EventTargetWaitForEventInfoResult>;
}
export type EventTargetWaitForEventInfoParams = {
  info: {
    waitId: string;
    phase: "before" | "after" | "log";
    event?: string;
    message?: string;
    error?: string;
  };
};
export type EventTargetWaitForEventInfoOptions = {};
export type EventTargetWaitForEventInfoResult = void;

export interface EventTargetEvents {}

// ----------- BrowserContext -----------
export type BrowserContextInitializer = {
  isChromium: boolean;
  requestContext: APIRequestContextChannel;
  tracing: TracingChannel;
};
export interface BrowserContextEventTarget {
  on(
    event: "bindingCall",
    callback: (params: BrowserContextBindingCallEvent) => void
  ): this;
  on(
    event: "close",
    callback: (params: BrowserContextCloseEvent) => void
  ): this;
  on(event: "page", callback: (params: BrowserContextPageEvent) => void): this;
  on(
    event: "route",
    callback: (params: BrowserContextRouteEvent) => void
  ): this;
  on(
    event: "video",
    callback: (params: BrowserContextVideoEvent) => void
  ): this;
  on(
    event: "backgroundPage",
    callback: (params: BrowserContextBackgroundPageEvent) => void
  ): this;
  on(
    event: "serviceWorker",
    callback: (params: BrowserContextServiceWorkerEvent) => void
  ): this;
  on(
    event: "request",
    callback: (params: BrowserContextRequestEvent) => void
  ): this;
  on(
    event: "requestFailed",
    callback: (params: BrowserContextRequestFailedEvent) => void
  ): this;
  on(
    event: "requestFinished",
    callback: (params: BrowserContextRequestFinishedEvent) => void
  ): this;
  on(
    event: "response",
    callback: (params: BrowserContextResponseEvent) => void
  ): this;
}
export interface BrowserContextChannel
  extends BrowserContextEventTarget,
    EventTargetChannel {
  _type_BrowserContext: boolean;
  addCookies(
    params: BrowserContextAddCookiesParams,
    metadata?: Metadata
  ): Promise<BrowserContextAddCookiesResult>;
  addInitScript(
    params: BrowserContextAddInitScriptParams,
    metadata?: Metadata
  ): Promise<BrowserContextAddInitScriptResult>;
  clearCookies(
    params?: BrowserContextClearCookiesParams,
    metadata?: Metadata
  ): Promise<BrowserContextClearCookiesResult>;
  clearPermissions(
    params?: BrowserContextClearPermissionsParams,
    metadata?: Metadata
  ): Promise<BrowserContextClearPermissionsResult>;
  close(
    params?: BrowserContextCloseParams,
    metadata?: Metadata
  ): Promise<BrowserContextCloseResult>;
  cookies(
    params: BrowserContextCookiesParams,
    metadata?: Metadata
  ): Promise<BrowserContextCookiesResult>;
  exposeBinding(
    params: BrowserContextExposeBindingParams,
    metadata?: Metadata
  ): Promise<BrowserContextExposeBindingResult>;
  grantPermissions(
    params: BrowserContextGrantPermissionsParams,
    metadata?: Metadata
  ): Promise<BrowserContextGrantPermissionsResult>;
  newPage(
    params?: BrowserContextNewPageParams,
    metadata?: Metadata
  ): Promise<BrowserContextNewPageResult>;
  setDefaultNavigationTimeoutNoReply(
    params: BrowserContextSetDefaultNavigationTimeoutNoReplyParams,
    metadata?: Metadata
  ): Promise<BrowserContextSetDefaultNavigationTimeoutNoReplyResult>;
  setDefaultTimeoutNoReply(
    params: BrowserContextSetDefaultTimeoutNoReplyParams,
    metadata?: Metadata
  ): Promise<BrowserContextSetDefaultTimeoutNoReplyResult>;
  setExtraHTTPHeaders(
    params: BrowserContextSetExtraHTTPHeadersParams,
    metadata?: Metadata
  ): Promise<BrowserContextSetExtraHTTPHeadersResult>;
  setGeolocation(
    params: BrowserContextSetGeolocationParams,
    metadata?: Metadata
  ): Promise<BrowserContextSetGeolocationResult>;
  setHTTPCredentials(
    params: BrowserContextSetHTTPCredentialsParams,
    metadata?: Metadata
  ): Promise<BrowserContextSetHTTPCredentialsResult>;
  setNetworkInterceptionEnabled(
    params: BrowserContextSetNetworkInterceptionEnabledParams,
    metadata?: Metadata
  ): Promise<BrowserContextSetNetworkInterceptionEnabledResult>;
  setOffline(
    params: BrowserContextSetOfflineParams,
    metadata?: Metadata
  ): Promise<BrowserContextSetOfflineResult>;
  storageState(
    params?: BrowserContextStorageStateParams,
    metadata?: Metadata
  ): Promise<BrowserContextStorageStateResult>;
  pause(
    params?: BrowserContextPauseParams,
    metadata?: Metadata
  ): Promise<BrowserContextPauseResult>;
  recorderSupplementEnable(
    params: BrowserContextRecorderSupplementEnableParams,
    metadata?: Metadata
  ): Promise<BrowserContextRecorderSupplementEnableResult>;
  newCDPSession(
    params: BrowserContextNewCDPSessionParams,
    metadata?: Metadata
  ): Promise<BrowserContextNewCDPSessionResult>;
  harStart(
    params: BrowserContextHarStartParams,
    metadata?: Metadata
  ): Promise<BrowserContextHarStartResult>;
  harExport(
    params: BrowserContextHarExportParams,
    metadata?: Metadata
  ): Promise<BrowserContextHarExportResult>;
  createTempFile(
    params: BrowserContextCreateTempFileParams,
    metadata?: Metadata
  ): Promise<BrowserContextCreateTempFileResult>;
}
export type BrowserContextBindingCallEvent = {
  binding: BindingCallChannel;
};
export type BrowserContextCloseEvent = {};
export type BrowserContextPageEvent = {
  page: PageChannel;
};
export type BrowserContextRouteEvent = {
  route: RouteChannel;
};
export type BrowserContextVideoEvent = {
  artifact: ArtifactChannel;
};
export type BrowserContextBackgroundPageEvent = {
  page: PageChannel;
};
export type BrowserContextServiceWorkerEvent = {
  worker: WorkerChannel;
};
export type BrowserContextRequestEvent = {
  request: RequestChannel;
  page?: PageChannel;
};
export type BrowserContextRequestFailedEvent = {
  request: RequestChannel;
  failureText?: string;
  responseEndTiming: number;
  page?: PageChannel;
};
export type BrowserContextRequestFinishedEvent = {
  request: RequestChannel;
  response?: ResponseChannel;
  responseEndTiming: number;
  page?: PageChannel;
};
export type BrowserContextResponseEvent = {
  response: ResponseChannel;
  page?: PageChannel;
};
export type BrowserContextAddCookiesParams = {
  cookies: SetNetworkCookie[];
};
export type BrowserContextAddCookiesOptions = {};
export type BrowserContextAddCookiesResult = void;
export type BrowserContextAddInitScriptParams = {
  source: string;
};
export type BrowserContextAddInitScriptOptions = {};
export type BrowserContextAddInitScriptResult = void;
export type BrowserContextClearCookiesParams = {};
export type BrowserContextClearCookiesOptions = {};
export type BrowserContextClearCookiesResult = void;
export type BrowserContextClearPermissionsParams = {};
export type BrowserContextClearPermissionsOptions = {};
export type BrowserContextClearPermissionsResult = void;
export type BrowserContextCloseParams = {};
export type BrowserContextCloseOptions = {};
export type BrowserContextCloseResult = void;
export type BrowserContextCookiesParams = {
  urls: string[];
};
export type BrowserContextCookiesOptions = {};
export type BrowserContextCookiesResult = {
  cookies: NetworkCookie[];
};
export type BrowserContextExposeBindingParams = {
  name: string;
  needsHandle?: boolean;
};
export type BrowserContextExposeBindingOptions = {
  needsHandle?: boolean;
};
export type BrowserContextExposeBindingResult = void;
export type BrowserContextGrantPermissionsParams = {
  permissions: string[];
  origin?: string;
};
export type BrowserContextGrantPermissionsOptions = {
  origin?: string;
};
export type BrowserContextGrantPermissionsResult = void;
export type BrowserContextNewPageParams = {};
export type BrowserContextNewPageOptions = {};
export type BrowserContextNewPageResult = {
  page: PageChannel;
};
export type BrowserContextSetDefaultNavigationTimeoutNoReplyParams = {
  timeout?: number;
};
export type BrowserContextSetDefaultNavigationTimeoutNoReplyOptions = {
  timeout?: number;
};
export type BrowserContextSetDefaultNavigationTimeoutNoReplyResult = void;
export type BrowserContextSetDefaultTimeoutNoReplyParams = {
  timeout?: number;
};
export type BrowserContextSetDefaultTimeoutNoReplyOptions = {
  timeout?: number;
};
export type BrowserContextSetDefaultTimeoutNoReplyResult = void;
export type BrowserContextSetExtraHTTPHeadersParams = {
  headers: NameValue[];
};
export type BrowserContextSetExtraHTTPHeadersOptions = {};
export type BrowserContextSetExtraHTTPHeadersResult = void;
export type BrowserContextSetGeolocationParams = {
  geolocation?: {
    longitude: number;
    latitude: number;
    accuracy?: number;
  };
};
export type BrowserContextSetGeolocationOptions = {
  geolocation?: {
    longitude: number;
    latitude: number;
    accuracy?: number;
  };
};
export type BrowserContextSetGeolocationResult = void;
export type BrowserContextSetHTTPCredentialsParams = {
  httpCredentials?: {
    username: string;
    password: string;
  };
};
export type BrowserContextSetHTTPCredentialsOptions = {
  httpCredentials?: {
    username: string;
    password: string;
  };
};
export type BrowserContextSetHTTPCredentialsResult = void;
export type BrowserContextSetNetworkInterceptionEnabledParams = {
  enabled: boolean;
};
export type BrowserContextSetNetworkInterceptionEnabledOptions = {};
export type BrowserContextSetNetworkInterceptionEnabledResult = void;
export type BrowserContextSetOfflineParams = {
  offline: boolean;
};
export type BrowserContextSetOfflineOptions = {};
export type BrowserContextSetOfflineResult = void;
export type BrowserContextStorageStateParams = {};
export type BrowserContextStorageStateOptions = {};
export type BrowserContextStorageStateResult = {
  cookies: NetworkCookie[];
  origins: OriginStorage[];
};
export type BrowserContextPauseParams = {};
export type BrowserContextPauseOptions = {};
export type BrowserContextPauseResult = void;
export type BrowserContextRecorderSupplementEnableParams = {
  language?: string;
  mode?: "inspecting" | "recording";
  pauseOnNextStatement?: boolean;
  launchOptions?: any;
  contextOptions?: any;
  device?: string;
  saveStorage?: string;
  outputFile?: string;
  handleSIGINT?: boolean;
  omitCallTracking?: boolean;
};
export type BrowserContextRecorderSupplementEnableOptions = {
  language?: string;
  mode?: "inspecting" | "recording";
  pauseOnNextStatement?: boolean;
  launchOptions?: any;
  contextOptions?: any;
  device?: string;
  saveStorage?: string;
  outputFile?: string;
  handleSIGINT?: boolean;
  omitCallTracking?: boolean;
};
export type BrowserContextRecorderSupplementEnableResult = void;
export type BrowserContextNewCDPSessionParams = {
  page?: PageChannel;
  frame?: FrameChannel;
};
export type BrowserContextNewCDPSessionOptions = {
  page?: PageChannel;
  frame?: FrameChannel;
};
export type BrowserContextNewCDPSessionResult = {
  session: CDPSessionChannel;
};
export type BrowserContextHarStartParams = {
  page?: PageChannel;
  options: RecordHarOptions;
};
export type BrowserContextHarStartOptions = {
  page?: PageChannel;
};
export type BrowserContextHarStartResult = {
  harId: string;
};
export type BrowserContextHarExportParams = {
  harId?: string;
};
export type BrowserContextHarExportOptions = {
  harId?: string;
};
export type BrowserContextHarExportResult = {
  artifact: ArtifactChannel;
};
export type BrowserContextCreateTempFileParams = {
  name: string;
};
export type BrowserContextCreateTempFileOptions = {};
export type BrowserContextCreateTempFileResult = {
  writableStream: WritableStreamChannel;
};

export interface BrowserContextEvents {
  bindingCall: BrowserContextBindingCallEvent;
  close: BrowserContextCloseEvent;
  page: BrowserContextPageEvent;
  route: BrowserContextRouteEvent;
  video: BrowserContextVideoEvent;
  backgroundPage: BrowserContextBackgroundPageEvent;
  serviceWorker: BrowserContextServiceWorkerEvent;
  request: BrowserContextRequestEvent;
  requestFailed: BrowserContextRequestFailedEvent;
  requestFinished: BrowserContextRequestFinishedEvent;
  response: BrowserContextResponseEvent;
}

// ----------- Page -----------
export type PageInitializer = {
  mainFrame: FrameChannel;
  viewportSize?: {
    width: number;
    height: number;
  };
  isClosed: boolean;
  opener?: PageChannel;
};
export interface PageEventTarget {
  on(
    event: "bindingCall",
    callback: (params: PageBindingCallEvent) => void
  ): this;
  on(event: "close", callback: (params: PageCloseEvent) => void): this;
  on(event: "console", callback: (params: PageConsoleEvent) => void): this;
  on(event: "crash", callback: (params: PageCrashEvent) => void): this;
  on(event: "dialog", callback: (params: PageDialogEvent) => void): this;
  on(event: "download", callback: (params: PageDownloadEvent) => void): this;
  on(
    event: "fileChooser",
    callback: (params: PageFileChooserEvent) => void
  ): this;
  on(
    event: "frameAttached",
    callback: (params: PageFrameAttachedEvent) => void
  ): this;
  on(
    event: "frameDetached",
    callback: (params: PageFrameDetachedEvent) => void
  ): this;
  on(event: "pageError", callback: (params: PagePageErrorEvent) => void): this;
  on(event: "route", callback: (params: PageRouteEvent) => void): this;
  on(event: "video", callback: (params: PageVideoEvent) => void): this;
  on(event: "webSocket", callback: (params: PageWebSocketEvent) => void): this;
  on(event: "worker", callback: (params: PageWorkerEvent) => void): this;
}
export interface PageChannel extends PageEventTarget, EventTargetChannel {
  _type_Page: boolean;
  setDefaultNavigationTimeoutNoReply(
    params: PageSetDefaultNavigationTimeoutNoReplyParams,
    metadata?: Metadata
  ): Promise<PageSetDefaultNavigationTimeoutNoReplyResult>;
  setDefaultTimeoutNoReply(
    params: PageSetDefaultTimeoutNoReplyParams,
    metadata?: Metadata
  ): Promise<PageSetDefaultTimeoutNoReplyResult>;
  setFileChooserInterceptedNoReply(
    params: PageSetFileChooserInterceptedNoReplyParams,
    metadata?: Metadata
  ): Promise<PageSetFileChooserInterceptedNoReplyResult>;
  addInitScript(
    params: PageAddInitScriptParams,
    metadata?: Metadata
  ): Promise<PageAddInitScriptResult>;
  close(params: PageCloseParams, metadata?: Metadata): Promise<PageCloseResult>;
  emulateMedia(
    params: PageEmulateMediaParams,
    metadata?: Metadata
  ): Promise<PageEmulateMediaResult>;
  exposeBinding(
    params: PageExposeBindingParams,
    metadata?: Metadata
  ): Promise<PageExposeBindingResult>;
  goBack(
    params: PageGoBackParams,
    metadata?: Metadata
  ): Promise<PageGoBackResult>;
  goForward(
    params: PageGoForwardParams,
    metadata?: Metadata
  ): Promise<PageGoForwardResult>;
  reload(
    params: PageReloadParams,
    metadata?: Metadata
  ): Promise<PageReloadResult>;
  expectScreenshot(
    params: PageExpectScreenshotParams,
    metadata?: Metadata
  ): Promise<PageExpectScreenshotResult>;
  screenshot(
    params: PageScreenshotParams,
    metadata?: Metadata
  ): Promise<PageScreenshotResult>;
  setExtraHTTPHeaders(
    params: PageSetExtraHTTPHeadersParams,
    metadata?: Metadata
  ): Promise<PageSetExtraHTTPHeadersResult>;
  setNetworkInterceptionEnabled(
    params: PageSetNetworkInterceptionEnabledParams,
    metadata?: Metadata
  ): Promise<PageSetNetworkInterceptionEnabledResult>;
  setViewportSize(
    params: PageSetViewportSizeParams,
    metadata?: Metadata
  ): Promise<PageSetViewportSizeResult>;
  keyboardDown(
    params: PageKeyboardDownParams,
    metadata?: Metadata
  ): Promise<PageKeyboardDownResult>;
  keyboardUp(
    params: PageKeyboardUpParams,
    metadata?: Metadata
  ): Promise<PageKeyboardUpResult>;
  keyboardInsertText(
    params: PageKeyboardInsertTextParams,
    metadata?: Metadata
  ): Promise<PageKeyboardInsertTextResult>;
  keyboardType(
    params: PageKeyboardTypeParams,
    metadata?: Metadata
  ): Promise<PageKeyboardTypeResult>;
  keyboardPress(
    params: PageKeyboardPressParams,
    metadata?: Metadata
  ): Promise<PageKeyboardPressResult>;
  mouseMove(
    params: PageMouseMoveParams,
    metadata?: Metadata
  ): Promise<PageMouseMoveResult>;
  mouseDown(
    params: PageMouseDownParams,
    metadata?: Metadata
  ): Promise<PageMouseDownResult>;
  mouseUp(
    params: PageMouseUpParams,
    metadata?: Metadata
  ): Promise<PageMouseUpResult>;
  mouseClick(
    params: PageMouseClickParams,
    metadata?: Metadata
  ): Promise<PageMouseClickResult>;
  mouseWheel(
    params: PageMouseWheelParams,
    metadata?: Metadata
  ): Promise<PageMouseWheelResult>;
  touchscreenTap(
    params: PageTouchscreenTapParams,
    metadata?: Metadata
  ): Promise<PageTouchscreenTapResult>;
  accessibilitySnapshot(
    params: PageAccessibilitySnapshotParams,
    metadata?: Metadata
  ): Promise<PageAccessibilitySnapshotResult>;
  pdf(params: PagePdfParams, metadata?: Metadata): Promise<PagePdfResult>;
  startJSCoverage(
    params: PageStartJSCoverageParams,
    metadata?: Metadata
  ): Promise<PageStartJSCoverageResult>;
  stopJSCoverage(
    params?: PageStopJSCoverageParams,
    metadata?: Metadata
  ): Promise<PageStopJSCoverageResult>;
  startCSSCoverage(
    params: PageStartCSSCoverageParams,
    metadata?: Metadata
  ): Promise<PageStartCSSCoverageResult>;
  stopCSSCoverage(
    params?: PageStopCSSCoverageParams,
    metadata?: Metadata
  ): Promise<PageStopCSSCoverageResult>;
  bringToFront(
    params?: PageBringToFrontParams,
    metadata?: Metadata
  ): Promise<PageBringToFrontResult>;
}
export type PageBindingCallEvent = {
  binding: BindingCallChannel;
};
export type PageCloseEvent = {};
export type PageConsoleEvent = {
  message: ConsoleMessageChannel;
};
export type PageCrashEvent = {};
export type PageDialogEvent = {
  dialog: DialogChannel;
};
export type PageDownloadEvent = {
  url: string;
  suggestedFilename: string;
  artifact: ArtifactChannel;
};
export type PageFileChooserEvent = {
  element: ElementHandleChannel;
  isMultiple: boolean;
};
export type PageFrameAttachedEvent = {
  frame: FrameChannel;
};
export type PageFrameDetachedEvent = {
  frame: FrameChannel;
};
export type PagePageErrorEvent = {
  error: SerializedError;
};
export type PageRouteEvent = {
  route: RouteChannel;
};
export type PageVideoEvent = {
  artifact: ArtifactChannel;
};
export type PageWebSocketEvent = {
  webSocket: WebSocketChannel;
};
export type PageWorkerEvent = {
  worker: WorkerChannel;
};
export type PageSetDefaultNavigationTimeoutNoReplyParams = {
  timeout?: number;
};
export type PageSetDefaultNavigationTimeoutNoReplyOptions = {
  timeout?: number;
};
export type PageSetDefaultNavigationTimeoutNoReplyResult = void;
export type PageSetDefaultTimeoutNoReplyParams = {
  timeout?: number;
};
export type PageSetDefaultTimeoutNoReplyOptions = {
  timeout?: number;
};
export type PageSetDefaultTimeoutNoReplyResult = void;
export type PageSetFileChooserInterceptedNoReplyParams = {
  intercepted: boolean;
};
export type PageSetFileChooserInterceptedNoReplyOptions = {};
export type PageSetFileChooserInterceptedNoReplyResult = void;
export type PageAddInitScriptParams = {
  source: string;
};
export type PageAddInitScriptOptions = {};
export type PageAddInitScriptResult = void;
export type PageCloseParams = {
  runBeforeUnload?: boolean;
};
export type PageCloseOptions = {
  runBeforeUnload?: boolean;
};
export type PageCloseResult = void;
export type PageEmulateMediaParams = {
  media?: "screen" | "print" | "null";
  colorScheme?: "dark" | "light" | "no-preference" | "null";
  reducedMotion?: "reduce" | "no-preference" | "null";
  forcedColors?: "active" | "none" | "null";
};
export type PageEmulateMediaOptions = {
  media?: "screen" | "print" | "null";
  colorScheme?: "dark" | "light" | "no-preference" | "null";
  reducedMotion?: "reduce" | "no-preference" | "null";
  forcedColors?: "active" | "none" | "null";
};
export type PageEmulateMediaResult = void;
export type PageExposeBindingParams = {
  name: string;
  needsHandle?: boolean;
};
export type PageExposeBindingOptions = {
  needsHandle?: boolean;
};
export type PageExposeBindingResult = void;
export type PageGoBackParams = {
  timeout?: number;
  waitUntil?: LifecycleEvent;
};
export type PageGoBackOptions = {
  timeout?: number;
  waitUntil?: LifecycleEvent;
};
export type PageGoBackResult = {
  response?: ResponseChannel;
};
export type PageGoForwardParams = {
  timeout?: number;
  waitUntil?: LifecycleEvent;
};
export type PageGoForwardOptions = {
  timeout?: number;
  waitUntil?: LifecycleEvent;
};
export type PageGoForwardResult = {
  response?: ResponseChannel;
};
export type PageReloadParams = {
  timeout?: number;
  waitUntil?: LifecycleEvent;
};
export type PageReloadOptions = {
  timeout?: number;
  waitUntil?: LifecycleEvent;
};
export type PageReloadResult = {
  response?: ResponseChannel;
};
export type PageExpectScreenshotParams = {
  expected?: Binary;
  timeout?: number;
  isNot: boolean;
  locator?: {
    frame: FrameChannel;
    selector: string;
  };
  comparatorOptions?: {
    maxDiffPixels?: number;
    maxDiffPixelRatio?: number;
    threshold?: number;
  };
  screenshotOptions?: {
    fullPage?: boolean;
    clip?: Rect;
    omitBackground?: boolean;
    caret?: "hide" | "initial";
    animations?: "disabled" | "allow";
    scale?: "css" | "device";
    mask?: {
      frame: FrameChannel;
      selector: string;
    }[];
  };
};
export type PageExpectScreenshotOptions = {
  expected?: Binary;
  timeout?: number;
  locator?: {
    frame: FrameChannel;
    selector: string;
  };
  comparatorOptions?: {
    maxDiffPixels?: number;
    maxDiffPixelRatio?: number;
    threshold?: number;
  };
  screenshotOptions?: {
    fullPage?: boolean;
    clip?: Rect;
    omitBackground?: boolean;
    caret?: "hide" | "initial";
    animations?: "disabled" | "allow";
    scale?: "css" | "device";
    mask?: {
      frame: FrameChannel;
      selector: string;
    }[];
  };
};
export type PageExpectScreenshotResult = {
  diff?: Binary;
  errorMessage?: string;
  actual?: Binary;
  previous?: Binary;
  log?: string[];
};
export type PageScreenshotParams = {
  timeout?: number;
  type?: "png" | "jpeg";
  quality?: number;
  fullPage?: boolean;
  clip?: Rect;
  omitBackground?: boolean;
  caret?: "hide" | "initial";
  animations?: "disabled" | "allow";
  scale?: "css" | "device";
  mask?: {
    frame: FrameChannel;
    selector: string;
  }[];
};
export type PageScreenshotOptions = {
  timeout?: number;
  type?: "png" | "jpeg";
  quality?: number;
  fullPage?: boolean;
  clip?: Rect;
  omitBackground?: boolean;
  caret?: "hide" | "initial";
  animations?: "disabled" | "allow";
  scale?: "css" | "device";
  mask?: {
    frame: FrameChannel;
    selector: string;
  }[];
};
export type PageScreenshotResult = {
  binary: Binary;
};
export type PageSetExtraHTTPHeadersParams = {
  headers: NameValue[];
};
export type PageSetExtraHTTPHeadersOptions = {};
export type PageSetExtraHTTPHeadersResult = void;
export type PageSetNetworkInterceptionEnabledParams = {
  enabled: boolean;
};
export type PageSetNetworkInterceptionEnabledOptions = {};
export type PageSetNetworkInterceptionEnabledResult = void;
export type PageSetViewportSizeParams = {
  viewportSize: {
    width: number;
    height: number;
  };
};
export type PageSetViewportSizeOptions = {};
export type PageSetViewportSizeResult = void;
export type PageKeyboardDownParams = {
  key: string;
};
export type PageKeyboardDownOptions = {};
export type PageKeyboardDownResult = void;
export type PageKeyboardUpParams = {
  key: string;
};
export type PageKeyboardUpOptions = {};
export type PageKeyboardUpResult = void;
export type PageKeyboardInsertTextParams = {
  text: string;
};
export type PageKeyboardInsertTextOptions = {};
export type PageKeyboardInsertTextResult = void;
export type PageKeyboardTypeParams = {
  text: string;
  delay?: number;
};
export type PageKeyboardTypeOptions = {
  delay?: number;
};
export type PageKeyboardTypeResult = void;
export type PageKeyboardPressParams = {
  key: string;
  delay?: number;
};
export type PageKeyboardPressOptions = {
  delay?: number;
};
export type PageKeyboardPressResult = void;
export type PageMouseMoveParams = {
  x: number;
  y: number;
  steps?: number;
};
export type PageMouseMoveOptions = {
  steps?: number;
};
export type PageMouseMoveResult = void;
export type PageMouseDownParams = {
  button?: "left" | "right" | "middle";
  clickCount?: number;
};
export type PageMouseDownOptions = {
  button?: "left" | "right" | "middle";
  clickCount?: number;
};
export type PageMouseDownResult = void;
export type PageMouseUpParams = {
  button?: "left" | "right" | "middle";
  clickCount?: number;
};
export type PageMouseUpOptions = {
  button?: "left" | "right" | "middle";
  clickCount?: number;
};
export type PageMouseUpResult = void;
export type PageMouseClickParams = {
  x: number;
  y: number;
  delay?: number;
  button?: "left" | "right" | "middle";
  clickCount?: number;
};
export type PageMouseClickOptions = {
  delay?: number;
  button?: "left" | "right" | "middle";
  clickCount?: number;
};
export type PageMouseClickResult = void;
export type PageMouseWheelParams = {
  deltaX: number;
  deltaY: number;
};
export type PageMouseWheelOptions = {};
export type PageMouseWheelResult = void;
export type PageTouchscreenTapParams = {
  x: number;
  y: number;
};
export type PageTouchscreenTapOptions = {};
export type PageTouchscreenTapResult = void;
export type PageAccessibilitySnapshotParams = {
  interestingOnly?: boolean;
  root?: ElementHandleChannel;
};
export type PageAccessibilitySnapshotOptions = {
  interestingOnly?: boolean;
  root?: ElementHandleChannel;
};
export type PageAccessibilitySnapshotResult = {
  rootAXNode?: AXNode;
};
export type PagePdfParams = {
  scale?: number;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
  landscape?: boolean;
  pageRanges?: string;
  format?: string;
  width?: string;
  height?: string;
  preferCSSPageSize?: boolean;
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
};
export type PagePdfOptions = {
  scale?: number;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
  landscape?: boolean;
  pageRanges?: string;
  format?: string;
  width?: string;
  height?: string;
  preferCSSPageSize?: boolean;
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
};
export type PagePdfResult = {
  pdf: Binary;
};
export type PageStartJSCoverageParams = {
  resetOnNavigation?: boolean;
  reportAnonymousScripts?: boolean;
};
export type PageStartJSCoverageOptions = {
  resetOnNavigation?: boolean;
  reportAnonymousScripts?: boolean;
};
export type PageStartJSCoverageResult = void;
export type PageStopJSCoverageParams = {};
export type PageStopJSCoverageOptions = {};
export type PageStopJSCoverageResult = {
  entries: {
    url: string;
    scriptId: string;
    source?: string;
    functions: {
      functionName: string;
      isBlockCoverage: boolean;
      ranges: {
        startOffset: number;
        endOffset: number;
        count: number;
      }[];
    }[];
  }[];
};
export type PageStartCSSCoverageParams = {
  resetOnNavigation?: boolean;
};
export type PageStartCSSCoverageOptions = {
  resetOnNavigation?: boolean;
};
export type PageStartCSSCoverageResult = void;
export type PageStopCSSCoverageParams = {};
export type PageStopCSSCoverageOptions = {};
export type PageStopCSSCoverageResult = {
  entries: {
    url: string;
    text?: string;
    ranges: {
      start: number;
      end: number;
    }[];
  }[];
};
export type PageBringToFrontParams = {};
export type PageBringToFrontOptions = {};
export type PageBringToFrontResult = void;

export interface PageEvents {
  bindingCall: PageBindingCallEvent;
  close: PageCloseEvent;
  console: PageConsoleEvent;
  crash: PageCrashEvent;
  dialog: PageDialogEvent;
  download: PageDownloadEvent;
  fileChooser: PageFileChooserEvent;
  frameAttached: PageFrameAttachedEvent;
  frameDetached: PageFrameDetachedEvent;
  pageError: PagePageErrorEvent;
  route: PageRouteEvent;
  video: PageVideoEvent;
  webSocket: PageWebSocketEvent;
  worker: PageWorkerEvent;
}

// ----------- Frame -----------
export type FrameInitializer = {
  url: string;
  name: string;
  parentFrame?: FrameChannel;
  loadStates: LifecycleEvent[];
};
export interface FrameEventTarget {
  on(event: "loadstate", callback: (params: FrameLoadstateEvent) => void): this;
  on(event: "navigated", callback: (params: FrameNavigatedEvent) => void): this;
}
export interface FrameChannel extends FrameEventTarget, Channel {
  _type_Frame: boolean;
  evalOnSelector(
    params: FrameEvalOnSelectorParams,
    metadata?: Metadata
  ): Promise<FrameEvalOnSelectorResult>;
  evalOnSelectorAll(
    params: FrameEvalOnSelectorAllParams,
    metadata?: Metadata
  ): Promise<FrameEvalOnSelectorAllResult>;
  addScriptTag(
    params: FrameAddScriptTagParams,
    metadata?: Metadata
  ): Promise<FrameAddScriptTagResult>;
  addStyleTag(
    params: FrameAddStyleTagParams,
    metadata?: Metadata
  ): Promise<FrameAddStyleTagResult>;
  check(
    params: FrameCheckParams,
    metadata?: Metadata
  ): Promise<FrameCheckResult>;
  click(
    params: FrameClickParams,
    metadata?: Metadata
  ): Promise<FrameClickResult>;
  content(
    params?: FrameContentParams,
    metadata?: Metadata
  ): Promise<FrameContentResult>;
  dragAndDrop(
    params: FrameDragAndDropParams,
    metadata?: Metadata
  ): Promise<FrameDragAndDropResult>;
  dblclick(
    params: FrameDblclickParams,
    metadata?: Metadata
  ): Promise<FrameDblclickResult>;
  dispatchEvent(
    params: FrameDispatchEventParams,
    metadata?: Metadata
  ): Promise<FrameDispatchEventResult>;
  evaluateExpression(
    params: FrameEvaluateExpressionParams,
    metadata?: Metadata
  ): Promise<FrameEvaluateExpressionResult>;
  evaluateExpressionHandle(
    params: FrameEvaluateExpressionHandleParams,
    metadata?: Metadata
  ): Promise<FrameEvaluateExpressionHandleResult>;
  fill(params: FrameFillParams, metadata?: Metadata): Promise<FrameFillResult>;
  focus(
    params: FrameFocusParams,
    metadata?: Metadata
  ): Promise<FrameFocusResult>;
  frameElement(
    params?: FrameFrameElementParams,
    metadata?: Metadata
  ): Promise<FrameFrameElementResult>;
  highlight(
    params: FrameHighlightParams,
    metadata?: Metadata
  ): Promise<FrameHighlightResult>;
  getAttribute(
    params: FrameGetAttributeParams,
    metadata?: Metadata
  ): Promise<FrameGetAttributeResult>;
  goto(params: FrameGotoParams, metadata?: Metadata): Promise<FrameGotoResult>;
  hover(
    params: FrameHoverParams,
    metadata?: Metadata
  ): Promise<FrameHoverResult>;
  innerHTML(
    params: FrameInnerHTMLParams,
    metadata?: Metadata
  ): Promise<FrameInnerHTMLResult>;
  innerText(
    params: FrameInnerTextParams,
    metadata?: Metadata
  ): Promise<FrameInnerTextResult>;
  inputValue(
    params: FrameInputValueParams,
    metadata?: Metadata
  ): Promise<FrameInputValueResult>;
  isChecked(
    params: FrameIsCheckedParams,
    metadata?: Metadata
  ): Promise<FrameIsCheckedResult>;
  isDisabled(
    params: FrameIsDisabledParams,
    metadata?: Metadata
  ): Promise<FrameIsDisabledResult>;
  isEnabled(
    params: FrameIsEnabledParams,
    metadata?: Metadata
  ): Promise<FrameIsEnabledResult>;
  isHidden(
    params: FrameIsHiddenParams,
    metadata?: Metadata
  ): Promise<FrameIsHiddenResult>;
  isVisible(
    params: FrameIsVisibleParams,
    metadata?: Metadata
  ): Promise<FrameIsVisibleResult>;
  isEditable(
    params: FrameIsEditableParams,
    metadata?: Metadata
  ): Promise<FrameIsEditableResult>;
  press(
    params: FramePressParams,
    metadata?: Metadata
  ): Promise<FramePressResult>;
  querySelector(
    params: FrameQuerySelectorParams,
    metadata?: Metadata
  ): Promise<FrameQuerySelectorResult>;
  querySelectorAll(
    params: FrameQuerySelectorAllParams,
    metadata?: Metadata
  ): Promise<FrameQuerySelectorAllResult>;
  queryCount(
    params: FrameQueryCountParams,
    metadata?: Metadata
  ): Promise<FrameQueryCountResult>;
  selectOption(
    params: FrameSelectOptionParams,
    metadata?: Metadata
  ): Promise<FrameSelectOptionResult>;
  setContent(
    params: FrameSetContentParams,
    metadata?: Metadata
  ): Promise<FrameSetContentResult>;
  setInputFiles(
    params: FrameSetInputFilesParams,
    metadata?: Metadata
  ): Promise<FrameSetInputFilesResult>;
  setInputFilePaths(
    params: FrameSetInputFilePathsParams,
    metadata?: Metadata
  ): Promise<FrameSetInputFilePathsResult>;
  tap(params: FrameTapParams, metadata?: Metadata): Promise<FrameTapResult>;
  textContent(
    params: FrameTextContentParams,
    metadata?: Metadata
  ): Promise<FrameTextContentResult>;
  title(
    params?: FrameTitleParams,
    metadata?: Metadata
  ): Promise<FrameTitleResult>;
  type(params: FrameTypeParams, metadata?: Metadata): Promise<FrameTypeResult>;
  uncheck(
    params: FrameUncheckParams,
    metadata?: Metadata
  ): Promise<FrameUncheckResult>;
  waitForTimeout(
    params: FrameWaitForTimeoutParams,
    metadata?: Metadata
  ): Promise<FrameWaitForTimeoutResult>;
  waitForFunction(
    params: FrameWaitForFunctionParams,
    metadata?: Metadata
  ): Promise<FrameWaitForFunctionResult>;
  waitForSelector(
    params: FrameWaitForSelectorParams,
    metadata?: Metadata
  ): Promise<FrameWaitForSelectorResult>;
  expect(
    params: FrameExpectParams,
    metadata?: Metadata
  ): Promise<FrameExpectResult>;
}
export type FrameLoadstateEvent = {
  add?: LifecycleEvent;
  remove?: LifecycleEvent;
};
export type FrameNavigatedEvent = {
  url: string;
  name: string;
  newDocument?: {
    request?: RequestChannel;
  };
  error?: string;
};
export type FrameEvalOnSelectorParams = {
  selector: string;
  strict?: boolean;
  expression: string;
  isFunction?: boolean;
  arg: SerializedArgument;
};
export type FrameEvalOnSelectorOptions = {
  strict?: boolean;
  isFunction?: boolean;
};
export type FrameEvalOnSelectorResult = {
  value: SerializedValue;
};
export type FrameEvalOnSelectorAllParams = {
  selector: string;
  expression: string;
  isFunction?: boolean;
  arg: SerializedArgument;
};
export type FrameEvalOnSelectorAllOptions = {
  isFunction?: boolean;
};
export type FrameEvalOnSelectorAllResult = {
  value: SerializedValue;
};
export type FrameAddScriptTagParams = {
  url?: string;
  content?: string;
  type?: string;
};
export type FrameAddScriptTagOptions = {
  url?: string;
  content?: string;
  type?: string;
};
export type FrameAddScriptTagResult = {
  element: ElementHandleChannel;
};
export type FrameAddStyleTagParams = {
  url?: string;
  content?: string;
};
export type FrameAddStyleTagOptions = {
  url?: string;
  content?: string;
};
export type FrameAddStyleTagResult = {
  element: ElementHandleChannel;
};
export type FrameCheckParams = {
  selector: string;
  strict?: boolean;
  force?: boolean;
  noWaitAfter?: boolean;
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type FrameCheckOptions = {
  strict?: boolean;
  force?: boolean;
  noWaitAfter?: boolean;
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type FrameCheckResult = void;
export type FrameClickParams = {
  selector: string;
  strict?: boolean;
  force?: boolean;
  noWaitAfter?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  delay?: number;
  button?: "left" | "right" | "middle";
  clickCount?: number;
  timeout?: number;
  trial?: boolean;
};
export type FrameClickOptions = {
  strict?: boolean;
  force?: boolean;
  noWaitAfter?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  delay?: number;
  button?: "left" | "right" | "middle";
  clickCount?: number;
  timeout?: number;
  trial?: boolean;
};
export type FrameClickResult = void;
export type FrameContentParams = {};
export type FrameContentOptions = {};
export type FrameContentResult = {
  value: string;
};
export type FrameDragAndDropParams = {
  source: string;
  target: string;
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
  trial?: boolean;
  sourcePosition?: Point;
  targetPosition?: Point;
  strict?: boolean;
};
export type FrameDragAndDropOptions = {
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
  trial?: boolean;
  sourcePosition?: Point;
  targetPosition?: Point;
  strict?: boolean;
};
export type FrameDragAndDropResult = void;
export type FrameDblclickParams = {
  selector: string;
  strict?: boolean;
  force?: boolean;
  noWaitAfter?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  delay?: number;
  button?: "left" | "right" | "middle";
  timeout?: number;
  trial?: boolean;
};
export type FrameDblclickOptions = {
  strict?: boolean;
  force?: boolean;
  noWaitAfter?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  delay?: number;
  button?: "left" | "right" | "middle";
  timeout?: number;
  trial?: boolean;
};
export type FrameDblclickResult = void;
export type FrameDispatchEventParams = {
  selector: string;
  strict?: boolean;
  type: string;
  eventInit: SerializedArgument;
  timeout?: number;
};
export type FrameDispatchEventOptions = {
  strict?: boolean;
  timeout?: number;
};
export type FrameDispatchEventResult = void;
export type FrameEvaluateExpressionParams = {
  expression: string;
  isFunction?: boolean;
  arg: SerializedArgument;
};
export type FrameEvaluateExpressionOptions = {
  isFunction?: boolean;
};
export type FrameEvaluateExpressionResult = {
  value: SerializedValue;
};
export type FrameEvaluateExpressionHandleParams = {
  expression: string;
  isFunction?: boolean;
  arg: SerializedArgument;
};
export type FrameEvaluateExpressionHandleOptions = {
  isFunction?: boolean;
};
export type FrameEvaluateExpressionHandleResult = {
  handle: JSHandleChannel;
};
export type FrameFillParams = {
  selector: string;
  strict?: boolean;
  value: string;
  force?: boolean;
  timeout?: number;
  noWaitAfter?: boolean;
};
export type FrameFillOptions = {
  strict?: boolean;
  force?: boolean;
  timeout?: number;
  noWaitAfter?: boolean;
};
export type FrameFillResult = void;
export type FrameFocusParams = {
  selector: string;
  strict?: boolean;
  timeout?: number;
};
export type FrameFocusOptions = {
  strict?: boolean;
  timeout?: number;
};
export type FrameFocusResult = void;
export type FrameFrameElementParams = {};
export type FrameFrameElementOptions = {};
export type FrameFrameElementResult = {
  element: ElementHandleChannel;
};
export type FrameHighlightParams = {
  selector: string;
};
export type FrameHighlightOptions = {};
export type FrameHighlightResult = void;
export type FrameGetAttributeParams = {
  selector: string;
  strict?: boolean;
  name: string;
  timeout?: number;
};
export type FrameGetAttributeOptions = {
  strict?: boolean;
  timeout?: number;
};
export type FrameGetAttributeResult = {
  value?: string;
};
export type FrameGotoParams = {
  url: string;
  timeout?: number;
  waitUntil?: LifecycleEvent;
  referer?: string;
};
export type FrameGotoOptions = {
  timeout?: number;
  waitUntil?: LifecycleEvent;
  referer?: string;
};
export type FrameGotoResult = {
  response?: ResponseChannel;
};
export type FrameHoverParams = {
  selector: string;
  strict?: boolean;
  force?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type FrameHoverOptions = {
  strict?: boolean;
  force?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type FrameHoverResult = void;
export type FrameInnerHTMLParams = {
  selector: string;
  strict?: boolean;
  timeout?: number;
};
export type FrameInnerHTMLOptions = {
  strict?: boolean;
  timeout?: number;
};
export type FrameInnerHTMLResult = {
  value: string;
};
export type FrameInnerTextParams = {
  selector: string;
  strict?: boolean;
  timeout?: number;
};
export type FrameInnerTextOptions = {
  strict?: boolean;
  timeout?: number;
};
export type FrameInnerTextResult = {
  value: string;
};
export type FrameInputValueParams = {
  selector: string;
  strict?: boolean;
  timeout?: number;
};
export type FrameInputValueOptions = {
  strict?: boolean;
  timeout?: number;
};
export type FrameInputValueResult = {
  value: string;
};
export type FrameIsCheckedParams = {
  selector: string;
  strict?: boolean;
  timeout?: number;
};
export type FrameIsCheckedOptions = {
  strict?: boolean;
  timeout?: number;
};
export type FrameIsCheckedResult = {
  value: boolean;
};
export type FrameIsDisabledParams = {
  selector: string;
  strict?: boolean;
  timeout?: number;
};
export type FrameIsDisabledOptions = {
  strict?: boolean;
  timeout?: number;
};
export type FrameIsDisabledResult = {
  value: boolean;
};
export type FrameIsEnabledParams = {
  selector: string;
  strict?: boolean;
  timeout?: number;
};
export type FrameIsEnabledOptions = {
  strict?: boolean;
  timeout?: number;
};
export type FrameIsEnabledResult = {
  value: boolean;
};
export type FrameIsHiddenParams = {
  selector: string;
  strict?: boolean;
};
export type FrameIsHiddenOptions = {
  strict?: boolean;
};
export type FrameIsHiddenResult = {
  value: boolean;
};
export type FrameIsVisibleParams = {
  selector: string;
  strict?: boolean;
};
export type FrameIsVisibleOptions = {
  strict?: boolean;
};
export type FrameIsVisibleResult = {
  value: boolean;
};
export type FrameIsEditableParams = {
  selector: string;
  strict?: boolean;
  timeout?: number;
};
export type FrameIsEditableOptions = {
  strict?: boolean;
  timeout?: number;
};
export type FrameIsEditableResult = {
  value: boolean;
};
export type FramePressParams = {
  selector: string;
  strict?: boolean;
  key: string;
  delay?: number;
  noWaitAfter?: boolean;
  timeout?: number;
};
export type FramePressOptions = {
  strict?: boolean;
  delay?: number;
  noWaitAfter?: boolean;
  timeout?: number;
};
export type FramePressResult = void;
export type FrameQuerySelectorParams = {
  selector: string;
  strict?: boolean;
};
export type FrameQuerySelectorOptions = {
  strict?: boolean;
};
export type FrameQuerySelectorResult = {
  element?: ElementHandleChannel;
};
export type FrameQuerySelectorAllParams = {
  selector: string;
};
export type FrameQuerySelectorAllOptions = {};
export type FrameQuerySelectorAllResult = {
  elements: ElementHandleChannel[];
};
export type FrameQueryCountParams = {
  selector: string;
};
export type FrameQueryCountOptions = {};
export type FrameQueryCountResult = {
  value: number;
};
export type FrameSelectOptionParams = {
  selector: string;
  strict?: boolean;
  elements?: ElementHandleChannel[];
  options?: {
    value?: string;
    label?: string;
    index?: number;
  }[];
  force?: boolean;
  timeout?: number;
  noWaitAfter?: boolean;
};
export type FrameSelectOptionOptions = {
  strict?: boolean;
  elements?: ElementHandleChannel[];
  options?: {
    value?: string;
    label?: string;
    index?: number;
  }[];
  force?: boolean;
  timeout?: number;
  noWaitAfter?: boolean;
};
export type FrameSelectOptionResult = {
  values: string[];
};
export type FrameSetContentParams = {
  html: string;
  timeout?: number;
  waitUntil?: LifecycleEvent;
};
export type FrameSetContentOptions = {
  timeout?: number;
  waitUntil?: LifecycleEvent;
};
export type FrameSetContentResult = void;
export type FrameSetInputFilesParams = {
  selector: string;
  strict?: boolean;
  files: {
    name: string;
    mimeType?: string;
    buffer: Binary;
  }[];
  timeout?: number;
  noWaitAfter?: boolean;
};
export type FrameSetInputFilesOptions = {
  strict?: boolean;
  timeout?: number;
  noWaitAfter?: boolean;
};
export type FrameSetInputFilesResult = void;
export type FrameSetInputFilePathsParams = {
  selector: string;
  strict?: boolean;
  localPaths?: string[];
  streams?: WritableStreamChannel[];
  timeout?: number;
  noWaitAfter?: boolean;
};
export type FrameSetInputFilePathsOptions = {
  strict?: boolean;
  localPaths?: string[];
  streams?: WritableStreamChannel[];
  timeout?: number;
  noWaitAfter?: boolean;
};
export type FrameSetInputFilePathsResult = void;
export type FrameTapParams = {
  selector: string;
  strict?: boolean;
  force?: boolean;
  noWaitAfter?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type FrameTapOptions = {
  strict?: boolean;
  force?: boolean;
  noWaitAfter?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type FrameTapResult = void;
export type FrameTextContentParams = {
  selector: string;
  strict?: boolean;
  timeout?: number;
};
export type FrameTextContentOptions = {
  strict?: boolean;
  timeout?: number;
};
export type FrameTextContentResult = {
  value?: string;
};
export type FrameTitleParams = {};
export type FrameTitleOptions = {};
export type FrameTitleResult = {
  value: string;
};
export type FrameTypeParams = {
  selector: string;
  strict?: boolean;
  text: string;
  delay?: number;
  noWaitAfter?: boolean;
  timeout?: number;
};
export type FrameTypeOptions = {
  strict?: boolean;
  delay?: number;
  noWaitAfter?: boolean;
  timeout?: number;
};
export type FrameTypeResult = void;
export type FrameUncheckParams = {
  selector: string;
  strict?: boolean;
  force?: boolean;
  noWaitAfter?: boolean;
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type FrameUncheckOptions = {
  strict?: boolean;
  force?: boolean;
  noWaitAfter?: boolean;
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type FrameUncheckResult = void;
export type FrameWaitForTimeoutParams = {
  timeout: number;
};
export type FrameWaitForTimeoutOptions = {};
export type FrameWaitForTimeoutResult = void;
export type FrameWaitForFunctionParams = {
  expression: string;
  isFunction?: boolean;
  arg: SerializedArgument;
  timeout?: number;
  pollingInterval?: number;
};
export type FrameWaitForFunctionOptions = {
  isFunction?: boolean;
  timeout?: number;
  pollingInterval?: number;
};
export type FrameWaitForFunctionResult = {
  handle: JSHandleChannel;
};
export type FrameWaitForSelectorParams = {
  selector: string;
  strict?: boolean;
  timeout?: number;
  state?: "attached" | "detached" | "visible" | "hidden";
  omitReturnValue?: boolean;
};
export type FrameWaitForSelectorOptions = {
  strict?: boolean;
  timeout?: number;
  state?: "attached" | "detached" | "visible" | "hidden";
  omitReturnValue?: boolean;
};
export type FrameWaitForSelectorResult = {
  element?: ElementHandleChannel;
};
export type FrameExpectParams = {
  selector: string;
  expression: string;
  expressionArg?: any;
  expectedText?: ExpectedTextValue[];
  expectedNumber?: number;
  expectedValue?: SerializedArgument;
  useInnerText?: boolean;
  isNot: boolean;
  timeout?: number;
};
export type FrameExpectOptions = {
  expressionArg?: any;
  expectedText?: ExpectedTextValue[];
  expectedNumber?: number;
  expectedValue?: SerializedArgument;
  useInnerText?: boolean;
  timeout?: number;
};
export type FrameExpectResult = {
  matches: boolean;
  received?: SerializedValue;
  log?: string[];
};

export interface FrameEvents {
  loadstate: FrameLoadstateEvent;
  navigated: FrameNavigatedEvent;
}

// ----------- Worker -----------
export type WorkerInitializer = {
  url: string;
};
export interface WorkerEventTarget {
  on(event: "close", callback: (params: WorkerCloseEvent) => void): this;
}
export interface WorkerChannel extends WorkerEventTarget, Channel {
  _type_Worker: boolean;
  evaluateExpression(
    params: WorkerEvaluateExpressionParams,
    metadata?: Metadata
  ): Promise<WorkerEvaluateExpressionResult>;
  evaluateExpressionHandle(
    params: WorkerEvaluateExpressionHandleParams,
    metadata?: Metadata
  ): Promise<WorkerEvaluateExpressionHandleResult>;
}
export type WorkerCloseEvent = {};
export type WorkerEvaluateExpressionParams = {
  expression: string;
  isFunction?: boolean;
  arg: SerializedArgument;
};
export type WorkerEvaluateExpressionOptions = {
  isFunction?: boolean;
};
export type WorkerEvaluateExpressionResult = {
  value: SerializedValue;
};
export type WorkerEvaluateExpressionHandleParams = {
  expression: string;
  isFunction?: boolean;
  arg: SerializedArgument;
};
export type WorkerEvaluateExpressionHandleOptions = {
  isFunction?: boolean;
};
export type WorkerEvaluateExpressionHandleResult = {
  handle: JSHandleChannel;
};

export interface WorkerEvents {
  close: WorkerCloseEvent;
}

// ----------- JSHandle -----------
export type JSHandleInitializer = {
  preview: string;
};
export interface JSHandleEventTarget {
  on(
    event: "previewUpdated",
    callback: (params: JSHandlePreviewUpdatedEvent) => void
  ): this;
}
export interface JSHandleChannel extends JSHandleEventTarget, Channel {
  _type_JSHandle: boolean;
  dispose(
    params?: JSHandleDisposeParams,
    metadata?: Metadata
  ): Promise<JSHandleDisposeResult>;
  evaluateExpression(
    params: JSHandleEvaluateExpressionParams,
    metadata?: Metadata
  ): Promise<JSHandleEvaluateExpressionResult>;
  evaluateExpressionHandle(
    params: JSHandleEvaluateExpressionHandleParams,
    metadata?: Metadata
  ): Promise<JSHandleEvaluateExpressionHandleResult>;
  getPropertyList(
    params?: JSHandleGetPropertyListParams,
    metadata?: Metadata
  ): Promise<JSHandleGetPropertyListResult>;
  getProperty(
    params: JSHandleGetPropertyParams,
    metadata?: Metadata
  ): Promise<JSHandleGetPropertyResult>;
  jsonValue(
    params?: JSHandleJsonValueParams,
    metadata?: Metadata
  ): Promise<JSHandleJsonValueResult>;
}
export type JSHandlePreviewUpdatedEvent = {
  preview: string;
};
export type JSHandleDisposeParams = {};
export type JSHandleDisposeOptions = {};
export type JSHandleDisposeResult = void;
export type JSHandleEvaluateExpressionParams = {
  expression: string;
  isFunction?: boolean;
  arg: SerializedArgument;
};
export type JSHandleEvaluateExpressionOptions = {
  isFunction?: boolean;
};
export type JSHandleEvaluateExpressionResult = {
  value: SerializedValue;
};
export type JSHandleEvaluateExpressionHandleParams = {
  expression: string;
  isFunction?: boolean;
  arg: SerializedArgument;
};
export type JSHandleEvaluateExpressionHandleOptions = {
  isFunction?: boolean;
};
export type JSHandleEvaluateExpressionHandleResult = {
  handle: JSHandleChannel;
};
export type JSHandleGetPropertyListParams = {};
export type JSHandleGetPropertyListOptions = {};
export type JSHandleGetPropertyListResult = {
  properties: {
    name: string;
    value: JSHandleChannel;
  }[];
};
export type JSHandleGetPropertyParams = {
  name: string;
};
export type JSHandleGetPropertyOptions = {};
export type JSHandleGetPropertyResult = {
  handle: JSHandleChannel;
};
export type JSHandleJsonValueParams = {};
export type JSHandleJsonValueOptions = {};
export type JSHandleJsonValueResult = {
  value: SerializedValue;
};

export interface JSHandleEvents {
  previewUpdated: JSHandlePreviewUpdatedEvent;
}

// ----------- ElementHandle -----------
export type ElementHandleInitializer = {};
export interface ElementHandleEventTarget {}
export interface ElementHandleChannel
  extends ElementHandleEventTarget,
    JSHandleChannel {
  _type_ElementHandle: boolean;
  evalOnSelector(
    params: ElementHandleEvalOnSelectorParams,
    metadata?: Metadata
  ): Promise<ElementHandleEvalOnSelectorResult>;
  evalOnSelectorAll(
    params: ElementHandleEvalOnSelectorAllParams,
    metadata?: Metadata
  ): Promise<ElementHandleEvalOnSelectorAllResult>;
  boundingBox(
    params?: ElementHandleBoundingBoxParams,
    metadata?: Metadata
  ): Promise<ElementHandleBoundingBoxResult>;
  check(
    params: ElementHandleCheckParams,
    metadata?: Metadata
  ): Promise<ElementHandleCheckResult>;
  click(
    params: ElementHandleClickParams,
    metadata?: Metadata
  ): Promise<ElementHandleClickResult>;
  contentFrame(
    params?: ElementHandleContentFrameParams,
    metadata?: Metadata
  ): Promise<ElementHandleContentFrameResult>;
  dblclick(
    params: ElementHandleDblclickParams,
    metadata?: Metadata
  ): Promise<ElementHandleDblclickResult>;
  dispatchEvent(
    params: ElementHandleDispatchEventParams,
    metadata?: Metadata
  ): Promise<ElementHandleDispatchEventResult>;
  fill(
    params: ElementHandleFillParams,
    metadata?: Metadata
  ): Promise<ElementHandleFillResult>;
  focus(
    params?: ElementHandleFocusParams,
    metadata?: Metadata
  ): Promise<ElementHandleFocusResult>;
  getAttribute(
    params: ElementHandleGetAttributeParams,
    metadata?: Metadata
  ): Promise<ElementHandleGetAttributeResult>;
  hover(
    params: ElementHandleHoverParams,
    metadata?: Metadata
  ): Promise<ElementHandleHoverResult>;
  innerHTML(
    params?: ElementHandleInnerHTMLParams,
    metadata?: Metadata
  ): Promise<ElementHandleInnerHTMLResult>;
  innerText(
    params?: ElementHandleInnerTextParams,
    metadata?: Metadata
  ): Promise<ElementHandleInnerTextResult>;
  inputValue(
    params?: ElementHandleInputValueParams,
    metadata?: Metadata
  ): Promise<ElementHandleInputValueResult>;
  isChecked(
    params?: ElementHandleIsCheckedParams,
    metadata?: Metadata
  ): Promise<ElementHandleIsCheckedResult>;
  isDisabled(
    params?: ElementHandleIsDisabledParams,
    metadata?: Metadata
  ): Promise<ElementHandleIsDisabledResult>;
  isEditable(
    params?: ElementHandleIsEditableParams,
    metadata?: Metadata
  ): Promise<ElementHandleIsEditableResult>;
  isEnabled(
    params?: ElementHandleIsEnabledParams,
    metadata?: Metadata
  ): Promise<ElementHandleIsEnabledResult>;
  isHidden(
    params?: ElementHandleIsHiddenParams,
    metadata?: Metadata
  ): Promise<ElementHandleIsHiddenResult>;
  isVisible(
    params?: ElementHandleIsVisibleParams,
    metadata?: Metadata
  ): Promise<ElementHandleIsVisibleResult>;
  ownerFrame(
    params?: ElementHandleOwnerFrameParams,
    metadata?: Metadata
  ): Promise<ElementHandleOwnerFrameResult>;
  press(
    params: ElementHandlePressParams,
    metadata?: Metadata
  ): Promise<ElementHandlePressResult>;
  querySelector(
    params: ElementHandleQuerySelectorParams,
    metadata?: Metadata
  ): Promise<ElementHandleQuerySelectorResult>;
  querySelectorAll(
    params: ElementHandleQuerySelectorAllParams,
    metadata?: Metadata
  ): Promise<ElementHandleQuerySelectorAllResult>;
  screenshot(
    params: ElementHandleScreenshotParams,
    metadata?: Metadata
  ): Promise<ElementHandleScreenshotResult>;
  scrollIntoViewIfNeeded(
    params: ElementHandleScrollIntoViewIfNeededParams,
    metadata?: Metadata
  ): Promise<ElementHandleScrollIntoViewIfNeededResult>;
  selectOption(
    params: ElementHandleSelectOptionParams,
    metadata?: Metadata
  ): Promise<ElementHandleSelectOptionResult>;
  selectText(
    params: ElementHandleSelectTextParams,
    metadata?: Metadata
  ): Promise<ElementHandleSelectTextResult>;
  setInputFiles(
    params: ElementHandleSetInputFilesParams,
    metadata?: Metadata
  ): Promise<ElementHandleSetInputFilesResult>;
  setInputFilePaths(
    params: ElementHandleSetInputFilePathsParams,
    metadata?: Metadata
  ): Promise<ElementHandleSetInputFilePathsResult>;
  tap(
    params: ElementHandleTapParams,
    metadata?: Metadata
  ): Promise<ElementHandleTapResult>;
  textContent(
    params?: ElementHandleTextContentParams,
    metadata?: Metadata
  ): Promise<ElementHandleTextContentResult>;
  type(
    params: ElementHandleTypeParams,
    metadata?: Metadata
  ): Promise<ElementHandleTypeResult>;
  uncheck(
    params: ElementHandleUncheckParams,
    metadata?: Metadata
  ): Promise<ElementHandleUncheckResult>;
  waitForElementState(
    params: ElementHandleWaitForElementStateParams,
    metadata?: Metadata
  ): Promise<ElementHandleWaitForElementStateResult>;
  waitForSelector(
    params: ElementHandleWaitForSelectorParams,
    metadata?: Metadata
  ): Promise<ElementHandleWaitForSelectorResult>;
}
export type ElementHandleEvalOnSelectorParams = {
  selector: string;
  strict?: boolean;
  expression: string;
  isFunction?: boolean;
  arg: SerializedArgument;
};
export type ElementHandleEvalOnSelectorOptions = {
  strict?: boolean;
  isFunction?: boolean;
};
export type ElementHandleEvalOnSelectorResult = {
  value: SerializedValue;
};
export type ElementHandleEvalOnSelectorAllParams = {
  selector: string;
  expression: string;
  isFunction?: boolean;
  arg: SerializedArgument;
};
export type ElementHandleEvalOnSelectorAllOptions = {
  isFunction?: boolean;
};
export type ElementHandleEvalOnSelectorAllResult = {
  value: SerializedValue;
};
export type ElementHandleBoundingBoxParams = {};
export type ElementHandleBoundingBoxOptions = {};
export type ElementHandleBoundingBoxResult = {
  value?: Rect;
};
export type ElementHandleCheckParams = {
  force?: boolean;
  noWaitAfter?: boolean;
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type ElementHandleCheckOptions = {
  force?: boolean;
  noWaitAfter?: boolean;
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type ElementHandleCheckResult = void;
export type ElementHandleClickParams = {
  force?: boolean;
  noWaitAfter?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  delay?: number;
  button?: "left" | "right" | "middle";
  clickCount?: number;
  timeout?: number;
  trial?: boolean;
};
export type ElementHandleClickOptions = {
  force?: boolean;
  noWaitAfter?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  delay?: number;
  button?: "left" | "right" | "middle";
  clickCount?: number;
  timeout?: number;
  trial?: boolean;
};
export type ElementHandleClickResult = void;
export type ElementHandleContentFrameParams = {};
export type ElementHandleContentFrameOptions = {};
export type ElementHandleContentFrameResult = {
  frame?: FrameChannel;
};
export type ElementHandleDblclickParams = {
  force?: boolean;
  noWaitAfter?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  delay?: number;
  button?: "left" | "right" | "middle";
  timeout?: number;
  trial?: boolean;
};
export type ElementHandleDblclickOptions = {
  force?: boolean;
  noWaitAfter?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  delay?: number;
  button?: "left" | "right" | "middle";
  timeout?: number;
  trial?: boolean;
};
export type ElementHandleDblclickResult = void;
export type ElementHandleDispatchEventParams = {
  type: string;
  eventInit: SerializedArgument;
};
export type ElementHandleDispatchEventOptions = {};
export type ElementHandleDispatchEventResult = void;
export type ElementHandleFillParams = {
  value: string;
  force?: boolean;
  timeout?: number;
  noWaitAfter?: boolean;
};
export type ElementHandleFillOptions = {
  force?: boolean;
  timeout?: number;
  noWaitAfter?: boolean;
};
export type ElementHandleFillResult = void;
export type ElementHandleFocusParams = {};
export type ElementHandleFocusOptions = {};
export type ElementHandleFocusResult = void;
export type ElementHandleGetAttributeParams = {
  name: string;
};
export type ElementHandleGetAttributeOptions = {};
export type ElementHandleGetAttributeResult = {
  value?: string;
};
export type ElementHandleHoverParams = {
  force?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type ElementHandleHoverOptions = {
  force?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type ElementHandleHoverResult = void;
export type ElementHandleInnerHTMLParams = {};
export type ElementHandleInnerHTMLOptions = {};
export type ElementHandleInnerHTMLResult = {
  value: string;
};
export type ElementHandleInnerTextParams = {};
export type ElementHandleInnerTextOptions = {};
export type ElementHandleInnerTextResult = {
  value: string;
};
export type ElementHandleInputValueParams = {};
export type ElementHandleInputValueOptions = {};
export type ElementHandleInputValueResult = {
  value: string;
};
export type ElementHandleIsCheckedParams = {};
export type ElementHandleIsCheckedOptions = {};
export type ElementHandleIsCheckedResult = {
  value: boolean;
};
export type ElementHandleIsDisabledParams = {};
export type ElementHandleIsDisabledOptions = {};
export type ElementHandleIsDisabledResult = {
  value: boolean;
};
export type ElementHandleIsEditableParams = {};
export type ElementHandleIsEditableOptions = {};
export type ElementHandleIsEditableResult = {
  value: boolean;
};
export type ElementHandleIsEnabledParams = {};
export type ElementHandleIsEnabledOptions = {};
export type ElementHandleIsEnabledResult = {
  value: boolean;
};
export type ElementHandleIsHiddenParams = {};
export type ElementHandleIsHiddenOptions = {};
export type ElementHandleIsHiddenResult = {
  value: boolean;
};
export type ElementHandleIsVisibleParams = {};
export type ElementHandleIsVisibleOptions = {};
export type ElementHandleIsVisibleResult = {
  value: boolean;
};
export type ElementHandleOwnerFrameParams = {};
export type ElementHandleOwnerFrameOptions = {};
export type ElementHandleOwnerFrameResult = {
  frame?: FrameChannel;
};
export type ElementHandlePressParams = {
  key: string;
  delay?: number;
  timeout?: number;
  noWaitAfter?: boolean;
};
export type ElementHandlePressOptions = {
  delay?: number;
  timeout?: number;
  noWaitAfter?: boolean;
};
export type ElementHandlePressResult = void;
export type ElementHandleQuerySelectorParams = {
  selector: string;
  strict?: boolean;
};
export type ElementHandleQuerySelectorOptions = {
  strict?: boolean;
};
export type ElementHandleQuerySelectorResult = {
  element?: ElementHandleChannel;
};
export type ElementHandleQuerySelectorAllParams = {
  selector: string;
};
export type ElementHandleQuerySelectorAllOptions = {};
export type ElementHandleQuerySelectorAllResult = {
  elements: ElementHandleChannel[];
};
export type ElementHandleScreenshotParams = {
  timeout?: number;
  type?: "png" | "jpeg";
  quality?: number;
  omitBackground?: boolean;
  caret?: "hide" | "initial";
  animations?: "disabled" | "allow";
  scale?: "css" | "device";
  mask?: {
    frame: FrameChannel;
    selector: string;
  }[];
};
export type ElementHandleScreenshotOptions = {
  timeout?: number;
  type?: "png" | "jpeg";
  quality?: number;
  omitBackground?: boolean;
  caret?: "hide" | "initial";
  animations?: "disabled" | "allow";
  scale?: "css" | "device";
  mask?: {
    frame: FrameChannel;
    selector: string;
  }[];
};
export type ElementHandleScreenshotResult = {
  binary: Binary;
};
export type ElementHandleScrollIntoViewIfNeededParams = {
  timeout?: number;
};
export type ElementHandleScrollIntoViewIfNeededOptions = {
  timeout?: number;
};
export type ElementHandleScrollIntoViewIfNeededResult = void;
export type ElementHandleSelectOptionParams = {
  elements?: ElementHandleChannel[];
  options?: {
    value?: string;
    label?: string;
    index?: number;
  }[];
  force?: boolean;
  timeout?: number;
  noWaitAfter?: boolean;
};
export type ElementHandleSelectOptionOptions = {
  elements?: ElementHandleChannel[];
  options?: {
    value?: string;
    label?: string;
    index?: number;
  }[];
  force?: boolean;
  timeout?: number;
  noWaitAfter?: boolean;
};
export type ElementHandleSelectOptionResult = {
  values: string[];
};
export type ElementHandleSelectTextParams = {
  force?: boolean;
  timeout?: number;
};
export type ElementHandleSelectTextOptions = {
  force?: boolean;
  timeout?: number;
};
export type ElementHandleSelectTextResult = void;
export type ElementHandleSetInputFilesParams = {
  files: {
    name: string;
    mimeType?: string;
    buffer: Binary;
  }[];
  timeout?: number;
  noWaitAfter?: boolean;
};
export type ElementHandleSetInputFilesOptions = {
  timeout?: number;
  noWaitAfter?: boolean;
};
export type ElementHandleSetInputFilesResult = void;
export type ElementHandleSetInputFilePathsParams = {
  localPaths?: string[];
  streams?: WritableStreamChannel[];
  timeout?: number;
  noWaitAfter?: boolean;
};
export type ElementHandleSetInputFilePathsOptions = {
  localPaths?: string[];
  streams?: WritableStreamChannel[];
  timeout?: number;
  noWaitAfter?: boolean;
};
export type ElementHandleSetInputFilePathsResult = void;
export type ElementHandleTapParams = {
  force?: boolean;
  noWaitAfter?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type ElementHandleTapOptions = {
  force?: boolean;
  noWaitAfter?: boolean;
  modifiers?: ("Alt" | "Control" | "Meta" | "Shift")[];
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type ElementHandleTapResult = void;
export type ElementHandleTextContentParams = {};
export type ElementHandleTextContentOptions = {};
export type ElementHandleTextContentResult = {
  value?: string;
};
export type ElementHandleTypeParams = {
  text: string;
  delay?: number;
  noWaitAfter?: boolean;
  timeout?: number;
};
export type ElementHandleTypeOptions = {
  delay?: number;
  noWaitAfter?: boolean;
  timeout?: number;
};
export type ElementHandleTypeResult = void;
export type ElementHandleUncheckParams = {
  force?: boolean;
  noWaitAfter?: boolean;
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type ElementHandleUncheckOptions = {
  force?: boolean;
  noWaitAfter?: boolean;
  position?: Point;
  timeout?: number;
  trial?: boolean;
};
export type ElementHandleUncheckResult = void;
export type ElementHandleWaitForElementStateParams = {
  state: "visible" | "hidden" | "stable" | "enabled" | "disabled" | "editable";
  timeout?: number;
};
export type ElementHandleWaitForElementStateOptions = {
  timeout?: number;
};
export type ElementHandleWaitForElementStateResult = void;
export type ElementHandleWaitForSelectorParams = {
  selector: string;
  strict?: boolean;
  timeout?: number;
  state?: "attached" | "detached" | "visible" | "hidden";
};
export type ElementHandleWaitForSelectorOptions = {
  strict?: boolean;
  timeout?: number;
  state?: "attached" | "detached" | "visible" | "hidden";
};
export type ElementHandleWaitForSelectorResult = {
  element?: ElementHandleChannel;
};

export interface ElementHandleEvents {}

// ----------- Request -----------
export type RequestInitializer = {
  frame?: FrameChannel;
  serviceWorker?: WorkerChannel;
  url: string;
  resourceType: string;
  method: string;
  postData?: Binary;
  headers: NameValue[];
  isNavigationRequest: boolean;
  redirectedFrom?: RequestChannel;
};
export interface RequestEventTarget {}
export interface RequestChannel extends RequestEventTarget, Channel {
  _type_Request: boolean;
  response(
    params?: RequestResponseParams,
    metadata?: Metadata
  ): Promise<RequestResponseResult>;
  rawRequestHeaders(
    params?: RequestRawRequestHeadersParams,
    metadata?: Metadata
  ): Promise<RequestRawRequestHeadersResult>;
}
export type RequestResponseParams = {};
export type RequestResponseOptions = {};
export type RequestResponseResult = {
  response?: ResponseChannel;
};
export type RequestRawRequestHeadersParams = {};
export type RequestRawRequestHeadersOptions = {};
export type RequestRawRequestHeadersResult = {
  headers: NameValue[];
};

export interface RequestEvents {}

// ----------- Route -----------
export type RouteInitializer = {
  request: RequestChannel;
};
export interface RouteEventTarget {}
export interface RouteChannel extends RouteEventTarget, Channel {
  _type_Route: boolean;
  redirectNavigationRequest(
    params: RouteRedirectNavigationRequestParams,
    metadata?: Metadata
  ): Promise<RouteRedirectNavigationRequestResult>;
  abort(
    params: RouteAbortParams,
    metadata?: Metadata
  ): Promise<RouteAbortResult>;
  continue(
    params: RouteContinueParams,
    metadata?: Metadata
  ): Promise<RouteContinueResult>;
  fulfill(
    params: RouteFulfillParams,
    metadata?: Metadata
  ): Promise<RouteFulfillResult>;
}
export type RouteRedirectNavigationRequestParams = {
  url: string;
};
export type RouteRedirectNavigationRequestOptions = {};
export type RouteRedirectNavigationRequestResult = void;
export type RouteAbortParams = {
  errorCode?: string;
};
export type RouteAbortOptions = {
  errorCode?: string;
};
export type RouteAbortResult = void;
export type RouteContinueParams = {
  url?: string;
  method?: string;
  headers?: NameValue[];
  postData?: Binary;
};
export type RouteContinueOptions = {
  url?: string;
  method?: string;
  headers?: NameValue[];
  postData?: Binary;
};
export type RouteContinueResult = void;
export type RouteFulfillParams = {
  status?: number;
  headers?: NameValue[];
  body?: string;
  isBase64?: boolean;
  fetchResponseUid?: string;
};
export type RouteFulfillOptions = {
  status?: number;
  headers?: NameValue[];
  body?: string;
  isBase64?: boolean;
  fetchResponseUid?: string;
};
export type RouteFulfillResult = void;

export interface RouteEvents {}

export type ResourceTiming = {
  startTime: number;
  domainLookupStart: number;
  domainLookupEnd: number;
  connectStart: number;
  secureConnectionStart: number;
  connectEnd: number;
  requestStart: number;
  responseStart: number;
};

// ----------- Response -----------
export type ResponseInitializer = {
  request: RequestChannel;
  url: string;
  status: number;
  statusText: string;
  headers: NameValue[];
  timing: ResourceTiming;
  fromServiceWorker: boolean;
};
export interface ResponseEventTarget {}
export interface ResponseChannel extends ResponseEventTarget, Channel {
  _type_Response: boolean;
  body(
    params?: ResponseBodyParams,
    metadata?: Metadata
  ): Promise<ResponseBodyResult>;
  securityDetails(
    params?: ResponseSecurityDetailsParams,
    metadata?: Metadata
  ): Promise<ResponseSecurityDetailsResult>;
  serverAddr(
    params?: ResponseServerAddrParams,
    metadata?: Metadata
  ): Promise<ResponseServerAddrResult>;
  rawResponseHeaders(
    params?: ResponseRawResponseHeadersParams,
    metadata?: Metadata
  ): Promise<ResponseRawResponseHeadersResult>;
  sizes(
    params?: ResponseSizesParams,
    metadata?: Metadata
  ): Promise<ResponseSizesResult>;
}
export type ResponseBodyParams = {};
export type ResponseBodyOptions = {};
export type ResponseBodyResult = {
  binary: Binary;
};
export type ResponseSecurityDetailsParams = {};
export type ResponseSecurityDetailsOptions = {};
export type ResponseSecurityDetailsResult = {
  value?: SecurityDetails;
};
export type ResponseServerAddrParams = {};
export type ResponseServerAddrOptions = {};
export type ResponseServerAddrResult = {
  value?: RemoteAddr;
};
export type ResponseRawResponseHeadersParams = {};
export type ResponseRawResponseHeadersOptions = {};
export type ResponseRawResponseHeadersResult = {
  headers: NameValue[];
};
export type ResponseSizesParams = {};
export type ResponseSizesOptions = {};
export type ResponseSizesResult = {
  sizes: RequestSizes;
};

export interface ResponseEvents {}

export type SecurityDetails = {
  issuer?: string;
  protocol?: string;
  subjectName?: string;
  validFrom?: number;
  validTo?: number;
};

export type RequestSizes = {
  requestBodySize: number;
  requestHeadersSize: number;
  responseBodySize: number;
  responseHeadersSize: number;
};

export type RemoteAddr = {
  ipAddress: string;
  port: number;
};

// ----------- WebSocket -----------
export type WebSocketInitializer = {
  url: string;
};
export interface WebSocketEventTarget {
  on(event: "open", callback: (params: WebSocketOpenEvent) => void): this;
  on(
    event: "frameSent",
    callback: (params: WebSocketFrameSentEvent) => void
  ): this;
  on(
    event: "frameReceived",
    callback: (params: WebSocketFrameReceivedEvent) => void
  ): this;
  on(
    event: "socketError",
    callback: (params: WebSocketSocketErrorEvent) => void
  ): this;
  on(event: "close", callback: (params: WebSocketCloseEvent) => void): this;
}
export interface WebSocketChannel
  extends WebSocketEventTarget,
    EventTargetChannel {
  _type_WebSocket: boolean;
}
export type WebSocketOpenEvent = {};
export type WebSocketFrameSentEvent = {
  opcode: number;
  data: string;
};
export type WebSocketFrameReceivedEvent = {
  opcode: number;
  data: string;
};
export type WebSocketSocketErrorEvent = {
  error: string;
};
export type WebSocketCloseEvent = {};

export interface WebSocketEvents {
  open: WebSocketOpenEvent;
  frameSent: WebSocketFrameSentEvent;
  frameReceived: WebSocketFrameReceivedEvent;
  socketError: WebSocketSocketErrorEvent;
  close: WebSocketCloseEvent;
}

// ----------- ConsoleMessage -----------
export type ConsoleMessageInitializer = {
  type: string;
  text: string;
  args: JSHandleChannel[];
  location: {
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
};
export interface ConsoleMessageEventTarget {}
export interface ConsoleMessageChannel
  extends ConsoleMessageEventTarget,
    Channel {
  _type_ConsoleMessage: boolean;
}

export interface ConsoleMessageEvents {}

// ----------- BindingCall -----------
export type BindingCallInitializer = {
  frame: FrameChannel;
  name: string;
  args?: SerializedValue[];
  handle?: JSHandleChannel;
};
export interface BindingCallEventTarget {}
export interface BindingCallChannel extends BindingCallEventTarget, Channel {
  _type_BindingCall: boolean;
  reject(
    params: BindingCallRejectParams,
    metadata?: Metadata
  ): Promise<BindingCallRejectResult>;
  resolve(
    params: BindingCallResolveParams,
    metadata?: Metadata
  ): Promise<BindingCallResolveResult>;
}
export type BindingCallRejectParams = {
  error: SerializedError;
};
export type BindingCallRejectOptions = {};
export type BindingCallRejectResult = void;
export type BindingCallResolveParams = {
  result: SerializedArgument;
};
export type BindingCallResolveOptions = {};
export type BindingCallResolveResult = void;

export interface BindingCallEvents {}

// ----------- Dialog -----------
export type DialogInitializer = {
  type: string;
  message: string;
  defaultValue: string;
};
export interface DialogEventTarget {}
export interface DialogChannel extends DialogEventTarget, Channel {
  _type_Dialog: boolean;
  accept(
    params: DialogAcceptParams,
    metadata?: Metadata
  ): Promise<DialogAcceptResult>;
  dismiss(
    params?: DialogDismissParams,
    metadata?: Metadata
  ): Promise<DialogDismissResult>;
}
export type DialogAcceptParams = {
  promptText?: string;
};
export type DialogAcceptOptions = {
  promptText?: string;
};
export type DialogAcceptResult = void;
export type DialogDismissParams = {};
export type DialogDismissOptions = {};
export type DialogDismissResult = void;

export interface DialogEvents {}

// ----------- Tracing -----------
export type TracingInitializer = {};
export interface TracingEventTarget {}
export interface TracingChannel extends TracingEventTarget, Channel {
  _type_Tracing: boolean;
  tracingStart(
    params: TracingTracingStartParams,
    metadata?: Metadata
  ): Promise<TracingTracingStartResult>;
  tracingStartChunk(
    params: TracingTracingStartChunkParams,
    metadata?: Metadata
  ): Promise<TracingTracingStartChunkResult>;
  tracingStopChunk(
    params: TracingTracingStopChunkParams,
    metadata?: Metadata
  ): Promise<TracingTracingStopChunkResult>;
  tracingStop(
    params?: TracingTracingStopParams,
    metadata?: Metadata
  ): Promise<TracingTracingStopResult>;
}
export type TracingTracingStartParams = {
  name?: string;
  snapshots?: boolean;
  screenshots?: boolean;
  sources?: boolean;
};
export type TracingTracingStartOptions = {
  name?: string;
  snapshots?: boolean;
  screenshots?: boolean;
  sources?: boolean;
};
export type TracingTracingStartResult = void;
export type TracingTracingStartChunkParams = {
  title?: string;
};
export type TracingTracingStartChunkOptions = {
  title?: string;
};
export type TracingTracingStartChunkResult = void;
export type TracingTracingStopChunkParams = {
  mode: "doNotSave" | "compressTrace" | "compressTraceAndSources";
};
export type TracingTracingStopChunkOptions = {};
export type TracingTracingStopChunkResult = {
  artifact?: ArtifactChannel;
  sourceEntries?: NameValue[];
};
export type TracingTracingStopParams = {};
export type TracingTracingStopOptions = {};
export type TracingTracingStopResult = void;

export interface TracingEvents {}

// ----------- Artifact -----------
export type ArtifactInitializer = {
  absolutePath: string;
};
export interface ArtifactEventTarget {}
export interface ArtifactChannel extends ArtifactEventTarget, Channel {
  _type_Artifact: boolean;
  pathAfterFinished(
    params?: ArtifactPathAfterFinishedParams,
    metadata?: Metadata
  ): Promise<ArtifactPathAfterFinishedResult>;
  saveAs(
    params: ArtifactSaveAsParams,
    metadata?: Metadata
  ): Promise<ArtifactSaveAsResult>;
  saveAsStream(
    params?: ArtifactSaveAsStreamParams,
    metadata?: Metadata
  ): Promise<ArtifactSaveAsStreamResult>;
  failure(
    params?: ArtifactFailureParams,
    metadata?: Metadata
  ): Promise<ArtifactFailureResult>;
  stream(
    params?: ArtifactStreamParams,
    metadata?: Metadata
  ): Promise<ArtifactStreamResult>;
  cancel(
    params?: ArtifactCancelParams,
    metadata?: Metadata
  ): Promise<ArtifactCancelResult>;
  delete(
    params?: ArtifactDeleteParams,
    metadata?: Metadata
  ): Promise<ArtifactDeleteResult>;
}
export type ArtifactPathAfterFinishedParams = {};
export type ArtifactPathAfterFinishedOptions = {};
export type ArtifactPathAfterFinishedResult = {
  value?: string;
};
export type ArtifactSaveAsParams = {
  path: string;
};
export type ArtifactSaveAsOptions = {};
export type ArtifactSaveAsResult = void;
export type ArtifactSaveAsStreamParams = {};
export type ArtifactSaveAsStreamOptions = {};
export type ArtifactSaveAsStreamResult = {
  stream: StreamChannel;
};
export type ArtifactFailureParams = {};
export type ArtifactFailureOptions = {};
export type ArtifactFailureResult = {
  error?: string;
};
export type ArtifactStreamParams = {};
export type ArtifactStreamOptions = {};
export type ArtifactStreamResult = {
  stream?: StreamChannel;
};
export type ArtifactCancelParams = {};
export type ArtifactCancelOptions = {};
export type ArtifactCancelResult = void;
export type ArtifactDeleteParams = {};
export type ArtifactDeleteOptions = {};
export type ArtifactDeleteResult = void;

export interface ArtifactEvents {}

// ----------- Stream -----------
export type StreamInitializer = {};
export interface StreamEventTarget {}
export interface StreamChannel extends StreamEventTarget, Channel {
  _type_Stream: boolean;
  read(
    params: StreamReadParams,
    metadata?: Metadata
  ): Promise<StreamReadResult>;
  close(
    params?: StreamCloseParams,
    metadata?: Metadata
  ): Promise<StreamCloseResult>;
}
export type StreamReadParams = {
  size?: number;
};
export type StreamReadOptions = {
  size?: number;
};
export type StreamReadResult = {
  binary: Binary;
};
export type StreamCloseParams = {};
export type StreamCloseOptions = {};
export type StreamCloseResult = void;

export interface StreamEvents {}

// ----------- WritableStream -----------
export type WritableStreamInitializer = {};
export interface WritableStreamEventTarget {}
export interface WritableStreamChannel
  extends WritableStreamEventTarget,
    Channel {
  _type_WritableStream: boolean;
  write(
    params: WritableStreamWriteParams,
    metadata?: Metadata
  ): Promise<WritableStreamWriteResult>;
  close(
    params?: WritableStreamCloseParams,
    metadata?: Metadata
  ): Promise<WritableStreamCloseResult>;
}
export type WritableStreamWriteParams = {
  binary: Binary;
};
export type WritableStreamWriteOptions = {};
export type WritableStreamWriteResult = void;
export type WritableStreamCloseParams = {};
export type WritableStreamCloseOptions = {};
export type WritableStreamCloseResult = void;

export interface WritableStreamEvents {}

// ----------- CDPSession -----------
export type CDPSessionInitializer = {};
export interface CDPSessionEventTarget {
  on(event: "event", callback: (params: CDPSessionEventEvent) => void): this;
}
export interface CDPSessionChannel extends CDPSessionEventTarget, Channel {
  _type_CDPSession: boolean;
  send(
    params: CDPSessionSendParams,
    metadata?: Metadata
  ): Promise<CDPSessionSendResult>;
  detach(
    params?: CDPSessionDetachParams,
    metadata?: Metadata
  ): Promise<CDPSessionDetachResult>;
}
export type CDPSessionEventEvent = {
  method: string;
  params?: any;
};
export type CDPSessionSendParams = {
  method: string;
  params?: any;
};
export type CDPSessionSendOptions = {
  params?: any;
};
export type CDPSessionSendResult = {
  result: any;
};
export type CDPSessionDetachParams = {};
export type CDPSessionDetachOptions = {};
export type CDPSessionDetachResult = void;

export interface CDPSessionEvents {
  event: CDPSessionEventEvent;
}

// ----------- Electron -----------
export type ElectronInitializer = {};
export interface ElectronEventTarget {}
export interface ElectronChannel extends ElectronEventTarget, Channel {
  _type_Electron: boolean;
  launch(
    params: ElectronLaunchParams,
    metadata?: Metadata
  ): Promise<ElectronLaunchResult>;
}
export type ElectronLaunchParams = {
  executablePath?: string;
  args?: string[];
  cwd?: string;
  env?: NameValue[];
  timeout?: number;
  acceptDownloads?: boolean;
  bypassCSP?: boolean;
  colorScheme?: "dark" | "light" | "no-preference";
  extraHTTPHeaders?: NameValue[];
  geolocation?: {
    longitude: number;
    latitude: number;
    accuracy?: number;
  };
  httpCredentials?: {
    username: string;
    password: string;
  };
  ignoreHTTPSErrors?: boolean;
  locale?: string;
  offline?: boolean;
  recordHar?: RecordHarOptions;
  recordVideo?: {
    dir: string;
    size?: {
      width: number;
      height: number;
    };
  };
  strictSelectors?: boolean;
  timezoneId?: string;
};
export type ElectronLaunchOptions = {
  executablePath?: string;
  args?: string[];
  cwd?: string;
  env?: NameValue[];
  timeout?: number;
  acceptDownloads?: boolean;
  bypassCSP?: boolean;
  colorScheme?: "dark" | "light" | "no-preference";
  extraHTTPHeaders?: NameValue[];
  geolocation?: {
    longitude: number;
    latitude: number;
    accuracy?: number;
  };
  httpCredentials?: {
    username: string;
    password: string;
  };
  ignoreHTTPSErrors?: boolean;
  locale?: string;
  offline?: boolean;
  recordHar?: RecordHarOptions;
  recordVideo?: {
    dir: string;
    size?: {
      width: number;
      height: number;
    };
  };
  strictSelectors?: boolean;
  timezoneId?: string;
};
export type ElectronLaunchResult = {
  electronApplication: ElectronApplicationChannel;
};

export interface ElectronEvents {}

// ----------- ElectronApplication -----------
export type ElectronApplicationInitializer = {
  context: BrowserContextChannel;
};
export interface ElectronApplicationEventTarget {
  on(
    event: "close",
    callback: (params: ElectronApplicationCloseEvent) => void
  ): this;
}
export interface ElectronApplicationChannel
  extends ElectronApplicationEventTarget,
    EventTargetChannel {
  _type_ElectronApplication: boolean;
  browserWindow(
    params: ElectronApplicationBrowserWindowParams,
    metadata?: Metadata
  ): Promise<ElectronApplicationBrowserWindowResult>;
  evaluateExpression(
    params: ElectronApplicationEvaluateExpressionParams,
    metadata?: Metadata
  ): Promise<ElectronApplicationEvaluateExpressionResult>;
  evaluateExpressionHandle(
    params: ElectronApplicationEvaluateExpressionHandleParams,
    metadata?: Metadata
  ): Promise<ElectronApplicationEvaluateExpressionHandleResult>;
  close(
    params?: ElectronApplicationCloseParams,
    metadata?: Metadata
  ): Promise<ElectronApplicationCloseResult>;
}
export type ElectronApplicationCloseEvent = {};
export type ElectronApplicationBrowserWindowParams = {
  page: PageChannel;
};
export type ElectronApplicationBrowserWindowOptions = {};
export type ElectronApplicationBrowserWindowResult = {
  handle: JSHandleChannel;
};
export type ElectronApplicationEvaluateExpressionParams = {
  expression: string;
  isFunction?: boolean;
  arg: SerializedArgument;
};
export type ElectronApplicationEvaluateExpressionOptions = {
  isFunction?: boolean;
};
export type ElectronApplicationEvaluateExpressionResult = {
  value: SerializedValue;
};
export type ElectronApplicationEvaluateExpressionHandleParams = {
  expression: string;
  isFunction?: boolean;
  arg: SerializedArgument;
};
export type ElectronApplicationEvaluateExpressionHandleOptions = {
  isFunction?: boolean;
};
export type ElectronApplicationEvaluateExpressionHandleResult = {
  handle: JSHandleChannel;
};
export type ElectronApplicationCloseParams = {};
export type ElectronApplicationCloseOptions = {};
export type ElectronApplicationCloseResult = void;

export interface ElectronApplicationEvents {
  close: ElectronApplicationCloseEvent;
}

// ----------- Android -----------
export type AndroidInitializer = {};
export interface AndroidEventTarget {}
export interface AndroidChannel extends AndroidEventTarget, Channel {
  _type_Android: boolean;
  devices(
    params: AndroidDevicesParams,
    metadata?: Metadata
  ): Promise<AndroidDevicesResult>;
  setDefaultTimeoutNoReply(
    params: AndroidSetDefaultTimeoutNoReplyParams,
    metadata?: Metadata
  ): Promise<AndroidSetDefaultTimeoutNoReplyResult>;
}
export type AndroidDevicesParams = {
  host?: string;
  port?: number;
  omitDriverInstall?: boolean;
};
export type AndroidDevicesOptions = {
  host?: string;
  port?: number;
  omitDriverInstall?: boolean;
};
export type AndroidDevicesResult = {
  devices: AndroidDeviceChannel[];
};
export type AndroidSetDefaultTimeoutNoReplyParams = {
  timeout: number;
};
export type AndroidSetDefaultTimeoutNoReplyOptions = {};
export type AndroidSetDefaultTimeoutNoReplyResult = void;

export interface AndroidEvents {}

// ----------- AndroidSocket -----------
export type AndroidSocketInitializer = {};
export interface AndroidSocketEventTarget {
  on(event: "data", callback: (params: AndroidSocketDataEvent) => void): this;
  on(event: "close", callback: (params: AndroidSocketCloseEvent) => void): this;
}
export interface AndroidSocketChannel
  extends AndroidSocketEventTarget,
    Channel {
  _type_AndroidSocket: boolean;
  write(
    params: AndroidSocketWriteParams,
    metadata?: Metadata
  ): Promise<AndroidSocketWriteResult>;
  close(
    params?: AndroidSocketCloseParams,
    metadata?: Metadata
  ): Promise<AndroidSocketCloseResult>;
}
export type AndroidSocketDataEvent = {
  data: Binary;
};
export type AndroidSocketCloseEvent = {};
export type AndroidSocketWriteParams = {
  data: Binary;
};
export type AndroidSocketWriteOptions = {};
export type AndroidSocketWriteResult = void;
export type AndroidSocketCloseParams = {};
export type AndroidSocketCloseOptions = {};
export type AndroidSocketCloseResult = void;

export interface AndroidSocketEvents {
  data: AndroidSocketDataEvent;
  close: AndroidSocketCloseEvent;
}

// ----------- AndroidDevice -----------
export type AndroidDeviceInitializer = {
  model: string;
  serial: string;
};
export interface AndroidDeviceEventTarget {
  on(
    event: "webViewAdded",
    callback: (params: AndroidDeviceWebViewAddedEvent) => void
  ): this;
  on(
    event: "webViewRemoved",
    callback: (params: AndroidDeviceWebViewRemovedEvent) => void
  ): this;
}
export interface AndroidDeviceChannel
  extends AndroidDeviceEventTarget,
    EventTargetChannel {
  _type_AndroidDevice: boolean;
  wait(
    params: AndroidDeviceWaitParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceWaitResult>;
  fill(
    params: AndroidDeviceFillParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceFillResult>;
  tap(
    params: AndroidDeviceTapParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceTapResult>;
  drag(
    params: AndroidDeviceDragParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceDragResult>;
  fling(
    params: AndroidDeviceFlingParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceFlingResult>;
  longTap(
    params: AndroidDeviceLongTapParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceLongTapResult>;
  pinchClose(
    params: AndroidDevicePinchCloseParams,
    metadata?: Metadata
  ): Promise<AndroidDevicePinchCloseResult>;
  pinchOpen(
    params: AndroidDevicePinchOpenParams,
    metadata?: Metadata
  ): Promise<AndroidDevicePinchOpenResult>;
  scroll(
    params: AndroidDeviceScrollParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceScrollResult>;
  swipe(
    params: AndroidDeviceSwipeParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceSwipeResult>;
  info(
    params: AndroidDeviceInfoParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceInfoResult>;
  screenshot(
    params?: AndroidDeviceScreenshotParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceScreenshotResult>;
  inputType(
    params: AndroidDeviceInputTypeParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceInputTypeResult>;
  inputPress(
    params: AndroidDeviceInputPressParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceInputPressResult>;
  inputTap(
    params: AndroidDeviceInputTapParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceInputTapResult>;
  inputSwipe(
    params: AndroidDeviceInputSwipeParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceInputSwipeResult>;
  inputDrag(
    params: AndroidDeviceInputDragParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceInputDragResult>;
  launchBrowser(
    params: AndroidDeviceLaunchBrowserParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceLaunchBrowserResult>;
  open(
    params: AndroidDeviceOpenParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceOpenResult>;
  shell(
    params: AndroidDeviceShellParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceShellResult>;
  installApk(
    params: AndroidDeviceInstallApkParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceInstallApkResult>;
  push(
    params: AndroidDevicePushParams,
    metadata?: Metadata
  ): Promise<AndroidDevicePushResult>;
  setDefaultTimeoutNoReply(
    params: AndroidDeviceSetDefaultTimeoutNoReplyParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceSetDefaultTimeoutNoReplyResult>;
  connectToWebView(
    params: AndroidDeviceConnectToWebViewParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceConnectToWebViewResult>;
  close(
    params?: AndroidDeviceCloseParams,
    metadata?: Metadata
  ): Promise<AndroidDeviceCloseResult>;
}
export type AndroidDeviceWebViewAddedEvent = {
  webView: AndroidWebView;
};
export type AndroidDeviceWebViewRemovedEvent = {
  socketName: string;
};
export type AndroidDeviceWaitParams = {
  selector: AndroidSelector;
  state?: "gone";
  timeout?: number;
};
export type AndroidDeviceWaitOptions = {
  state?: "gone";
  timeout?: number;
};
export type AndroidDeviceWaitResult = void;
export type AndroidDeviceFillParams = {
  selector: AndroidSelector;
  text: string;
  timeout?: number;
};
export type AndroidDeviceFillOptions = {
  timeout?: number;
};
export type AndroidDeviceFillResult = void;
export type AndroidDeviceTapParams = {
  selector: AndroidSelector;
  duration?: number;
  timeout?: number;
};
export type AndroidDeviceTapOptions = {
  duration?: number;
  timeout?: number;
};
export type AndroidDeviceTapResult = void;
export type AndroidDeviceDragParams = {
  selector: AndroidSelector;
  dest: Point;
  speed?: number;
  timeout?: number;
};
export type AndroidDeviceDragOptions = {
  speed?: number;
  timeout?: number;
};
export type AndroidDeviceDragResult = void;
export type AndroidDeviceFlingParams = {
  selector: AndroidSelector;
  direction: "up" | "down" | "left" | "right";
  speed?: number;
  timeout?: number;
};
export type AndroidDeviceFlingOptions = {
  speed?: number;
  timeout?: number;
};
export type AndroidDeviceFlingResult = void;
export type AndroidDeviceLongTapParams = {
  selector: AndroidSelector;
  timeout?: number;
};
export type AndroidDeviceLongTapOptions = {
  timeout?: number;
};
export type AndroidDeviceLongTapResult = void;
export type AndroidDevicePinchCloseParams = {
  selector: AndroidSelector;
  percent: number;
  speed?: number;
  timeout?: number;
};
export type AndroidDevicePinchCloseOptions = {
  speed?: number;
  timeout?: number;
};
export type AndroidDevicePinchCloseResult = void;
export type AndroidDevicePinchOpenParams = {
  selector: AndroidSelector;
  percent: number;
  speed?: number;
  timeout?: number;
};
export type AndroidDevicePinchOpenOptions = {
  speed?: number;
  timeout?: number;
};
export type AndroidDevicePinchOpenResult = void;
export type AndroidDeviceScrollParams = {
  selector: AndroidSelector;
  direction: "up" | "down" | "left" | "right";
  percent: number;
  speed?: number;
  timeout?: number;
};
export type AndroidDeviceScrollOptions = {
  speed?: number;
  timeout?: number;
};
export type AndroidDeviceScrollResult = void;
export type AndroidDeviceSwipeParams = {
  selector: AndroidSelector;
  direction: "up" | "down" | "left" | "right";
  percent: number;
  speed?: number;
  timeout?: number;
};
export type AndroidDeviceSwipeOptions = {
  speed?: number;
  timeout?: number;
};
export type AndroidDeviceSwipeResult = void;
export type AndroidDeviceInfoParams = {
  selector: AndroidSelector;
};
export type AndroidDeviceInfoOptions = {};
export type AndroidDeviceInfoResult = {
  info: AndroidElementInfo;
};
export type AndroidDeviceScreenshotParams = {};
export type AndroidDeviceScreenshotOptions = {};
export type AndroidDeviceScreenshotResult = {
  binary: Binary;
};
export type AndroidDeviceInputTypeParams = {
  text: string;
};
export type AndroidDeviceInputTypeOptions = {};
export type AndroidDeviceInputTypeResult = void;
export type AndroidDeviceInputPressParams = {
  key: string;
};
export type AndroidDeviceInputPressOptions = {};
export type AndroidDeviceInputPressResult = void;
export type AndroidDeviceInputTapParams = {
  point: Point;
};
export type AndroidDeviceInputTapOptions = {};
export type AndroidDeviceInputTapResult = void;
export type AndroidDeviceInputSwipeParams = {
  segments: Point[];
  steps: number;
};
export type AndroidDeviceInputSwipeOptions = {};
export type AndroidDeviceInputSwipeResult = void;
export type AndroidDeviceInputDragParams = {
  from: Point;
  to: Point;
  steps: number;
};
export type AndroidDeviceInputDragOptions = {};
export type AndroidDeviceInputDragResult = void;
export type AndroidDeviceLaunchBrowserParams = {
  noDefaultViewport?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  screen?: {
    width: number;
    height: number;
  };
  ignoreHTTPSErrors?: boolean;
  javaScriptEnabled?: boolean;
  bypassCSP?: boolean;
  userAgent?: string;
  locale?: string;
  timezoneId?: string;
  geolocation?: {
    longitude: number;
    latitude: number;
    accuracy?: number;
  };
  permissions?: string[];
  extraHTTPHeaders?: NameValue[];
  offline?: boolean;
  httpCredentials?: {
    username: string;
    password: string;
  };
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  colorScheme?: "dark" | "light" | "no-preference";
  reducedMotion?: "reduce" | "no-preference";
  forcedColors?: "active" | "none";
  acceptDownloads?: boolean;
  baseURL?: string;
  recordVideo?: {
    dir: string;
    size?: {
      width: number;
      height: number;
    };
  };
  recordHar?: RecordHarOptions;
  strictSelectors?: boolean;
  serviceWorkers?: "allow" | "block";
  pkg?: string;
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
};
export type AndroidDeviceLaunchBrowserOptions = {
  noDefaultViewport?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  screen?: {
    width: number;
    height: number;
  };
  ignoreHTTPSErrors?: boolean;
  javaScriptEnabled?: boolean;
  bypassCSP?: boolean;
  userAgent?: string;
  locale?: string;
  timezoneId?: string;
  geolocation?: {
    longitude: number;
    latitude: number;
    accuracy?: number;
  };
  permissions?: string[];
  extraHTTPHeaders?: NameValue[];
  offline?: boolean;
  httpCredentials?: {
    username: string;
    password: string;
  };
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  colorScheme?: "dark" | "light" | "no-preference";
  reducedMotion?: "reduce" | "no-preference";
  forcedColors?: "active" | "none";
  acceptDownloads?: boolean;
  baseURL?: string;
  recordVideo?: {
    dir: string;
    size?: {
      width: number;
      height: number;
    };
  };
  recordHar?: RecordHarOptions;
  strictSelectors?: boolean;
  serviceWorkers?: "allow" | "block";
  pkg?: string;
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
};
export type AndroidDeviceLaunchBrowserResult = {
  context: BrowserContextChannel;
};
export type AndroidDeviceOpenParams = {
  command: string;
};
export type AndroidDeviceOpenOptions = {};
export type AndroidDeviceOpenResult = {
  socket: AndroidSocketChannel;
};
export type AndroidDeviceShellParams = {
  command: string;
};
export type AndroidDeviceShellOptions = {};
export type AndroidDeviceShellResult = {
  result: Binary;
};
export type AndroidDeviceInstallApkParams = {
  file: Binary;
  args?: string[];
};
export type AndroidDeviceInstallApkOptions = {
  args?: string[];
};
export type AndroidDeviceInstallApkResult = void;
export type AndroidDevicePushParams = {
  file: Binary;
  path: string;
  mode?: number;
};
export type AndroidDevicePushOptions = {
  mode?: number;
};
export type AndroidDevicePushResult = void;
export type AndroidDeviceSetDefaultTimeoutNoReplyParams = {
  timeout: number;
};
export type AndroidDeviceSetDefaultTimeoutNoReplyOptions = {};
export type AndroidDeviceSetDefaultTimeoutNoReplyResult = void;
export type AndroidDeviceConnectToWebViewParams = {
  socketName: string;
};
export type AndroidDeviceConnectToWebViewOptions = {};
export type AndroidDeviceConnectToWebViewResult = {
  context: BrowserContextChannel;
};
export type AndroidDeviceCloseParams = {};
export type AndroidDeviceCloseOptions = {};
export type AndroidDeviceCloseResult = void;

export interface AndroidDeviceEvents {
  webViewAdded: AndroidDeviceWebViewAddedEvent;
  webViewRemoved: AndroidDeviceWebViewRemovedEvent;
}

export type AndroidWebView = {
  pid: number;
  pkg: string;
  socketName: string;
};

export type AndroidSelector = {
  checkable?: boolean;
  checked?: boolean;
  clazz?: string;
  clickable?: boolean;
  depth?: number;
  desc?: string;
  enabled?: boolean;
  focusable?: boolean;
  focused?: boolean;
  hasChild?: {
    selector: AndroidSelector;
  };
  hasDescendant?: {
    selector: AndroidSelector;
    maxDepth?: number;
  };
  longClickable?: boolean;
  pkg?: string;
  res?: string;
  scrollable?: boolean;
  selected?: boolean;
  text?: string;
};

export type AndroidElementInfo = {
  children?: AndroidElementInfo[];
  clazz: string;
  desc: string;
  res: string;
  pkg: string;
  text: string;
  bounds: Rect;
  checkable: boolean;
  checked: boolean;
  clickable: boolean;
  enabled: boolean;
  focusable: boolean;
  focused: boolean;
  longClickable: boolean;
  scrollable: boolean;
  selected: boolean;
};

// ----------- JsonPipe -----------
export type JsonPipeInitializer = {};
export interface JsonPipeEventTarget {
  on(event: "message", callback: (params: JsonPipeMessageEvent) => void): this;
  on(event: "closed", callback: (params: JsonPipeClosedEvent) => void): this;
}
export interface JsonPipeChannel extends JsonPipeEventTarget, Channel {
  _type_JsonPipe: boolean;
  send(
    params: JsonPipeSendParams,
    metadata?: Metadata
  ): Promise<JsonPipeSendResult>;
  close(
    params?: JsonPipeCloseParams,
    metadata?: Metadata
  ): Promise<JsonPipeCloseResult>;
}
export type JsonPipeMessageEvent = {
  message: any;
};
export type JsonPipeClosedEvent = {
  error?: SerializedError;
};
export type JsonPipeSendParams = {
  message: any;
};
export type JsonPipeSendOptions = {};
export type JsonPipeSendResult = void;
export type JsonPipeCloseParams = {};
export type JsonPipeCloseOptions = {};
export type JsonPipeCloseResult = void;

export interface JsonPipeEvents {
  message: JsonPipeMessageEvent;
  closed: JsonPipeClosedEvent;
}
