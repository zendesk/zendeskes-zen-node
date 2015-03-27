var zendesk = require('node-zendesk'),
    fs      = require('fs');

var client = zendesk.createClient({
  username:  'cherub.kumar@gmail.com',
  token:     'nkwVEwjouOmciP1uuchp86EqiOGPgLEaaZpQx8Qm',
  subdomain: 'wtp',
  remoteUri: 'https://wtp.zendesk.com/api/v2/help_center',
  // disableGlobalState: true,
  // debug: true
});

client.categories.list(function (err, req, result) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(JSON.stringify(result[0], null, 2, true));//gets the first page
});
