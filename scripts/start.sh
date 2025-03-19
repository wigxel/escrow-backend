#!/bin/bash
BUILD_DIR=${BUILD_DIR:-"dist"}
SOURCE_DIR=${SOURCE_DIR:-"src"}

# Run npm install
echo "Installing..."
npm install

echo "Manipulating node memory...."
export NODE_OPTIONS=--max-old-space-size=4096

# Build the application
echo "Building the application..."
npm build

# Database migration and seeding
echo "Migrating and seeding database..."
npm run db:migrate --env=production
npm run db:seed --env=production

# PM2 process management
echo "Managing PM2 process..."
if pm2 list | grep -q "$PM2_APP"; then
    echo "Stopping existing PM2 process..."
    pm2 stop "$PM2_APP"
fi

echo "Delete PM2 process..."
if pm2 list | grep -q "$PM2_APP"; then
    echo "Deleting existing PM2 process..."
    pm2 delete "$PM2_APP"
fi

echo "Starting new PM2 process..."
pm2 start npm --name="$PM2_APP" -- run start

echo "Deployment script executed successfully."
