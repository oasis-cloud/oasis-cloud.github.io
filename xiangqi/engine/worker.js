import { search } from "./search.js";

let stopFlag = false;

self.onmessage = (e) => {
  const data = e.data;
  if (!data) return;
  if (data.type === "stop") {
    stopFlag = true;
    return;
  }
  if (data.type !== "search") return;
  stopFlag = false;
  const result = search(data.board, data.side, {
    ...data.options,
    historyMoves: data.historyMoves || data.options?.historyMoves,
    shouldStop: () => stopFlag,
    onInfo: (info) => {
      postMessage({
        id: data.id,
        type: "info",
        depth: info.depth,
        nodes: info.nodes,
        score: info.score,
      });
    },
  });
  postMessage({ id: data.id, type: "result", ...result });
};
