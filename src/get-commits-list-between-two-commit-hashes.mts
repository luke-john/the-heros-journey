import childProcess from "node:child_process";

export async function listCommitsBetweenTwoCommitHashes(
  /** Oldest commit */
  commitOne: string,
  /** Newest commit */
  commitTwo: string,
  { cwd }: { cwd?: string }
) {
  const result = childProcess
    .execSync(`git rev-list --ancestry-path ${commitOne}..${commitTwo}`, {
      cwd,
    })
    .toString();

  return result.trim().split("\n");
}

// const list = await listCommitsBetweenTwoCommitHashes(
//   "3104936eabd57499038148199a83ce6e41c805df",
//   "b4858938837dd6a04e289c244d9134ca624f1bd7",
//   { cwd: "../vite-project" }
// );

// console.log(list);
