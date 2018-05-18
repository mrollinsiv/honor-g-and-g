#!/bin/bash
git pull
grunt
pm2 restart 0
