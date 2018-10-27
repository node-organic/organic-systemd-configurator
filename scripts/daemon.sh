#!/bin/bash

. ./.nvm/nvm.sh
nvm use $2
CELL_MODE=_production node index.js
