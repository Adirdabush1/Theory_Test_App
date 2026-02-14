const path = require("path");
const { spawnSync } = require("child_process");

const appRoot = path.resolve(__dirname, "..", "app");

const command = "npx expo export:web";

const result = spawnSync(command, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    EXPO_ROUTER_APP_ROOT: appRoot,
    EXPO_WEBPACK_DEFINE_ENVIRONMENT_AS_KEYS: "true",
  },
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
