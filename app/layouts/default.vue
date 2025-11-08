<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { useI18n } from "vue-i18n";
import { watchEffect } from "vue";

const { locale, setLocale, t } = useI18n();

watchEffect(() => {
  document.documentElement.dir = locale.value === "fa" ? "rtl" : "ltr";
});
const toggleLanguage = () => {
  const newLocale = locale.value === "fa" ? "en" : "fa";
  setLocale(newLocale);
};
const headerItems = computed<NavigationMenuItem[]>(() => [
  {
    label: t("home.title"),
    to: "/",
    icon: "i-heroicons-home",
  },
  {
    label: t("about-us.title"),
    to: "/about-us",
    icon: "i-heroicons-information-circle",
  },
  {
    label: t("gallery.title"),
    to: "/gallery",
    icon: "i-heroicons-photo",
  },
  {
    label: t("contact-us.title"),
    to: "/contact-us",
    icon: "i-heroicons-envelope",
  },
]);

const footerItems: NavigationMenuItem[] = [
  {
    label: "Figma Kit",
    to: "https://go.nuxt.com/figma-ui",
    target: "_blank",
  },
  {
    label: "Playground",
    to: "https://stackblitz.com/edit/nuxt-ui",
    target: "_blank",
  },
  {
    label: "Releases",
    to: "https://github.com/nuxt/ui/releases",
    target: "_blank",
  },
];
</script>

<template>
  <div class="">
    <UHeader>
      <template #title>
        <img
          src="https://dr-jamei.ir/wp-content/themes/Avrin-Theme/img/logo.png"
          alt="Logo"
          width="44"
          height="44"
        />
        <UNavigationMenu :items="headerItems" />
      </template>

      <template #right>
        <UColorModeButton />
        <!-- change language -->
        <UButton
          icon="i-heroicons-language"
          color="neutral"
          variant="ghost"
          aria-label="Change Language"
          @click="toggleLanguage"
        />
      </template>
    </UHeader>
    <UMain>
      <slot />
    </UMain>
    <UFooter>
      <template #left>
        <p class="text-muted text-sm">
          Copyright © {{ new Date().getFullYear() }}
        </p>
      </template>

      <UNavigationMenu :items="footerItems" variant="link" />

      <template #right>
        <UButton
          icon="i-simple-icons-discord"
          color="neutral"
          variant="ghost"
          to="https://go.nuxt.com/discord"
          target="_blank"
          aria-label="Discord"
        />
        <UButton
          icon="i-simple-icons-x"
          color="neutral"
          variant="ghost"
          to="https://go.nuxt.com/x"
          target="_blank"
          aria-label="X"
        />
        <UButton
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          to="https://github.com/nuxt/nuxt"
          target="_blank"
          aria-label="GitHub"
        />
      </template>
    </UFooter>
  </div>
</template>
