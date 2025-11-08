<script setup lang="ts">
const sliderImages = [
  {
    src: "http://dr-jamei.ir/wp-content/uploads/2016/09/02.jpg",
    title: "طب سوزنی",
    alt: "طب سوزنی",
  },
  {
    src: "http://dr-jamei.ir/wp-content/uploads/2016/09/04.jpg",
    title: "طب سوزنی",
    alt: "طب سوزنی",
  },
  {
    src: "http://dr-jamei.ir/wp-content/uploads/2016/09/05.png",
    title: "طب سوزنی",
    alt: "طب سوزنی",
  },
];

const currentSlide = ref(0);

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % sliderImages.length;
};

const prevSlide = () => {
  currentSlide.value =
    (currentSlide.value - 1 + sliderImages.length) % sliderImages.length;
};

let interval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  // Auto-play slider
  interval = setInterval(() => {
    nextSlide();
  }, 5000);
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
  }
});
</script>

<template>
  <section class="mb-12">
    <div
      class="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-lg"
    >
      <div
        v-for="(image, index) in sliderImages"
        :key="index"
        :class="[
          'absolute inset-0 transition-opacity duration-500',
          currentSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0',
        ]"
      >
        <NuxtImg
          :src="image.src"
          :alt="image.alt"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div
          class="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"
        />
        <div
          class="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center z-20"
        >
          <h2 class="text-2xl md:text-3xl font-bold">{{ image.title }}</h2>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <button
        class="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all"
        aria-label="Previous slide"
        @click="prevSlide"
      >
        <UIcon name="i-heroicons-chevron-left" class="w-6 h-6" />
      </button>
      <button
        class="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all"
        aria-label="Next slide"
        @click="nextSlide"
      >
        <UIcon name="i-heroicons-chevron-right" class="w-6 h-6" />
      </button>

      <!-- Dots Indicator -->
      <div
        class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2"
      >
        <button
          v-for="(_, index) in sliderImages"
          :key="index"
          :class="[
            'w-3 h-3 rounded-full transition-all',
            currentSlide === index ? 'bg-white' : 'bg-white/50',
          ]"
          :aria-label="`Go to slide ${index + 1}`"
          @click="currentSlide = index"
        />
      </div>
    </div>
  </section>
</template>
