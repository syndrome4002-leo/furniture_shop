'use strict';

// Content-type actions the public (unauthenticated) API should be allowed to
// call. Granting these in bootstrap means a fresh database serves real content
// immediately — no manual clicking through Settings → Roles → Public.
const PUBLIC_PERMISSIONS = {
  'api::homepage-hero.homepage-hero': ['find'],
  'api::nav-link.nav-link': ['find', 'findOne'],
};

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * Grants the Public role read access to the site's content types so the
   * Next.js app can fetch real data instead of falling back to mock content.
   */
  async bootstrap({ strapi }) {
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) {
      strapi.log.warn('[bootstrap] Public role not found; skipping permissions.');
      return;
    }

    for (const [contentType, actions] of Object.entries(PUBLIC_PERMISSIONS)) {
      for (const action of actions) {
        const permAction = `${contentType}.${action}`;
        const existing = await strapi
          .query('plugin::users-permissions.permission')
          .findOne({ where: { action: permAction, role: publicRole.id } });

        if (!existing) {
          await strapi.query('plugin::users-permissions.permission').create({
            data: { action: permAction, role: publicRole.id },
          });
          strapi.log.info(`[bootstrap] Granted Public permission: ${permAction}`);
        }
      }
    }
  },
};
