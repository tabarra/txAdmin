const modulename = "VersionControl";
import consoleFactory from "@extras/console";
import type TxAdmin from "@core/txAdmin.js";
import SvRuntimeVersionControl from "./svRuntime";
import { Octokit } from "octokit";
import fetch from "node-fetch";

const console = consoleFactory(modulename);

/**
 * Module responsible for handling version control
 */
export default class VersionControl {
  readonly #txAdmin: TxAdmin;
  public readonly svRuntime: SvRuntimeVersionControl;
  private octokit: Octokit | null;
  private githubAuthKey: string | null;
  private githubOwner: string | null;

  private async updateGithubAuthKey(newValue: string | null) {
    this.githubAuthKey = newValue;
    await this.updateOctokitValue();
  }

  public async isAuthKeyValid(key: string) {
    try {
      const val = await new Octokit({
        auth: key,
        request: {
          fetch: fetch
        }
      }).rest.users.getAuthenticated();

      return val.status === 200;
    } catch (err) {
      console.verbose.warn(err);
      return false;
    }
  }

  private async updateOctokitValue() {
    if (this.githubAuthKey !== null) {
      if ((await this.isAuthKeyValid(this.githubAuthKey)) === true) {
        this.octokit = new Octokit({
          auth: this.githubAuthKey,
          request: {
            fetch: fetch
          }
        });
        console.verbose.log("Valid github auth key");
      } else {
        console.info("Invalid github auth key");
      }
    } else {
      this.octokit = null;
    }
  }

  public configUpdated() {
    const cfg = this.#txAdmin.configVault.getScoped("versionControl");

    this.updateGithubAuthKey(cfg.githubAuthKey);
    this.githubOwner = cfg.githubOwner;
  }

  public async getOwners() {
    const resp: string[] = [];

    if (this.octokit !== null) {
      const orgsResp = await this.octokit.request("GET /user/orgs");

      const { data: userResp } =
        await this.octokit.rest.users.getAuthenticated();

      if (userResp) {
        resp.push(userResp.login);
      }

      if (orgsResp && orgsResp.status === 200) {
        orgsResp.data.forEach((v: { login: string }) => {
          resp.push(v.login);
        });
      }
    }

    return resp;
  }

  constructor(txAdmin: TxAdmin) {
    this.#txAdmin = txAdmin;
    this.githubAuthKey = null;
    this.githubOwner = null;
    this.configUpdated();
    this.svRuntime = new SvRuntimeVersionControl(txAdmin);
  }
}
