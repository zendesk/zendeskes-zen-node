// Dependencies
var zendesk = require('node-zendesk'),
    fs      = require('fs'),
    _ = require('underscore-node');

// Initialize client
var client = zendesk.createClient({
  username:  'cherub.kumar@gmail.com',
  token:     'nkwVEwjouOmciP1uuchp86EqiOGPgLEaaZpQx8Qm',
  subdomain: 'wtp',
  remoteUri: 'https://wtp.zendesk.com/api/v2/help_center',
  // disableGlobalState: true,
  // debug: true,
  helpcenter: true
});


// Global Variables
var categories, sections, articles;

// Fetch all Categories, Sections and Articles
client.categories.list(function (err, req, result) {
  if (err) {
    console.log(err);
    return;
  }
  categories = result;
});

client.sections.list(function (err, req, result) {
  if (err) {
    console.log(err);
    return;
  }
  sections = result;
});

client.articles.list(function (err, req, result) {
  if (err) {
    console.log(err);
    return;
  }
  articles = result;
});
