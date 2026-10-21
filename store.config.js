// EAS Metadata entry point (eas.json → submit.production.ios.metadataPath).
// Store copy lives in store.config.json. App Review requires a contact with a
// phone number, which must not be committed, so it comes from env:
//   ASC_REVIEW_PHONE="+90 5xx xxx xx xx" npx eas-cli metadata:push
// Without it the review section (contact + notes) is left untouched in ASC.
const config = require('./store.config.json');

const phone = process.env.ASC_REVIEW_PHONE;
if (phone) {
  config.apple.review = {
    firstName: 'Enes',
    lastName: 'Günel',
    email: 'enesgunel@enesgunel.com',
    phone,
    ...config.apple.review,
  };
} else {
  delete config.apple.review;
}

module.exports = config;
