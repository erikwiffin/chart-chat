import type { CodegenConfig } from "@graphql-codegen/cli";
import { loadEnv } from "vite";

const mode = process.env.MODE ?? process.env.NODE_ENV ?? "development";
const env = loadEnv(mode, process.cwd());

const config: CodegenConfig = {
  schema: env.VITE_GRAPHQL_HTTP_URL || "../backend/app/schema.graphql",
  // Falls back to local schema file when backend isn't running
  documents: ["src/**/*.graphql"],
  generates: {
    "src/__generated__/": {
      preset: "client",
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
      },
    },
  },
};

export default config;
