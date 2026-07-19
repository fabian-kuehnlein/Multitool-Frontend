const { writeFileSync } = require("fs");

const target = "./src/environments/environment.prod.ts";

const content = `
export const environment = {
  production: true,
  MultitoolApi: '${process.env.API_URL}'
};
`;

writeFileSync(target, content);
