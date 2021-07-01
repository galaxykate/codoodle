# Co-doodle
### the unfussiest multiplayer room-style creativity starter code

Do you want to have some people drawing together in an online room?  Do you not want to write any server code, much less try to run a server, Oauth, etc?

Here's a tiny platform using Peer.JS and P5 

### Usage

No dependencies besides Vue, P5 and Peer.js (included by CDN). You can drag the HTML into your browser and it'll just work!  

You can also use querystrings, e.g. 

```file:///Users/katecompton/Dropbox/Code/codoodle/index.html?room=hello&mode=host```

Including 

* "room=XXXXX" to set the starting room ID
* "mode=host" to autohost that room
* "mode=join" to autojoin that room
* "autodraw=true" to start an AI drawing automatically

### Warnings

No error handling is included for things like closing a room, users leaving a room, room collisions, etc.

