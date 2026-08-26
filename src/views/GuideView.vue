<script setup lang="ts">
import AppIcon from '../components/AppIcon.vue'

const items = [
  { id: 'area', title: '۱. سهم متراژی واحدها', body: 'مجموع زیربنای اختصاصی ۳۲۳٫۵۹ مترمربع است. سهم هر واحد از تقسیم متراژ همان واحد بر این عدد به دست می‌آید.' },
  { id: 'formula', title: '۲. فرمول نرم‌افزار', body: 'متراژی برای تأسیسات مرکزی و بام، مساوی برای نظافت و آسانسور، و آب ترکیبی ۳۰٪ مساوی + ۷۰٪ نفری است مگر مجمع خلاف آن را تصویب کند.' },
  { id: 'roof', title: '۳. پشت‌بام و کولرها', body: 'پشت‌بام قسمت مشترک است. سرویس کولر هر واحد بر عهده همان واحد است. ایزوگام عمومی متراژی است مگر خرابی مستقیماً از کولر یک واحد باشد.' },
  { id: 'manager', title: '۴. مدیر و حق‌الزحمه', body: 'مدیر بابت واحد خودش مکلف به پرداخت شارژ است. حق‌الزحمه فقط با تصویب مجمع معتبر است. قطع خودسرانه آب یا گاز می‌تواند مسئولیت ایجاد کند.' },
  { id: 'tenant', title: '۵. مالک و مستأجر', body: 'مالک یا مستأجر بودن مبنای تقسیم بین واحدها را عوض نمی‌کند. هزینه‌های جاری معمولاً بر عهده استفاده‌کننده و هزینه‌های اساسی بر عهده مالک است.' },
  { id: 'risk', title: 'مهم‌ترین ریسک‌ها', body: 'توافق شفاهی در زمان اختلاف به‌سختی اثبات می‌شود. بیمه آتش‌سوزی ساختمان و بیمه مسئولیت مدیر را در برنامه بگذارید.' },
  { id: 'action', title: 'اقدام پیشنهادی مجمع', body: 'روش تقسیم هزینه‌ها، حق‌الزحمه مدیر، محاسبه آب و برق کولر، سقف اختیار مدیر و ثبت مالک و مستأجر هر واحد را تصویب کنید.' },
]
</script>

<template>
  <section class="panel mb-3">
    <h2 class="h5 d-flex align-items-center gap-2">
      <AppIcon name="book" />
      پاسخ کوتاه
    </h2>
    <p class="mb-0">
      مبنای قانونی شارژ، <strong>اصل تناسب با مساحت اختصاصی</strong> است؛ مگر هزینه‌ای که ارتباطی با متراژ ندارد و مساوی تقسیم می‌شود، یا مجمع عمومی مالکان روش دیگری را تصویب کند.
    </p>
    <p class="mt-2 mb-0 text-muted">مبنای اصلی: قانون تملک آپارتمان‌ها، مواد ۴ و ۱۰.</p>
  </section>

  <div class="accordion" id="guideAccordion">
    <div v-for="(item, index) in items" :key="item.id" class="accordion-item">
      <h2 class="accordion-header">
        <button
          class="accordion-button"
          :class="{ collapsed: index !== 0 }"
          type="button"
          data-bs-toggle="collapse"
          :data-bs-target="`#guide-${item.id}`"
          :aria-expanded="index === 0 ? 'true' : 'false'"
        >
          {{ item.title }}
        </button>
      </h2>
      <div
        :id="`guide-${item.id}`"
        class="accordion-collapse collapse"
        :class="{ show: index === 0 }"
        data-bs-parent="#guideAccordion"
      >
        <div class="accordion-body text-muted">{{ item.body }}</div>
      </div>
    </div>
  </div>
</template>
