import type { WebContainer, WebContainerProcess } from "@webcontainer/api";
import type { ConsoleOutput } from "../components/console";
import type { Tabs } from "../components/output-tabs";

export class Installer {
  private readonly webContainer: WebContainer;

  private readonly consoleOutput: ConsoleOutput;

  private readonly outputTabs: Tabs;

  private installProcess: Promise<WebContainerProcess> | undefined;

  public constructor({
    consoleOutput,
    outputTabs,
    webContainer,
  }: {
    webContainer: WebContainer;
    consoleOutput: ConsoleOutput;
    outputTabs: Tabs;
  }) {
    this.webContainer = webContainer;
    this.consoleOutput = consoleOutput;
    this.outputTabs = outputTabs;
  }

  /** Run `npm install` to install dependencies. */
  public async install(): Promise<number> {
    this.outputTabs.setChecked("console");
    this.consoleOutput.appendLine("Installing dependencies...");

    if (this.installProcess != null) {
      (await this.installProcess).kill();
    }

    this.installProcess = installDependencies(
      this.webContainer,
      this.consoleOutput
    );

    return (await this.installProcess).exit;
  }

  /** Returns the exit code for the install command process. */
  public async getExitCode(): Promise<number> {
    return (await this.installProcess!).exit;
  }
}

async function installDependencies(
  webContainer: WebContainer,
  consoleOutput: ConsoleOutput
) {
  const installProcess = await webContainer.spawn("npm", ["install"]);

  void installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        consoleOutput.append(data);
      },
    })
  );
  void installProcess.exit.then((exitCode) => {
    if (exitCode !== 0) {
      consoleOutput.appendLine("Installation failed");
    } else {
      consoleOutput.appendLine("Installation succeeded");
    }
  });

  return installProcess;
}
