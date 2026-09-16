import { Grid } from 'swiper/modules';

export const DEFAULT_PREVIEW_CARDS = 5.25;

export const swiperSettings = {
  modules: [Grid],
  loop: false,
  slidesPerView: 2.25,
  slidesPerGroup: 2,
  spaceBetween: 10,
  grid: {
    rows: 2,
    fill: 'row',
  },
  breakpoints: {
    // For Pad: width larger than 640px
    640: {
      slidesPerView: 3.25,
      slidesPerGroup: 3,
      grid: {
        rows: 1,
        fill: 'row',
      },
    },
    // For Desktop: width larger than 1024px
    1024: {
      slidesPerView: 5.25,
      slidesPerGroup: 5,
      grid: {
        rows: 1,
        fill: 'row',
      },
    },
  },
};

export const swiperSettings_1_25_0 = {
  modules: [Grid],
  loop: false,
  slidesPerView: 2,
  slidesPerGroup: 4,
  spaceBetween: 10,
  grid: {
    rows: 2,
    fill: 'row',
  },
  breakpoints: {
    640: {
      slidesPerView: 3,
      slidesPerGroup: 3,
      grid: { rows: 1, fill: 'row' },
    },
    1024: {
      slidesPerView: 5,
      slidesPerGroup: 5,
      grid: { rows: 1, fill: 'row' },
    },
  },
};

export function getSwiperSettings(isMd, isAiVideoEditing) {
  const baseSettings = { ...swiperSettings };

  if (isMd && isAiVideoEditing) {
    return {
      ...baseSettings,
      grid: { rows: 1, fill: 'row' },
    };
  }
  return baseSettings;
}

export function getMobileSettings(cardCount) {
  const rows2 = Math.ceil(cardCount / 2);
  const rows3 = Math.ceil(cardCount / 3);
  const rows4 = Math.ceil(cardCount / 4);
  const rows5 = Math.ceil(cardCount / 5);

  return {
    modules: [Grid],
    loop: false,
    allowTouchMove: true,
    // base: <=768
    slidesPerView: 2,
    slidesPerGroup: 2,
    spaceBetween: 10,
    grid: { rows: rows2, fill: 'row' },
    breakpoints: {
      // 769~991：3 cards, gap=20
      769: {
        slidesPerView: 3,
        slidesPerGroup: 3,
        spaceBetween: 20,
        grid: { rows: rows3, fill: 'row' },
      },
      // 992~1199：3 cards, gap=20
      992: {
        slidesPerView: 3,
        slidesPerGroup: 3,
        spaceBetween: 20,
        grid: { rows: rows3, fill: 'row' },
      },
      // 1200~1919：4 cards, gap=20
      1200: {
        slidesPerView: 4,
        slidesPerGroup: 4,
        spaceBetween: 20,
        grid: { rows: rows4, fill: 'row' },
      },
      // 1920：5 cards, gap=20
      1920: {
        slidesPerView: 5,
        slidesPerGroup: 5,
        spaceBetween: 20,
        grid: { rows: rows5, fill: 'row' },
      },
    },
  };
}

