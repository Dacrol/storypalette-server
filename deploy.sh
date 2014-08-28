#!/bin/bash

WHOAMI=`id -u`
trap "exit 1" TERM
export TOP_PID=$$
#export NODE_ENV=production
export NODE_DIR=/usr/local/src/node

function issue () {
	$*
	if [ $? -ne 0 ] ; then
		echo "Failed to execute command ($*)"
		kill -s TERM $TOP_PID
	fi
}

#if [ ! "$WHOAMI" = "0" ] ; then
	#echo "You need to run this script with sudo"
	#exit 1
#fi

echo "Updating storypalette-server"
#issue sudo -u www-data git pull --tags origin master
issue git pull --tags origin master

echo "Updating storypalette-editor"
issue cd ../storypalette-editor
issue git pull --tags origin master
issue grunt collate

echo "Updating storypalette-player"
issue cd ../storypalette-player
issue git pull --tags origin master
issue grunt collate
#issue sudo -u www-data npm install --nodedir=$NODE_DIR

echo "Updating storypalette-performer-touch"
issue cd ../storypalette-performer-touch
issue git pull --tags origin master
issue grunt collate

#echo "Running install in client"
#issue cd client
#issue sudo -u www-data npm install --nodedir=$NODE_DIR
#issue sudo -u www-data grunt


#echo "Fixing permisions"
#issue sudo -u www-data chown -R www-data:webbies *
