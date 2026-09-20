<script setup lang="ts">
const items = [
  { id: 'area', title: '۱. سهم متراژی (ماده ۴)', body: 'هزینه‌های مرتبط با زیربنای اختصاصی — موتورخانه، بام، تأسیسات مرکزی — به نسبت متراژ هر واحد تقسیم می‌شود.' },
  { id: 'formula', title: '۲. انواع تقسیم', body: 'متراژی، مساوی (برای هزینه‌های غیرمرتبط با متراژ)، نفری (مصرف و ساکنان به‌اضافه معادل مهمان)، و اختصاصی (فقط یک واحد). روش تقسیم را مدیر ساختمان تعیین می‌کند و در نرم‌افزار ثبت می‌شود.' },
  { id: 'parking', title: '۳. پارکینگ', body: 'حق استفاده از پارکینگ به هر واحد جداگانه تعلق دارد. هزینه نگهداری پارکینگ معمولاً فقط بین واحدهای دارای پارکینگ تقسیم می‌شود؛ مگر مدیر خلاف آن را اعمال کند.' },
  { id: 'roof', title: '۴. پشت‌بام و کولرها', body: 'پشت‌بام قسمت مشترک است. سرویس کولر هر واحد اختصاصی است. ایزوگام عمومی متراژی است مگر خرابی مستقیماً از کولر یک واحد باشد.' },
  { id: 'manager', title: '۵. مدیر و حق‌الزحمه', body: 'مدیر بابت واحد خودش مکلف به پرداخت شارژ است. حق‌الزحمه فقط وقتی در هزینه‌های ماه ثبت شود که مبلغ آن مشخص شده باشد.' },
  { id: 'tenant', title: '۶. مالک و مستأجر', body: 'هزینه‌های جاری معمولاً بر عهده استفاده‌کننده و هزینه‌های اساسی بر عهده مالک است.' },
  { id: 'guest', title: '۷. مهمان', body: 'مهمان کوتاه‌مدت سهم متراژی و مساوی را عوض نمی‌کند. برای هزینه نفری، معادل‌نفر واحد برابر است با ساکنان دائم به‌اضافه (نفرشب مهمان ÷ روزهای همان ماه). اگر مهمان عملاً کل ماه در واحد باشد، او را ساکن دائم همان ماه ثبت کنید. خسارت یا سرویس اختصاصی مهمان، هزینه اختصاصی همان واحد است.' },
  { id: 'action', title: 'اقدام مدیر', body: 'تعداد واحدها، متراژ، پارکینگ، ساکنان دائم، نفرشب مهمان هر ماه، روش تقسیم هر هزینه، حق‌الزحمه مدیر و ثبت مالک/مستأجر را مشخص و در نرم‌افزار ثبت کنید.' },
]
</script>

<template>
  <div class="page">
    <section class="hero">
      <p class="hero-label">پاسخ کوتاه</p>
      <p class="hero-title">تناسب با متراژ</p>
      <p class="hero-unit">
        مبنای قانونی شارژ، اصل تناسب با مساحت اختصاصی است؛ مگر هزینه‌ای که به متراژ ربط ندارد.
      </p>
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
  </div>
</template>
