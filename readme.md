# Zen Node

## Setup Instructions

1. Run `npm install` to install dependencies


## Commands

Batch create sample organizations
`$ node app/tools/create-many-orgs.js`

Batch create sample users
`$ node app/tools/create-many-users.js`

Export organizations to CSV in app/tools/output directory
`$ node app/tools/export-organizations-to-csv.js`

Export users to CSV in app/tools/output directory
`$ node app/tools/export-users-to-csv.js`


## Dependencies

- [fast-csv](https://github.com/C2FO/fast-csv) (MIT)
- [limiter](https://github.com/jhurliman/node-rate-limiter) (MIT)
- [progress](https://github.com/tj/node-progress) (MIT)
- [prompt](https://github.com/flatiron/prompt) (MIT)
- [request](https://github.com/request/request) (Apache 2.0)
- [underscore-node](https://github.com/joonhocho/underscore-node) (MIT)
- [thread-sleep](https://www.npmjs.com/package/thread-sleep) (MIT)

## Under Development

- app/tools/Import-organizations-from-csv.js

# License

The MIT License (MIT)

Copyright (c) 2015 Ed Pritchard

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.