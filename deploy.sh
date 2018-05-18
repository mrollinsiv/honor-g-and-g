#!/bin/bash
cd ~/honor-g-and-g
git pull
grunt
pm2 restart 0
