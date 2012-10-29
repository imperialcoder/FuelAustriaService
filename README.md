FuelAustriaService
==================

old:
imperialcoder.no.de


Append this to your $HOME/.ssh/config file
Host imperialcoder.no.de
  Port 62950
  User node
  ForwardAgent yes
To run an existing GIT repository with a file called server.js in the root then do this:
cd repo
git remote add imperialcoder.no.de imperialcoder.no.de:repo
git push imperialcoder.no.de master
If everything goes correctly your server will be running at http://imperialcoder.no.de/ 

To SSH into your machine do:
ssh imperialcoder.no.de