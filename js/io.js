let io = {
	// Prefix our rooms with some value so that we don't collide in the Peerjs namespace
	prefix: "codoodle",

	// A place to output info
	log: [],

	// A starting room ID if we don't have one in the querystring
	roomID: Math.random().toString(36).substring(7).toUpperCase(), // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
				
	hue: Math.random()*360,
	
	isGuest: false,
	guestID: undefined,
	guestConnections: [],

	isHost: false,
	hostConnection: undefined,

	
	init() {
		console.log("init IO")
		
		// Get the initial info from the Query string ie 'myurl.com/?autodraw=true&color=5&id="test'
		// This is handy for testing without having to click a bunch of buttons
		//   we can do the setup in the url and just refresh the page!
		// (more about this from https://www.sitepoint.com/get-url-parameters-with-javascript/)
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);

		// Autodrawing?
		app.autodraw = urlParams.get("autodraw")||false
		// ID of the room we are hosting or connecting to
		io.roomID = urlParams.get("room")||io.roomID	  	

		// Automatically start in host or guest mode
		let startMode = urlParams.get("mode")
		switch(startMode) {
			case "host": 
				io.hostRoom()
				break
			case "join": 
				io.joinRoom()
				break
		}
	},


	joinRoom() {
		// Let Peerjs assign us an ID
		io.peer = new Peer(); 

		io.peer.on('open', function(id) {
			io.isGuest = true
			
			// Save the id we connected with as our guest id
			io.log.push(`Joining room '${io.roomID}' as guest ${id}`)
			io.guestID = id


			io.hostConnection = io.peer.connect(io.prefix + io.roomID);
			io.hostConnection.on('open', function() {
				io.log.push(`Successfully connected to host '${io.roomID}'`)
				// Receive messages
				io.hostConnection.on('data', function(data) {
					// We got data from the host, someone has drawn something
					app.drawAtPoint([data.pt[0], data.pt[1]], data.toolData)
				});
			 
			});
		});



	},
	hostRoom() {
		// Open a new connection under our room id
		io.peer = new Peer(io.prefix + io.roomID); 

		io.peer.on('open', function(id) {
			io.isHost = true
			
			io.log.push(`Hosting as room '${io.roomID}'`)
			
			// Did someone just try to connect?
			io.peer.on('connection', function(conn) {
				io.log.push(`Guest '${conn.peer}' connected!`)
				
				io.guestConnections.push(conn)

				conn.on('data', function(data) {
					// We got data from a guest, this guest has drawn something
					// Broadcast to everyone else
					io.broadcastMove(data, conn.peer)
					app.drawAtPoint([data.pt[0], data.pt[1]], data.toolData)
				
				});
			});
		});
	},

	broadcastMove(data, skipPeer) {

		if (io.hostConnection) {
			io.hostConnection.send(data)
		} else if (io.isHost) {
			// Broadcast to everyone else
			io.guestConnections.forEach((conn) => {
				if (skipPeer === conn.peer) {
					// Ignore this peer (ie, if we are rebroadcasting a message from a guest, don't send it back to them)
					// console.log("skip", skipPeer)
				} else {
					conn.send(data)
				}
				
			})
		}

		
	}
}