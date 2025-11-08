// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  modules: [
    "@nuxt/content",
    "@nuxt/eslint",
    "@nuxt/scripts",
    "@nuxt/image",
    "@nuxt/test-utils",
    "@nuxt/ui",
    "@nuxtjs/i18n",
  ],
  app: {
    head: {
      title: "دکتر علی جامعی - متخصص طب سوزنی و جراحی عمومی",
      meta: [
        {
          name: "description",
          content: "دکتر علی جامعی - متخصص طب سوزنی و جراحی عمومی",
        },
        { name: "keywords", content: "دکتر علی جامعی, طب سوزنی, جراحی عمومی" },
      ],
      link: [
        {
          rel: "stylesheet",
          href: "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css",
        },
      ],
    },
  },
  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json', dir: 'ltr' },
      { code: 'fa', iso: 'fa-IR', name: 'فارسی', file: 'fa.json', dir: 'rtl' }
    ],
    defaultLocale: "fa",
    strategy: "prefix_except_default",
    langDir: "locales/",
  },
});
