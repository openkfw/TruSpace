import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
   baseDirectory: __dirname
});

const eslintConfig = [
   { ignores: ["src/components/ui/**"] },
   ...compat.config({
      extends: [
         "next/core-web-vitals",
         "plugin:@next/next/recommended",
         "plugin:react-hooks/recommended",
         "plugin:jsx-a11y/recommended",
         "plugin:@typescript-eslint/recommended",
         "plugin:import/recommended",
         "plugin:import/typescript",
         "prettier"
      ],
      plugins: ["unused-imports"],
      rules: {
         "unused-imports/no-unused-imports": "error",
         "@typescript-eslint/no-unused-vars": [
            "warn",
            {
               vars: "all",
               args: "after-used",
               argsIgnorePattern: "^_",
               varsIgnorePattern: "^_",
               ignoreRestSiblings: true
            }
         ],
         "import/order": [
            "warn",
            {
               groups: [
                  "builtin",
                  "external",
                  "internal",
                  "parent",
                  "sibling",
                  "index"
               ],
               alphabetize: { order: "asc", caseInsensitive: true }
            }
         ],
         "react-hooks/exhaustive-deps": "off",
         "react/jsx-boolean-value": ["warn", "never"],
         "react/self-closing-comp": "warn"
      }
   })
];

export default eslintConfig;
