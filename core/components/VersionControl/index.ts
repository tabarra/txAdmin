const modulename = "StatsManager";
import consoleFactory from "@extras/console";
import type TxAdmin from "@core/txAdmin.js";
import SvRuntimeVersionControl from "./svRuntime";
const console = consoleFactory(modulename);

/**
 * Module responsible for handling version control
 */
export default class VersionControl {
  public readonly svRuntime: SvRuntimeVersionControl;

  constructor(txAdmin: TxAdmin) {
    this.svRuntime = new SvRuntimeVersionControl(txAdmin);
  }
}
