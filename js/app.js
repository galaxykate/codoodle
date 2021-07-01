let canvasW = 600
let canvasH = 500



function createRandomDrawer(hue, onDraw) {
	let pt = Vector.polar(Math.random()*300, Math.random()*100)
	pt.id = Math.floor(Math.random()*9999)
	let color = [hue,100,50]
	setInterval(() => {
		if (app.p5 && app.autodraw) {

			let p = app.p5
		
			let t = p.millis()*.001
			
			let size = 20*p.noise(t)
			
			// Randomly walk this point around to test
			pt.addPolar(size, 20*p.noise(t, pt.id))
			
				pt.mult(.96)

			// Change color
			// color[0] = (500*p.noise(t*.1, pt.id + 100))%360
			// color[2] = 100*p.noise(t*.1, pt.id + 300)
			
			// Center the drawing
			onDraw(pt, {color:color,size: size})
		}
	}, 30)

}

let app = {
	colors: [[0,0,0]],
	currentColor: [0,0,0],
	currentSize: 10,
	autodraw: false,

	init() {
		io.init()

		// Create a constantly-drawing AI
		createRandomDrawer(io.hue, (pt, toolData) => {
	  		app.drawAndBroadcast(pt, toolData)
  		})

  		// Select some random colors for the palette for asymmetrical drawing (who has green?)
  		for (var i = 0; i < 4; i++) {
  			app.colors.push([Math.random()*360, 100, Math.random()*100])
  		}
	},


	draw(p) {
		// Draw something every frame
		// Uncomment this line to 
		// p.background(0, 100, 100, .04)		
	},

	// Did the user draw something?  
	// Lets broadcast that to the host,
	//  or if we are the host, tell all the other players
	drawAndBroadcast(pt, toolData) {
		// You may want to modify the tool data, right now its just size and color
		if (!toolData) {
			toolData = {
				color: app.currentColor,
				size: app.currentSize,
			}
		}

		let data = {
			pt: pt,
			toolData: toolData,
		}

		// Broadcast it, and draw it to my own canvase
		io.broadcastMove(data)
		app.drawAtPoint(pt, toolData)
	},

	// Draw this to P5 (this is where you'd do any fancy drawing stuff with the tooldata)
	drawAtPoint(pt, toolData) {
		let p = this.p5
		p.push()
		p.translate(p.width/2, p.height/2)
		
		p.noStroke()
		p.fill(...toolData.color)
		p.circle(...pt, toolData.size)

		p.pop()
	}

}


let noise = () => 0


// Setup and Vue things, ignore this, probably
document.addEventListener("DOMContentLoaded", function(){
	app.init()

	Vue.component("color-button", {
		template: `<button class="colorswatch" @click="setColor" :style="style" ></button>`,
		computed: {
			style() {
				return {
					backgroundColor: `hsla(${this.color[0]},${this.color[1]}%,${this.color[2]}% )`
				}
			}
		},
		methods: {
			setColor() {
				app.currentColor = this.color
			}
		},
		props: ["color"]
	})

	// P5
	new Vue({
		el : "#app",
		template: `<div id="app">


			<div class="p5-holder" ref="p5"></div>
			<div class="drawing controls">
				<div>
					<color-button v-for="color in app.colors" :color="color" />
				</div>
				<div>autodraw: <input v-model="app.autodraw" type="checkbox" /></div>
			</div>

			<div class="section">
				<div v-if="io.isHost">
					<span style="color:blue">host:</span>
					<span class="uid">"{{io.roomID}}"</span>
					<div class="section">
						connected to:
						<div v-for="connectedPeer in io.guestConnections">
							<span class="uid">{{connectedPeer.peer}}</span>
						</div>
						<div v-if="io.guestConnections.length === 0" style="font-style:italic">no-one connected yet</div>
					</div>
				</div>

				<div v-else-if="io.isGuest">
					<span style="color:green">guest:</span>
					<span class="uid">"{{io.roomID}}"</span>
					<div style="font-size: 70%">guest id: <span class="uid">{{io.guestID}}</span></div>
				</div>

				<div v-else>
					<span style="color:purple">awaiting connection...</span>
					Room id:<input v-model="io.roomID"></input>
					<button @click="io.hostRoom()">create room</button>
					<button @click="io.joinRoom()">join room</button>
					
				</div>

			</div>
			

			<div>
				<div class="message-log" v-for="msg in io.log">{{msg}}</div>
			</div>
			
		</div>`,


		mounted() {

			// Initialize the P5 canvas and handlers
			// You can ignore this
			app.p5 = new p5((p) => {
			 	app.p = p

				noise = p.noise

				// Basic P5 setup and handlers
				p.setup = () => {
					p.createCanvas(canvasW, canvasH)
					p.colorMode(p.HSL)
					p.ellipseMode(p.RADIUS)
				}

				p.mouseDragged = () => {
					// Did the user draw?
					app.drawAndBroadcast([p.mouseX - p.width/2, p.mouseY - p.height/2])
				}

				p.draw = () => {
					app.draw(p)
				}

			}, this.$refs.p5)


		},
		
		data() {
			return {
				io: io,
				app: app,
				
			}
		}
		
	}) 
})


function sigmoid(v) {
	return 1 / (1 + Math.pow(Math.E, -v));
}

function unitSigmoid(v, range=1) {
	return 1 / (1 + Math.pow(Math.E, -range*(v - .5)));
}

