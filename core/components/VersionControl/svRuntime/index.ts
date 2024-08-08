import TxAdmin from "@core/txAdmin";
import consoleFactory from "@extras/console";
import fsp from "node:fs/promises";
import { VcFileSchema, VcFileType } from "./perfSchemas";
import { ZodError } from "zod";
import { throttle } from "throttle-debounce";
import { defaultData } from "./config";
import { existsSync } from "node:fs";

const modulename = "VersionControl";
const DATA_FILE_NAME = "version_control.json";
const console = consoleFactory(modulename);

export default class SvRuntimeVersionControl {
  readonly #txAdmin: TxAdmin;
  private readonly dataFilePath: string;
  private versionControlData: VcFileType | null = null;
  private queueSaveVersionControlData = throttle(
    15_000,
    this.saveVersionControlData.bind(this),
    { noLeading: true }
  );

  constructor(txAdmin: TxAdmin) {
    this.#txAdmin = txAdmin;
    this.dataFilePath = `${txAdmin.info.serverProfilePath}/data/${DATA_FILE_NAME}`;
    this.loadVersionControlData();
  }

  private async loadVersionControlData() {
    if (existsSync(this.dataFilePath)) {
      try {
        const rawFileData = await fsp.readFile(this.dataFilePath, "utf8");
        const fileData = JSON.parse(rawFileData);
        if (fileData?.version !== DATA_FILE_NAME)
          throw new Error("invalid version");
        const versionControlData = VcFileSchema.parse(fileData);
        this.versionControlData = versionControlData;
      } catch (error) {
        if ((error as any)?.code === "ENOENT") {
          console.verbose.debug(
            `${DATA_FILE_NAME} not found, starting with empty stats.`
          );
          this.versionControlData = defaultData;
        } else if (error instanceof ZodError) {
          console.warn(`Failed to load ${DATA_FILE_NAME} due to invalid data.`);
        } else {
          console.warn(
            `Failed to load ${DATA_FILE_NAME} with message: ${
              (error as Error).message
            }`
          );
        }
        console.warn("Since this is not a critical file, it will be reset.");
      }
    } else {
      console.verbose.debug(
        `${DATA_FILE_NAME} not found, starting with empty stats.`
      );
      this.versionControlData = defaultData;
    }
  }
  public handleServerBoot(duration: number) {
    this.queueSaveVersionControlData();
  }

  public handleServerStop(reason: string) {
    this.queueSaveVersionControlData();
  }

  private async saveVersionControlData() {
    try {
      await fsp.writeFile(
        this.dataFilePath,
        JSON.stringify(this.versionControlData)
      );
    } catch (error) {
      console.warn(
        `Failed to save ${DATA_FILE_NAME} with message: ${
          (error as Error).message
        }`
      );
    }
  }
}
