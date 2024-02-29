export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: ["kjQCN4L971Fy/MZ5Z/QbRQ==", "zj4zlXF3r13ryyCDm8Wzzw==", "vV37R7Voe9G28dbUxcC67Q==", "AncBkXp46GW2JeW9Ym3Mgw=="],
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
