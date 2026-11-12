export const ads = {
  enabled: false, // flip after AdSense approval
  publisherId: 'ca-pub-XXXXXXXXXXXXXXXX',
  slots: {
    belowResult: '',
    midContent: '',
    footer: '',
  },
  maxSlotsPerPage: 3,
};

export type AdsConfig = typeof ads;
