export const ads = {
  enabled: false, // flip after AdSense approval
  publisherId: 'ca-pub-1382627891298123',
  slots: {
    belowResult: '',
    midContent: '',
    footer: '',
  },
  maxSlotsPerPage: 3,
};

export type AdsConfig = typeof ads;
