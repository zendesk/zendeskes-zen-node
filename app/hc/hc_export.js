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
var categories, categorized_sections, sectioned_articles;

// Fetch all Categories, Sections and Articles
client.categories.list(function (err, req, result) {
  if (err) {
    console.log(err);
    return;
  }
  categories = result;
  console.log('Categories',categories);
});

client.sections.list(function (err, req, result) {
  if (err) {
    console.log(err);
    return;
  }

  categorized_sections = _.groupBy(result, function(section){ return section.category_id; });
  console.log('Categorized sections:',categorized_sections);
});

client.articles.list(function (err, req, result) {
  if (err) {
    console.log(err);
    return;
  }

  // Group Articles by section
  sectioned_articles = _.groupBy(result, function(article){ return article.section_id; });
  console.log('sectioned_articles',sectioned_articles);
});
