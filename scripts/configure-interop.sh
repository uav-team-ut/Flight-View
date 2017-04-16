#/bin/bash

#######################################################################
# Takes a fixture file (.yaml) and loads in into the interop docker.
# 2nd arg (optional) is docker image name; defaults to "interop-server"
# Assumes docker is installed and the interop-server docker exists. 
# Updated April 16th, 2017											
#######################################################################

# Global Variables:
output="true"
interopDockerName="interop-server"
dockerFixtureFilePath="/interop/server/fixture.yaml"
inputFixtureFilePath=""


# Colours:
BOLD='\033[0;1m' #(OR USE 31)
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
GREEN='\033[0;32m'
BROWN='\033[0;33m'
RED='\033[1;31m'
NC='\033[0m' # No Color

# Helper Functions:
function print
{
    if [[ "$output" != "true" ]]; then return; fi

    N=0
    n="-e"

    if [[ "$*" == *" -n"* ]]; then
        N=1
        n="-ne"
    fi

    if [ "$#" -eq $((1 + $N)) ]; then
        echo $n $1
    elif [ "$#" -eq $((2 + $N)) ]; then
        printf ${2} && echo $n $1 && printf ${NC}
    else
        #printf ${RED} && echo "Error in print. Received: $*" && printf ${NC}
        printf ${RED} && echo "Received: $*" && printf ${NC}
    fi
}


function checkInputs
{
	# First make sure we're running as root (docker requires root)
	if [[ $UID != 0 ]]; then
        print "Please run this script with sudo:" $RED
        print "sudo $0 $*"
        exit 1
    fi

    # Make sure we have 1 argument or more
    if [[ "$#" == "0" ]]; then
    	print "Invalid arguments." $RED
    	print "$0 <path to yaml fixtures file>" $BOLD
    	exit 1
    fi

    # Check that the input file actually exists
    if [ -e $1 ]; then
    	inputFixtureFilePath="$1"
    else
    	print "Specified input file does not exist; please try again." $RED
    	exit 1
    fi

    # Check if alternate docker name is specified
    if [ "$2" ]; then
    	print "Using ${2} docker image" $PURPLE
    	interopDockerName="$2"
    fi
}

function startInteropDocker
{
	sudo docker start "$interopDockerName" > /dev/null 2>&1

	return $?
}

function copyFileToDocker
{
	sudo docker cp "$inputFixtureFilePath" "${interopDockerName}:${dockerFixtureFilePath}"

	return $?
}

function loadFixtures
{
	sudo docker exec -i ${interopDockerName} bash -c \
	"python /interop/server/manage.py loaddata ${dockerFixtureFilePath}" \
	> /dev/null 2>&1

	return $?
}

function fin
{
	if [[ "$1" != 0 ]]; then
		print "Something went wrong. Good Luck!" $RED
		exit $1
	else
		print "Interop Server successfully configured." $CYAN
		exit 0
	fi
}

checkInputs "${@}" && \
startInteropDocker && \
copyFileToDocker && \
loadFixtures

fin $?