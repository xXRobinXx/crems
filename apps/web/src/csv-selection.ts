import type { FluviusStreamSummary } from "@crems/core/fluvius-stream-preview";
import type { CsvPreview, CsvPreviewOutcome } from "./csv-preview";

export const MAX_LOCAL_CSV_BYTES = 20 * 1024 * 1024;

export type LocalCsvFile = {
  size: number;
  text?(): Promise<string>;
  stream?(): ReadableStream<Uint8Array>;
};

export type CsvSelectionState = {
  preview: CsvPreview | null;
  progress: { phase:"reading"|"finalizing"|"complete"|"cancelled";bytesRead:number;totalBytes:number }|null;
};

export type CsvSelectionDependencies = {
  createAnalyzer(): { push(chunk:string):void;finish():FluviusStreamSummary };
  yieldControl():Promise<void>;
  map(outcome: CsvPreviewOutcome): CsvPreview;
};

export const createCsvSelectionController = (
  publish: (state: CsvSelectionState) => void,
  dependencies: CsvSelectionDependencies,
) => {
  let sequence = 0;
  let activeReader: ReadableStreamDefaultReader<Uint8Array>|undefined;

  return {
    async select(file?: LocalCsvFile): Promise<void> {
      const selection = ++sequence;
      void activeReader?.cancel();activeReader=undefined;publish({ preview: null,progress:null });
      if (!file) return;

      if (file.size > MAX_LOCAL_CSV_BYTES) {
        publish({
          preview: dependencies.map({ ok: false, code: "FILE_TOO_LARGE" }),progress:null,
        });
        return;
      }

      try {
        const analyzer=dependencies.createAnalyzer();let bytesRead=0;publish({preview:null,progress:{phase:"reading",bytesRead,totalBytes:file.size}});
        if(file.stream){const reader=file.stream().getReader();activeReader=reader;const decoder=new TextDecoder();try{while(true){const part=await reader.read();if(part.done)break;if(selection!==sequence){await reader.cancel();return;}bytesRead+=part.value.byteLength;analyzer.push(decoder.decode(part.value,{stream:true}));publish({preview:null,progress:{phase:"reading",bytesRead,totalBytes:file.size}});await dependencies.yieldControl();}analyzer.push(decoder.decode());}finally{if(activeReader===reader)activeReader=undefined;try{reader.releaseLock();}catch{}}}else if(file.text){const text=await file.text();bytesRead=file.size;analyzer.push(text);}else throw new Error("LOCAL_READ_ERROR");
        if (selection !== sequence) return;
        publish({preview:null,progress:{phase:"finalizing",bytesRead,totalBytes:file.size}});
        await dependencies.yieldControl();if(selection!==sequence)return;
        publish({
          preview: dependencies.map({ ok: true, analyzed: analyzer.finish() }),progress:{phase:"complete",bytesRead,totalBytes:file.size},
        });
      } catch (error) {
        if (selection !== sequence) return;
        publish({
          preview: dependencies.map({ ok: false, error }),progress:null,
        });
      }
    },
    cancel(){sequence+=1;void activeReader?.cancel();activeReader=undefined;publish({preview:null,progress:{phase:"cancelled",bytesRead:0,totalBytes:0}});},
    dispose() { sequence += 1;void activeReader?.cancel();activeReader=undefined;publish({ preview: null,progress:null }); },
  };
};
