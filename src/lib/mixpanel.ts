import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

if (MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, {
    // 1. THE CONSENT GATE: This makes it illegal for Mixpanel to track anything 
    // until mixpanel.opt_in_tracking() is explicitly called later.
    opt_out_tracking_by_default: true,

    // 2. PRIVACY: Prevents Mixpanel from grabbing the user's IP address automatically.
    ip: false,

    debug: process.env.NODE_ENV !== 'production',
  });
}

export default mixpanel; 
