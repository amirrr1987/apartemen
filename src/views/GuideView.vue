<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'

const items = [
  { id: 'area', title: '۱. سهم متراژی (ماده ۴)', body: 'هزینه‌های مرتبط با زیربنای اختصاصی — موتورخانه، بام، تأسیسات مرکزی — به نسبت متراژ هر واحد تقسیم می‌شود.' },
  { id: 'formula', title: '۲. انواع تقسیم', body: 'متراژی، مساوی، نفری، ترکیبی (نفر + متراژ با وزن قابل تنظیم)، و اختصاصی. روش تقسیم را مدیر برای هر هزینه انتخاب می‌کند. برای گاز زمستانی معمولاً ترکیبی مناسب است؛ آب معمولاً نفری.' },
  { id: 'parking', title: '۳. پارکینگ', body: 'حق استفاده از پارکینگ به هر واحد جداگانه تعلق دارد. هزینه نگهداری پارکینگ معمولاً فقط بین واحدهای دارای پارکینگ تقسیم می‌شود؛ مگر مدیر خلاف آن را اعمال کند.' },
  { id: 'roof', title: '۴. پشت‌بام و کولرها', body: 'پشت‌بام قسمت مشترک است. سرویس کولر هر واحد اختصاصی است. ایزوگام عمومی متراژی است مگر خرابی مستقیماً از کولر یک واحد باشد.' },
  { id: 'manager', title: '۵. مدیر و حق‌الزحمه', body: 'مدیر بابت واحد خودش مکلف به پرداخت شارژ است. حق‌الزحمه فقط وقتی در هزینه‌های ماه ثبت شود که مبلغ آن مشخص شده باشد.' },
  { id: 'tenant', title: '۶. مالک و مستأجر', body: 'هزینه‌های جاری معمولاً بر عهده استفاده‌کننده و هزینه‌های اساسی بر عهده مالک است.' },
  { id: 'guest', title: '۷. مهمان', body: 'مهمان کوتاه‌مدت سهم متراژی و مساوی را عوض نمی‌کند. برای هزینه نفری و بخش نفریِ ترکیبی، معادل‌نفر واحد برابر است با ساکنان دائم به‌اضافه (نفرشب مهمان ÷ روزهای همان ماه). اگر مهمان عملاً کل ماه در واحد باشد، او را ساکن دائم همان ماه ثبت کنید. خسارت یا سرویس اختصاصی مهمان، هزینه اختصاصی همان واحد است.' },
  { id: 'action', title: 'اقدام مدیر', body: 'تعداد واحدها، متراژ، پارکینگ، ساکنان دائم، نفرشب مهمان هر ماه، روش تقسیم هر هزینه، حق‌الزحمه مدیر و ثبت مالک/مستأجر را مشخص و در نرم‌افزار ثبت کنید.' },
]

const openId = ref(items[0]?.id ?? '')

function toggle(id: string) {
  openId.value = openId.value === id ? '' : id
}
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

    <div class="guide-list">
      <article v-for="item in items" :key="item.id" class="guide-item">
        <button
          class="guide-item__header"
          type="button"
          :aria-expanded="openId === item.id"
          :aria-controls="`guide-body-${item.id}`"
          @click="toggle(item.id)"
        >
          <span>{{ item.title }}</span>
          <AppIcon class="guide-item__chevron" name="chevron-down" size="sm" />
        </button>
        <div
          v-show="openId === item.id"
          :id="`guide-body-${item.id}`"
          class="guide-item__body"
          role="region"
        >
          {{ item.body }}
        </div>
      </article>
    </div>
  </div>
</template>
