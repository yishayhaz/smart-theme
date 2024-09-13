import * as vscode from "vscode";

import cron from "node-cron";

const EXTENSION_ID = "smart-theme";

let tasks: [cron.ScheduledTask, cron.ScheduledTask] | null;

export function activate(context: vscode.ExtensionContext) {
  const config = getConfig();

  onStartup(config);
  createCronTasks(config);

  let disposableSetLightTheme = vscode.commands.registerCommand(
    `${EXTENSION_ID}.setLightTheme`,
    () => {
      vscode.window
        .showInputBox({
          placeHolder: "Enter the light theme name",
        })
        .then((theme) => {
          if (!theme) return;

          config.lightTheme = theme;
          setConfig({ lightTheme: theme });
          onStartup(config);
        });
    }
  );

  let disposableSetDarkTheme = vscode.commands.registerCommand(
    `${EXTENSION_ID}.setDarkTheme`,
    () => {
      vscode.window
        .showInputBox({
          placeHolder: "Enter the dark theme name",
        })
        .then((theme) => {
          if (!theme) return;

          config.darkTheme = theme;
          setConfig({ darkTheme: theme });
          onStartup(config);
        });
    }
  );

  let disposableEnable = vscode.commands.registerCommand(
    `${EXTENSION_ID}.enable`,
    () => {
      config.enabled = true;
      setConfig({ enabled: true });
      createCronTasks(config);
    }
  );

  let disposableDisable = vscode.commands.registerCommand(
    `${EXTENSION_ID}.disable`,
    () => {
      config.enabled = false;
      setConfig({ enabled: false });
      destroyCronTasks();
    }
  );

  let disposableSetLightThemeTime = vscode.commands.registerCommand(
    `${EXTENSION_ID}.setLightThemeTime`,
    () => {
      vscode.window
        .showInputBox({
          placeHolder: "Enter the light theme time",
          validateInput(value) {
            if (isNaN(parseInt(value))) {
              return "Please enter a valid number";
            }
            return null;
          },
        })
        .then((time) => {
          if (!time) return;

          config.lightThemeTime = parseInt(time);
          setConfig({ lightThemeTime: parseInt(time) });
          onStartup(config);
          createCronTasks(config);
        });
    }
  );

  let disposableSetDarkThemeTime = vscode.commands.registerCommand(
    `${EXTENSION_ID}.setDarkThemeTime`,
    () => {
      vscode.window
        .showInputBox({
          placeHolder: "Enter the dark theme time",
          validateInput(value) {
            if (isNaN(parseInt(value))) {
              return "Please enter a valid number";
            }
            return null;
          },
        })
        .then((time) => {
          if (!time) return;

          config.darkThemeTime = parseInt(time);
          setConfig({ darkThemeTime: parseInt(time) });
          onStartup(config);
          createCronTasks(config);
        });
    }
  );

  if (config.enabled) {
    context.subscriptions.push(disposableSetLightTheme);
    context.subscriptions.push(disposableSetDarkTheme);
    context.subscriptions.push(disposableDisable);
    context.subscriptions.push(disposableSetLightThemeTime);
    context.subscriptions.push(disposableSetDarkThemeTime);
  } else {
    context.subscriptions.push(disposableEnable);
  }
}

export function deactivate() {
  destroyCronTasks();
}

const destroyCronTasks = () => {
  tasks?.forEach((task) => task.stop());
};

const createCronTasks = (config: Config) => {
  destroyCronTasks();

  cron.schedule(`0 ${config.lightThemeTime} * * *`, () => onStartup());
  cron.schedule(`0 ${config.darkThemeTime} * * *`, () => onStartup());
};

const onStartup = (config?: Config) => {
  config ??= getConfig();

  if (!config.enabled) return;

  const mode = config[getThemeMode(config)];

  if (!mode) return;

  applyTheme(mode);
};

const getThemeMode = (config: Config) => {
  const time = new Date().getHours();

  if (time >= config.lightThemeTime && time < config.darkThemeTime) {
    return "lightTheme";
  } else {
    return "darkTheme";
  }
};

const getConfig = (): Config => {
  const configuration = vscode.workspace.getConfiguration(EXTENSION_ID);

  const enabled = configuration.get("enabled") as boolean | undefined;

  const darkTheme = configuration.get("darkTheme") as string | undefined;

  const lightTheme = configuration.get("lightTheme") as string | undefined;

  const lightThemeTime = configuration.get("lightThemeTime") as
    | number
    | undefined;

  const darkThemeTime = configuration.get("darkThemeTime") as
    | number
    | undefined;

  return {
    enabled: !!enabled,
    darkTheme: darkTheme,
    lightTheme: lightTheme,
    lightThemeTime: lightThemeTime ?? 6,
    darkThemeTime: darkThemeTime ?? 19,
  };
};

const setConfig = (config: Partial<Config>) => {
  const configuration = vscode.workspace.getConfiguration(EXTENSION_ID);

  if ("enabled" in config) {
    configuration.update(
      "enabled",
      config.enabled,
      vscode.ConfigurationTarget.Global
    );
  }

  if ("darkTheme" in config) {
    configuration.update(
      "darkTheme",
      config.darkTheme,
      vscode.ConfigurationTarget.Global
    );
  }

  if ("lightTheme" in config) {
    configuration.update(
      "lightTheme",
      config.lightTheme,
      vscode.ConfigurationTarget.Global
    );
  }

  if ("lightThemeTime" in config) {
    configuration.update(
      "lightThemeTime",
      config.lightThemeTime,
      vscode.ConfigurationTarget.Global
    );
  }

  if ("darkThemeTime" in config) {
    configuration.update(
      "darkThemeTime",
      config.darkThemeTime,
      vscode.ConfigurationTarget.Global
    );
  }
};

const applyTheme = (theme: string) => {
  vscode.workspace
    .getConfiguration("workbench")
    .update("colorTheme", theme, vscode.ConfigurationTarget.Global);
};

type Config = {
  enabled: boolean;
  darkTheme?: string;
  lightTheme?: string;
  lightThemeTime: number;
  darkThemeTime: number;
};
