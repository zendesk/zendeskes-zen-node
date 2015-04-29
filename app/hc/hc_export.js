var zendesk = require('node-zendesk'),
    fs      = require('fs'),
    async   = require('async'),
    _ = require('underscore-node');

var client = zendesk.createClient({
  username:  'cherub.kumar@gmail.com',
  token:     'nkwVEwjouOmciP1uuchp86EqiOGPgLEaaZpQx8Qm',
  remoteUri: 'https://wtp.zendesk.com/api/v2',
  subdomain: 'wtp',
  helpcenter: true,
  // debug: true,
  disableGlobalState: true
});

async.parallel([
    function(callback){
      client.articles.list(function (err, req, result) {
        callback(err, result);
        // console.log(err, req, result);
      });
    },
    function(callback){
      client.sections.list(function (err, req, result) {
        callback(err, result);
        // console.log(err, req, result);
      });
    },
    function(callback){
      client.categories.list(function (err, req, result) {
        callback(err, result);
        // console.log(err, req, result);
      });
    }
],
// optional callback
function(err, results){
    // the results array will equal ['one','two'] even though
    // the second function had a shorter timeout.
    var categories = results[2], sections = results[1], articles = results[0];
    // Construct JSON

    // Section articles
    var sectionedArticles = _.groupBy(articles, function (article) {
      return article.section_id;
    });

    // Insert sectionedArticles into sections

    _.each(sections, function (section) {
      section.articles = sectionedArticles[section.id];
    })

    // Categorize Sections
    var categorizedSections = _.groupBy(sections, function (section) {
      return section.category_id;
    });

    // Insert categorizedSections into categories
    _.each(categories, function (category) {
      category.sections = categorizedSections[category.id];
    })
    // console.log(categories);
    console.log(JSON.stringify(categories, null, 2));
    return categories;
});
