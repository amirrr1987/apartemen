<script setup lang="ts">
import AppIcon from '../components/AppIcon.vue'

const items = [
  { id: 'area', title: '۱. سهم متراژی (ماده ۴)', body: 'هزینه‌های مرتبط با زیربنای اختصاصی — موتورخانه، بام، تأسیسات مرکزی — به نسبت متراژ هر واحد تقسیم می‌شود.' },
  { id: 'formula', title: '۲. انواع تقسیم', body: 'متراژی، مساوی (برای هزینه‌های غیرمرتبط با متراژ)، نفری (مصرف و ساکنان)، و اختصاصی (فقط یک واحد). روش تقسیم باید در مجمع تصویب شود.' },
  { id: 'parking', title: '۳. پارکینگ', body: 'حق استفاده از پارکینگ به هر واحد جداگانه تعلق دارد. هزینه نگهداری پارکینگ معمولاً فقط بین واحدهای دارای پارکینگ تقسیم می‌شود؛ مگر مجمع خلاف آن را تصویب کند.' },
  { id: 'roof', title: '۴. پشت‌بام و کولرها', body: 'پشت‌بام قسمت مشترک است. سرویس کولر هر واحد اختصاصی است. ایزوگام عمومی متراژی است مگر خرابی مستقیماً از کولر یک واحد باشد.' },
  { id: 'manager', title: '۵. مدیر و حق‌الزحمه', body: 'مدیر بابت واحد خودش مکلف به پرداخت شارژ است. حق‌الزحمه فقط با تصویب مجمع معتبر است.' },
  { id: 'tenant', title: '۶. مالک و مستأجر', body: 'هزینه‌های جاری معمولاً بر عهده استفاده‌کننده و هزینه‌های اساسی بر عهده مالک است.' },
  { id: 'action', title: 'اقدام پیشنهادی مجمع', body: 'تعداد واحدها، متراژ، پارکینگ، روش تقسیم هر هزینه، حق‌الزحمه مدیر و ثبت مالک/مستأجر را تصویب و در نرم‌افزار ثبت کنید.' },
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
