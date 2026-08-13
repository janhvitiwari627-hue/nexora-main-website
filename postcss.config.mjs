const normalizedCwd = process.cwd().replaceAll("\\", "/");
const buildingEmbeddedTemplate = normalizedCwd.endsWith("/template-app");

const config = {
  plugins: buildingEmbeddedTemplate
    ? {}
    : {
        "@tailwindcss/postcss": {},
      },
};

export default config;
